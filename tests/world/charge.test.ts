import test from "node:test";
import assert from "node:assert/strict";
import { CAPACITY_VERBS, deriveCharge, availableCapacityVerbs } from "../../src/world/charge.js";
import { dispatchFirstBellAction } from "../../src/first-bell/reducer.js";

const actor = { kind: "human" as const, id: "human/lu" };

test("capacity grammar contains ordinary verbs", () => {
  for (const verb of ["REST","TEND","PRAY","PLAY","WITNESS","KEEP","ASK_FOR_HELP"]) {
    assert.equal(CAPACITY_VERBS.includes(verb as never), true);
  }
});

test("low charge disables POUR but preserves RECEIVE HOLD REST ASK_FOR_HELP", () => {
  const verbs = availableCapacityVerbs({ current: 0, max: 10 });
  assert.equal(verbs.includes("POUR"), false);
  for (const verb of ["RECEIVE","HOLD","REST","ASK_FOR_HELP"] as const) assert.equal(verbs.includes(verb), true);
});

test("prayer changes capacity without certifying divine approval", () => {
  const h = dispatchFirstBellAction([], {
    type:"PRAY", actor, occurredAt:"2026-09-21T19:00:00.000Z"
  });
  const charge = deriveCharge(h);
  assert.equal(charge.current > 0, true);
  assert.equal(JSON.stringify(h).includes("divineApproval"), false);
});
