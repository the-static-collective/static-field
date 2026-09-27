import test from "node:test";
import assert from "node:assert/strict";
import { appendEvent, makeEvent } from "../../src/kernel/events.js";
import { projectWorld } from "../../src/kernel/projection.js";
import { sha256Canonical } from "../../src/kernel/canonical.js";

const actor = { kind: "human" as const, id: "human/lu" };

test("append-only history rejects duplicate ids and preserves prior objects", () => {
  const first = makeEvent({
    kind: "PORCH_ARRIVAL",
    occurredAt: "2026-09-21T19:00:00.000Z",
    actor,
    evidenceClass: "observed",
    sourceStatus: "resolved",
    payload: { regionId: "the-porch" },
    parentEventIds: [],
  });
  const h1 = appendEvent([], first);
  const snapshot = JSON.stringify(h1[0]);
  const h2 = appendEvent(h1, makeEvent({
    kind: "OBJECT_PREPARED",
    occurredAt: "2026-09-21T19:01:00.000Z",
    actor,
    evidenceClass: "observed",
    sourceStatus: "resolved",
    payload: { objectId: "chair-a" },
    parentEventIds: [first.eventId],
  }));
  assert.equal(JSON.stringify(h1[0]), snapshot);
  assert.notEqual(h1, h2);
  assert.throws(() => appendEvent(h2, first), /duplicate event id/i);
});


test("event payloads cannot be mutated after identity is assigned", () => {
  const event = makeEvent({
    kind: "BELL_OCCURRENCE",
    occurredAt: "2026-09-21T19:02:00.000Z",
    actor,
    evidenceClass: "observed",
    sourceStatus: "unresolved",
    payload: { nested: { source: "unresolved" } },
    parentEventIds: [],
  });
  const before = JSON.stringify(event);
  assert.throws(() => {
    (event.payload as { nested: { source: string } }).nested.source = "resolved";
  });
  assert.equal(JSON.stringify(event), before);
});

test("projection is deterministic and does not append events", () => {
  const e = makeEvent({
    kind: "PORCH_ARRIVAL",
    occurredAt: "2026-09-21T19:00:00.000Z",
    actor,
    evidenceClass: "observed",
    sourceStatus: "resolved",
    payload: { regionId: "the-porch" },
    parentEventIds: [],
  });
  const history = [e];
  const before = JSON.stringify(history);
  const a = projectWorld(history);
  const b = projectWorld(history);
  assert.equal(sha256Canonical(a), sha256Canonical(b));
  assert.equal(JSON.stringify(history), before);
});
