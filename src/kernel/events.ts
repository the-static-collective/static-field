import { canonicalize, stableId, type JsonValue } from "./canonical.js";
import type { EventDraft, WorldEvent } from "./types.js";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function canonicalCopy(value: JsonValue): JsonValue {
  return JSON.parse(canonicalize(value)) as JsonValue;
}

export function makeEvent(draft: EventDraft): WorldEvent {
  const eventId = stableId("event", draft);
  const payload = deepFreeze(canonicalCopy(draft.payload));
  return Object.freeze({
    eventId,
    kind: draft.kind,
    occurredAt: draft.occurredAt,
    actor: Object.freeze({ ...draft.actor }),
    evidenceClass: draft.evidenceClass,
    sourceStatus: draft.sourceStatus,
    payload,
    parentEventIds: Object.freeze([...draft.parentEventIds]),
  });
}

export function appendEvent(
  history: readonly WorldEvent[],
  event: WorldEvent,
): readonly WorldEvent[] {
  if (history.some((item) => item.eventId === event.eventId)) {
    throw new Error(`duplicate event id: ${event.eventId}`);
  }
  return Object.freeze([...history, event]);
}
