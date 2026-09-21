import test from "node:test";
import assert from "node:assert/strict";
import { dispatchFirstBellAction } from "../../src/first-bell/reducer.js";
import { deriveAttendance } from "../../src/world/attendance.js";
import { deriveFieldDepth } from "../../src/world/field-depth.js";
import { deriveSurface } from "../../src/world/surface.js";

const actor = { kind: "human" as const, id: "human/lu" };
const at = (n: number) => `2026-09-21T19:${String(n).padStart(2,"0")}:00.000Z`;

test("arrival creates attendance once and chair setup does not invent a person", () => {
  let h = dispatchFirstBellAction([], { type:"ENTER_PORCH", actor, occurredAt:at(0) });
  h = dispatchFirstBellAction(h, { type:"SET_OUT_CHAIR", actor, occurredAt:at(1) });
  const once = h.length;
  h = dispatchFirstBellAction(h, { type:"SET_OUT_CHAIR", actor, occurredAt:at(2) });
  assert.equal(h.length, once);
  assert.deepEqual(deriveAttendance(h).presentParticipantIds, ["human/lu"]);
  assert.equal(deriveSurface(h).preparedObjectIds.includes("chair-a"), true);
});

test("absence is representable without manufacturing attendance", () => {
  let h = dispatchFirstBellAction([], { type:"ENTER_PORCH", actor, occurredAt:at(0) });
  h = dispatchFirstBellAction(h, { type:"MARK_ABSENCE", actor, occurredAt:at(1), subjectId:"human/grace" });
  const a = deriveAttendance(h);
  assert.deepEqual(a.presentParticipantIds, ["human/lu"]);
  assert.deepEqual(a.absentParticipantIds, ["human/grace"]);
  assert.equal(deriveFieldDepth(h).unresolvedAbsences, 1);
});
