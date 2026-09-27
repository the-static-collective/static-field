import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { projectWorld } from "../kernel/projection.js";
import type { WorldEvent } from "../kernel/types.js";
import { FileEventLog } from "../persistence/event-log.js";
import { CAPACITY_VERBS } from "../world/charge.js";
import {
  dispatchFirstBellAction,
  type FirstBellActionType,
} from "../first-bell/reducer.js";

const STORY_ACTIONS = [
  "ENTER_PORCH","SET_OUT_CHAIR","ROUTE_CABLE","PUT_OUT_WATER","CHECK_DOOR",
  "CONTINUE_PREPARATION","BELL_1","BELL_2","NOTICE_OPEN_CORNER",
  "ENTER_RESONANCE","TRACE_PRIOR_RELATION","KNOCK","CLOSE_PLAY",
] as const;

const ALLOWED = new Set<string>([...STORY_ACTIONS, ...CAPACITY_VERBS]);

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of request) {
    raw += String(chunk);
    if (raw.length > 32_768) throw new Error("request body too large");
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

function contentType(path: string): string {
  switch (extname(path)) {
    case ".html": return "text/html; charset=utf-8";
    case ".js": return "text/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    default: return "application/octet-stream";
  }
}

export function createRequestHandler(
  eventLog: FileEventLog,
  initialHistory: readonly WorldEvent[],
) {
  let history: readonly WorldEvent[] = [...initialHistory];
  let mutationTail: Promise<void> = Promise.resolve();

  return async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    try {
      if (method === "GET" && url.pathname === "/api/state") {
        sendJson(response, 200, projectWorld(history));
        return;
      }
      if (method === "GET" && url.pathname === "/api/history") {
        sendJson(response, 200, history);
        return;
      }
      if (method === "POST" && url.pathname === "/api/action") {
        const body = await readJson(request);
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          sendJson(response, 400, { error: "body_must_be_object" });
          return;
        }
        const keys = Object.keys(body as Record<string, unknown>);
        const action = (body as { action?: unknown }).action;
        if (keys.length !== 1 || keys[0] !== "action" || typeof action !== "string" || !ALLOWED.has(action)) {
          sendJson(response, 400, { error: "declared_action_only" });
          return;
        }
        const mutation = mutationTail.then(async () => {
          try {
            const next = dispatchFirstBellAction(history, {
              type: action as FirstBellActionType,
              actor: { kind: "human", id: "human/local-player" },
              occurredAt: new Date().toISOString(),
            });
            for (const event of next.slice(history.length)) await eventLog.append(event);
            history = next;
            sendJson(response, 200, projectWorld(history));
          } catch (error) {
            sendJson(response, 409, {
              error: "action_rejected",
              reason: error instanceof Error ? error.message : String(error),
            });
          }
        });
        mutationTail = mutation.catch(() => undefined);
        await mutation;
        return;
      }

      if (method !== "GET") {
        sendJson(response, 405, { error: "method_not_allowed" });
        return;
      }

      const publicRoot = resolve(process.cwd(), "public");
      const relative = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
      if (!["index.html", "app.js", "styles.css"].includes(relative)) {
        sendJson(response, 404, { error: "not_found" });
        return;
      }
      const path = resolve(publicRoot, relative);
      const bytes = await readFile(path);
      response.statusCode = 200;
      response.setHeader("content-type", contentType(path));
      response.end(bytes);
    } catch (error) {
      sendJson(response, 500, {
        error: "internal_error",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
