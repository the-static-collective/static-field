import test from "node:test";
import assert from "node:assert/strict";
import {
  SEEDS,composeSeedplate,createRun,getCandidates,replayRun,appendRunEvent,exportRun,importRun,exportCompositionRecipe,
} from "./seedplate.mjs";
const ids=SEEDS.map(seed=>seed.id);
const combinations=()=>{
  const out=[];
  for(let mask=1;mask<16;mask++){
    const values=ids.filter((_,index)=>(mask&(1<<index))!==0);
    if(values.length>=2)out.push(values);
  }
  return out;
};
const add=(run,type,rest={})=>appendRunEvent(run,{type,...rest});
const act=(run,actionId,rest={})=>add(run,"act",{actionId,...rest});

test("all eleven valid 2–4-donor sets have distinct identities and every donor gets a playable foreground move",()=>{
  const combos=combinations();
  assert.equal(combos.length,11);
  const idsSeen=new Set();
  for(const names of combos){
    const composition=composeSeedplate(names);
    assert.ok(!idsSeen.has(composition.id));
    idsSeen.add(composition.id);
    assert.deepEqual(composition.donorRoles.map(d=>d.id),names);
    assert.equal(composition.nonClaims.length,3);
    const view=replayRun(createRun(composition));
    assert.deepEqual(view.choices.map(choice=>choice.seedId),names);
    assert.ok(view.choices.length>=2&&view.choices.length<=4);
  }
});
test("the visual lead can change independently of which gameplay mechanisms are composed",()=>{
  const a=composeSeedplate(["grace","fork"],{visualLead:"grace"});
  const b=composeSeedplate(["grace","fork"],{visualLead:"fork"});
  assert.notEqual(a.palette.paper,b.palette.paper);
  assert.deepEqual(a.donorRoles,b.donorRoles);
  assert.throws(()=>composeSeedplate(["grace","grace"]),/duplicate/);
  assert.throws(()=>composeSeedplate(["grace","fork"],{visualLead:"groove"}),/selected/);
});
test("toaster candidate focus and SCRAPE cannot silently become fiction or a negative taste score",()=>{
  let r=createRun(composeSeedplate(["grace","toaster"]));
  r=act(r,"toaster:propose");
  assert.equal(replayRun(r).stage,"candidates");
  assert.equal(replayRun(r).memory.length,0);
  assert.equal(getCandidates(0).length,3);
  r=add(r,"scrape");
  r=add(r,"scrape");
  const view=replayRun(r);
  assert.equal(view.memory.length,0);
  assert.equal(view.scrapes,2);
  assert.throws(()=>add(r,"scrape"),/limit/);
  r=add(r,"keep",{candidateId:getCandidates(2)[1].id});
  assert.equal(replayRun(r).memory.length,1);
  assert.equal(replayRun(r).memory[0].kind,"fictional-admission");
  assert.ok(!replayRun(r).memory.some(m=>/dislike|preference/.test(m.text)));
  assert.throws(()=>add(r,"keep",{candidateId:getCandidates(2)[0].id}),/offered family/);
});
test("setting a proposed picture aside preserves a refusal but no admitted world memory",()=>{
  let r=createRun(composeSeedplate(["toaster","groove"]));
  r=act(r,"toaster:propose");
  r=add(r,"pass");
  const v=replayRun(r);
  assert.equal(v.stage,"receipt");
  assert.equal(v.memory.length,0);
  assert.equal(v.beats,4);
});
test("an ordinary scene act costs one beat and an unanswered call stays unanswered",()=>{
  let r=createRun(composeSeedplate(["grace","fork"]));
  r=act(r,"grace:call");
  const v=replayRun(r);
  assert.equal(v.beats,3);
  assert.match(v.memory[0].text,/attempted/);
  assert.match(v.receipt.body,/still an open thread/);
  r=add(r,"continue");
  assert.ok(replayRun(r).choices.some(a=>a.id==="grace:hold"));
});
test("room listening/notes are local and imported note events require their actual source",()=>{
  let r=createRun(composeSeedplate(["groove","fork"]));
  r=act(r,"groove:listen");
  r=add(r,"continue");
  assert.throws(()=>act(r,"groove:note",{note:""}),/1–120/);
  r=act(r,"groove:note",{note:"I will be back after the song."});
  assert.match(replayRun(r).receipt.body,/nobody else is claimed to have heard it/);
  assert.throws(()=>act(r,"groove:note",{note:"duplicate action"}),/requires the room foreground/);
});
test("a FORK branch points at an actual parent and cannot retroactively rewrite it",()=>{
  let r=createRun(composeSeedplate(["fork","groove"]));
  r=act(r,"fork:intruder");const parent=replayRun(r).memory[0];
  r=add(r,"continue");r=act(r,"groove:listen");r=add(r,"continue");
  r=act(r,"fork:bend");
  const view=replayRun(r);
  assert.equal(view.memory.at(-1).parentId,parent.id);
  assert.deepEqual(view.memory[0],parent);
});
test("event import checks sequential IDs, phase boundaries and selected donor authority",()=>{
  let r=createRun(composeSeedplate(["grace","fork"]));
  assert.throws(()=>act(r,"groove:listen"),/not available/);
  assert.throws(()=>add(r,"keep",{candidateId:"scene-0-1"}),/offered family/);
  r=act(r,"grace:call");
  assert.deepEqual(importRun(exportRun(r)),r);
  const bad=structuredClone(r);bad.events[0].id="rewritten";
  assert.throws(()=>replayRun(bad),/identity/);
});
test("one four-donor sample can play a situated act, propose, keep, listen and branch before ending",()=>{
  let r=createRun(composeSeedplate(ids,{visualLead:"fork"}));
  r=act(r,"grace:call");r=add(r,"continue");
  r=act(r,"toaster:propose");r=add(r,"keep",{candidateId:"scene-0-1"});
  r=add(r,"continue");r=act(r,"groove:listen");r=add(r,"continue");
  r=act(r,"fork:intruder");r=add(r,"continue");
  const v=replayRun(r);
  assert.equal(v.beats,0);assert.equal(v.stage,"ending");
  assert.equal(v.memory.length,4);
  assert.deepEqual(new Set(v.memory.map(m=>m.seedId)),new Set(ids));
});

