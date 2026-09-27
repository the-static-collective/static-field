import { stableId } from "../kernel/canonical.js";
import type { SourceStatus, WorldEvent } from "../kernel/types.js";

interface BaseReceipt {
  readonly receiptId: string;
  readonly receiptType: string;
  readonly eventId: string;
  readonly sourceStatus: SourceStatus;
}

function fromEvent(receiptType: string, event: WorldEvent): BaseReceipt {
  const body = { receiptType, eventId: event.eventId, sourceStatus: event.sourceStatus } as const;
  return { receiptId: stableId("receipt", body), ...body };
}

export function porchArrivalReceipt(history: readonly WorldEvent[]): BaseReceipt | undefined {
  const event = history.find((item) => item.kind === "PORCH_ARRIVAL");
  return event ? fromEvent("PorchArrivalReceipt", event) : undefined;
}

export function attendanceReceipt(history: readonly WorldEvent[]): BaseReceipt | undefined {
  const event = history.find((item) => item.kind === "PORCH_ARRIVAL");
  return event ? fromEvent("AttendanceReceipt", event) : undefined;
}

export function bellReceipt(history: readonly WorldEvent[], ordinal: 1 | 2): BaseReceipt | undefined {
  const event = history.filter((item) => item.kind === "BELL_OCCURRENCE")[ordinal - 1];
  return event ? fromEvent(`BellOccurrenceReceipt#${ordinal}`, event) : undefined;
}

export function resonanceRelationReceipt(history: readonly WorldEvent[]): BaseReceipt | undefined {
  const event = history.find((item) => item.kind === "RESONANCE_RELATION_TRACED");
  return event ? fromEvent("ResonanceRelationReceipt", event) : undefined;
}

export interface FirstBellPlayReceipt extends BaseReceipt {
  readonly secretNoticed: boolean;
  readonly relationTraced: boolean;
}

export function firstBellPlayReceipt(history: readonly WorldEvent[]): FirstBellPlayReceipt | undefined {
  const event = history.find((item) => item.kind === "FIRST_BELL_PLAY_CLOSED");
  if (!event) return undefined;
  const payload = event.payload as { secretNoticed?: boolean; relationTraced?: boolean };
  const base = fromEvent("FirstBellPlayReceipt", event);
  const body = {
    ...base,
    secretNoticed: Boolean(payload.secretNoticed),
    relationTraced: Boolean(payload.relationTraced),
  };
  return { ...body, receiptId: stableId("receipt", body) };
}
