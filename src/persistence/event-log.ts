import { appendFile, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { canonicalize, sha256Canonical } from "../kernel/canonical.js";
import { makeEvent } from "../kernel/events.js";
import type { WorldEvent } from "../kernel/types.js";

interface StoredLine {
  readonly eventHash: string;
  readonly event: WorldEvent;
}

export class FileEventLog {
  constructor(readonly path: string) {}

  async append(event: WorldEvent): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const line: StoredLine = { eventHash: sha256Canonical(event), event };
    await appendFile(this.path, `${canonicalize(line)}\n`, "utf8");
  }

  async loadHistory(): Promise<readonly WorldEvent[]> {
    let raw: string;
    try {
      raw = await readFile(this.path, "utf8");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return [];
      throw error;
    }
    if (!raw.trim()) return [];

    const seen = new Set<string>();
    const out: WorldEvent[] = [];
    for (const [index, line] of raw.trimEnd().split("\n").entries()) {
      let stored: StoredLine;
      try {
        stored = JSON.parse(line) as StoredLine;
      } catch {
        throw new Error(`malformed JSON at event log line ${index + 1}`);
      }
      if (!stored?.event || typeof stored.eventHash !== "string") {
        throw new Error(`malformed event envelope at line ${index + 1}`);
      }
      if (sha256Canonical(stored.event) !== stored.eventHash) {
        throw new Error(`event hash mismatch at line ${index + 1}`);
      }
      const validated = makeEvent({
        kind: stored.event.kind,
        occurredAt: stored.event.occurredAt,
        actor: stored.event.actor,
        evidenceClass: stored.event.evidenceClass,
        sourceStatus: stored.event.sourceStatus,
        payload: stored.event.payload,
        parentEventIds: stored.event.parentEventIds,
      });
      if (validated.eventId !== stored.event.eventId) {
        throw new Error(`event id mismatch at line ${index + 1}`);
      }
      if (seen.has(validated.eventId)) throw new Error(`duplicate event id at line ${index + 1}`);
      seen.add(validated.eventId);
      out.push(validated);
    }
    return out;
  }
}
