import test from "node:test";
import assert from "node:assert/strict";
import { dispatchFirstBellAction } from "../../src/first-bell/reducer.js";
import { deriveResonance } from "../../src/world/resonance.js";
import relations from "../../fixtures/first-bell/prior-relations.json" with { type:"json" };

const actor = { kind:"human" as const, id:"human/lu" };
const at = (n:number) => `2026-09-21T19:${String(n).padStart(2,"0")}:00.000Z`;

test("resonance relation never resolves the Bell source", () => {
  let h:any[] = [];
  const seq = ["ENTER_PORCH","BELL_1","BELL_2","NOTICE_OPEN_CORNER","ENTER_RESONANCE","TRACE_PRIOR_RELATION"] as const;
  seq.forEach((type, i) => { h = dispatchFirstBellAction(h, {type, actor, occurredAt:at(i)} as never) as any[]; });
  const bells = h.filter(e => e.kind === "BELL_OCCURRENCE");
  const before = JSON.stringify(bells);
  const resonance = deriveResonance(h, relations.relations as never);
  assert.equal(resonance.relations.length, 1);
  assert.equal(resonance.relations[0]?.promotedClaim, false);
  assert.equal(resonance.relations[0]?.sourceStatus, "unresolved");
  assert.equal(JSON.stringify(bells), before);
  assert.equal(bells.every(e => e.sourceStatus === "unresolved"), true);
  assert.equal(resonance.relations[0]?.evidenceRefs.length, 2);
});
