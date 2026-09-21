import { stableId } from "./canonical.js";
import type { SourceStatus, WorldEvent } from "./types.js";

export interface EventReceipt {
  readonly receiptId: string;
  readonly receiptType: string;
  readonly eventId: string;
  readonly sourceStatus: SourceStatus;
  readonly historyLengthBefore: number;
}

export function createEventReceipt(
  event: WorldEvent,
  historyBefore: readonly WorldEvent[],
  receiptType = "EventReceipt",
): EventReceipt {
  const body = {
    receiptType,
    eventId: event.eventId,
    sourceStatus: event.sourceStatus,
    historyLengthBefore: historyBefore.length,
  } as const;
  return { receiptId: stableId("receipt", body), ...body };
}
