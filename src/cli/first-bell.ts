import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalize } from "../kernel/canonical.js";
import type { WorldEvent } from "../kernel/types.js";
import { projectWorld } from "../kernel/projection.js";
import { dispatchFirstBellAction } from "../first-bell/reducer.js";
import {
  attendanceReceipt,
  bellReceipt,
  firstBellPlayReceipt,
  porchArrivalReceipt,
  resonanceRelationReceipt,
} from "../first-bell/receipts.js";

function outputPath(): string {
  const index = process.argv.indexOf("--out");
  return resolve(index >= 0 && process.argv[index + 1] ? process.argv[index + 1]! : "out/first-bell");
}

const actor = { kind: "human" as const, id: "human/specimen" };
const sequence = [
  "ENTER_PORCH","SET_OUT_CHAIR","ROUTE_CABLE","PUT_OUT_WATER","CHECK_DOOR",
  "BELL_1","CONTINUE_PREPARATION","BELL_2","NOTICE_OPEN_CORNER",
  "ENTER_RESONANCE","TRACE_PRIOR_RELATION","KNOCK","CLOSE_PLAY",
] as const;

let history: readonly WorldEvent[] = [];
for (const [index, type] of sequence.entries()) {
  history = dispatchFirstBellAction(history, {
    type,
    actor,
    occurredAt: `2026-09-21T22:${String(index).padStart(2, "0")}:00.000Z`,
  });
}

const projection = projectWorld(history);
const out = outputPath();
await mkdir(out, { recursive: true });

const artifacts: Record<string, unknown> = {
  "surface.json": projection.surface,
  "resonance.json": projection.resonance,
  "porch-arrival-receipt.json": porchArrivalReceipt(history),
  "attendance-receipt.json": attendanceReceipt(history),
  "bell-1-receipt.json": bellReceipt(history, 1),
  "bell-2-receipt.json": bellReceipt(history, 2),
  "resonance-relation-receipt.json": resonanceRelationReceipt(history),
  "first-bell-play-receipt.json": firstBellPlayReceipt(history),
};

await writeFile(
  resolve(out, "history.jsonl"),
  history.map((event) => canonicalize(event)).join("\n") + "\n",
  "utf8",
);
for (const [name, value] of Object.entries(artifacts)) {
  await writeFile(resolve(out, name), `${canonicalize(value)}\n`, "utf8");
}
process.stdout.write(`${out}\n`);
