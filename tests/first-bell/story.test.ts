import test from "node:test";
import assert from "node:assert/strict";
import { dispatchFirstBellAction } from "../../src/first-bell/reducer.js";
import { deriveFirstBellStory } from "../../src/first-bell/story.js";
import { deriveDetectableGates } from "../../src/world/gates.js";
import { firstBellPlayReceipt, resonanceRelationReceipt } from "../../src/first-bell/receipts.js";

const actor = { kind:"human" as const, id:"human/lu" };
const at = (n:number) => `2026-09-21T19:${String(n).padStart(2,"0")}:00.000Z`;

test("the complete first-bell path preserves unresolved source and leaves a detected gate residue", () => {
  let h:any[] = [];
  const seq = [
    "ENTER_PORCH","SET_OUT_CHAIR","ROUTE_CABLE","PUT_OUT_WATER","CHECK_DOOR",
    "BELL_1","CONTINUE_PREPARATION","BELL_2","NOTICE_OPEN_CORNER",
    "ENTER_RESONANCE","TRACE_PRIOR_RELATION","KNOCK","CLOSE_PLAY"
  ] as const;
  seq.forEach((type, i) => { h = dispatchFirstBellAction(h, {type, actor, occurredAt:at(i)} as never) as any[]; });
  const story = deriveFirstBellStory(h);
  assert.equal(story.status, "closed");
  assert.equal(story.secretNoticed, true);
  assert.equal(story.bellCount, 2);
  assert.equal(h.filter(e=>e.kind==="BELL_OCCURRENCE").every(e=>e.sourceStatus==="unresolved"), true);
  assert.equal(resonanceRelationReceipt(h)?.sourceStatus, "unresolved");
  assert.equal(firstBellPlayReceipt(h)?.sourceStatus, "unresolved");
  const gates = deriveDetectableGates(h);
  assert.equal(gates[0]?.status, "detected");
  assert.equal(gates[0]?.authorized, false);
  assert.equal(gates[0]?.to, undefined);
});

test("impossible story actions are rejected", () => {
  assert.throws(() => dispatchFirstBellAction([], {
    type:"TRACE_PRIOR_RELATION", actor, occurredAt:at(0)
  }), /resonance/i);
  assert.throws(() => dispatchFirstBellAction([], {
    type:"CLOSE_PLAY", actor, occurredAt:at(0)
  }), /knock/i);
});