test("a portable recipe attributes exact donor mechanics and keeps UX inspiration separate from runtime authority",()=>{
  const composition=composeSeedplate(["grace","groove","fork"],{visualLead:"fork"});
  const recipe=JSON.parse(exportCompositionRecipe(composition));
  assert.equal(recipe.schema,"static-play-seedplate.recipe.v1");
  assert.equal(recipe.visualLead,"fork");
  assert.deepEqual(recipe.donors.map(donor=>donor.id),["grace","groove","fork"]);
  assert.ok(recipe.donors.every(donor=>donor.source.startsWith("https://github.com/")));
  assert.ok(recipe.donors.every(donor=>donor.mechanic&&donor.skin));
  assert.ok(recipe.constraints.includes("a composed UX recipe is not donor code, a runtime adapter, or world admission"));
});

test("Toaster × GrooveRooms creates a new playable listening echo only after exact KEEP",()=>{
  let run=createRun(composeSeedplate(["toaster","groove"]));
  run=act(run,"groove:listen");run=add(run,"continue");
  assert.ok(!replayRun(run).choices.some(choice=>choice.id==="groove:echo"));
  run=act(run,"toaster:propose");run=add(run,"scrape");
  assert.ok(!replayRun(run).memory.some(item=>item.action==="toaster:keep"));
  run=add(run,"keep",{candidateId:"scene-1-1"});
  const kept=replayRun(run).memory.at(-1);
  run=add(run,"continue");
  assert.ok(replayRun(run).choices.some(choice=>choice.id==="groove:echo"));
  run=act(run,"groove:echo");
  const echo=replayRun(run).memory.at(-1);
  assert.equal(echo.kind,"crossing");
  assert.equal(echo.parentId,kept.id);
  assert.equal(echo.seedId,"groove");
  assert.match(replayRun(run).receipt.body,/No remote listener/);
  let withoutToaster=createRun(composeSeedplate(["groove","fork"]));
  withoutToaster=act(withoutToaster,"groove:listen");
  withoutToaster=add(withoutToaster,"continue");
  assert.ok(!replayRun(withoutToaster).choices.some(choice=>choice.id==="groove:echo"));
});
