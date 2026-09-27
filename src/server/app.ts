import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { FileEventLog } from "../persistence/event-log.js";
import { createRequestHandler } from "./routes.js";

export interface ServerOptions {
  readonly port?: number;
  readonly eventLogPath?: string;
}

export interface RunningStaticFieldServer {
  readonly url: string;
  readonly close: () => Promise<void>;
}

export async function startStaticFieldServer(
  options: ServerOptions = {},
): Promise<RunningStaticFieldServer> {
  const eventLog = new FileEventLog(options.eventLogPath ?? "var/static-field/history.jsonl");
  const history = await eventLog.loadHistory();
  const server = createServer(createRequestHandler(eventLog, history));

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 4173, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const runtime = await startStaticFieldServer();
  process.stdout.write(`STATIC FIELD listening at ${runtime.url}\n`);
}
