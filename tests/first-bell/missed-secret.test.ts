import test from "node:test";
import assert from "node:assert/strict";
import { dispatchFirstBellAction } from "../../src/first-bell/reducer.js";
import { deriveFirstBellStory } from "../../src/first-bell/story.js";
import { resonanceRelationReceipt, firstBellPlayReceipt } from "../../src/first-bell/receipts.js";

const actor = { kind:"human" as const, id:"human/lu" };
const at=(n:number)=>`2026-09-21T20:${String(n).padStart(2,"0")}:00.000Z`;

test("not noticing the secret is a valid completed play", () => {
  let h:any[]=[];
  const seq=["ENTER_PORCH","BELL_1","BELL_2","CONTINUE_PREPARATION","KNOCK","CLOSE_PLAY"] as const;
  seq.forEach((type,i)=>{h=dispatchFirstBellAction(h,{type,actor,occurredAt:at(i)} as never) as any[]});
  const story=deriveFirstBellStory(h);
  assert.equal(story.status,"closed");
  assert.equal(story.secretNoticed,false);
  assert.equal(h.some(e=>e.kind==="OPEN_CORNER_NOTICED"),false);
  assert.equal(resonanceRelationReceipt(h),undefined);
  assert.equal(firstBellPlayReceipt(h)?.secretNoticed,false);
});
