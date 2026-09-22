import test from "node:test";
import assert from "node:assert/strict";
import {composeSeedplate,createRun,replayRun,appendRunEvent,exportRun,importRun} from "./seedplate.mjs";
import {projectListeningRoom,hotspotActions} from "./room-projection.mjs";

const mk=()=>createRun(composeSeedplate(["toaster","groove"],{visualLead:"groove"}));
const push=(run,event)=>appendRunEvent(run,event);
const act=(run,actionId)=>push(run,{type:"act",actionId});
const cont=run=>push(run,{type:"continue"});
const same=(a,b)=>assert.equal(exportRun(a),exportRun(b));

test("room projection is a pure view: entering and inspecting hotspots adds no events",()=>{
  const run=mk(),before=exportRun(run),view=replayRun(run);
  const projection=projectListeningRoom(view);
  assert.equal(exportRun(run),before);
  assert.equal(projection.hero.status,"empty");
  assert.deepEqual(projection.hotspots.map(p=>p.id),["picture-machine","listening-chair"]);
  assert.deepEqual(hotspotActions(view,"picture-machine").map(a=>a.id),["toaster:propose"]);
  assert.deepEqual(hotspotActions(view,"listening-chair").map(a=>a.id),["groove:listen"]);
  assert.deepEqual(hotspotActions(view,"not-a-hotspot"),[]);
});

test("view-only candidate focus and SCRAPE never manufacture retained art",()=>{
  let run=mk();
  run=act(run,"toaster:propose");
  let view=replayRun(run),room=projectListeningRoom(view);
  assert.equal(room.hero.status,"proposal");
  assert.equal(room.keptEventId,null);
  assert.equal(room.choosable.length,3);
  const before=exportRun(run);
  room.choosable[0].title="local rendering only";
  assert.equal(exportRun(run),before);
  run=push(run,{type:"scrape"});
  assert.equal(projectListeningRoom(replayRun(run)).hero.status,"proposal");
  assert.equal(projectListeningRoom(replayRun(run)).keptEventId,null);
  run=push(run,{type:"pass"});
  assert.equal(projectListeningRoom(replayRun(run)).keptEventId,null);
});

test("KEEP→listen→echo and listen→KEEP→echo project exact admitted source",()=>{
  for(const first of ["keep","listen"]){
    let run=mk();
    if(first==="listen"){run=act(run,"groove:listen");run=cont(run);}
    run=act(run,"toaster:propose");
    run=push(run,{type:"keep",candidateId:"scene-0-2"});
    const admitted=replayRun(run).memory.at(-1);
    assert.equal(projectListeningRoom(replayRun(run)).hero.keptEventId,admitted.id);
    run=cont(run);
    if(first==="keep"){run=act(run,"groove:listen");run=cont(run);}
    assert.deepEqual(hotspotActions(replayRun(run),"listening-chair").map(a=>a.id),["groove:echo"]);
    run=act(run,"groove:echo");
    const room=projectListeningRoom(replayRun(run));
    assert.equal(room.echoEventId,replayRun(run).memory.at(-1).id);
    assert.equal(room.echoParentId,admitted.id);
    assert.equal(room.hero.keptEventId,admitted.id);
    assert.equal(room.hero.status,"echo");
    same(importRun(exportRun(run)),run);
  }
});

test("room never fabricates remote participants or imports another donor",()=>{
  const view=replayRun(mk());
  assert.ok(!JSON.stringify(projectListeningRoom(view)).includes("remote participant"));
  assert.deepEqual(hotspotActions(view,"card-pile"),[]);
  const unrelated=createRun(composeSeedplate(["grace","fork"]));
  assert.equal(projectListeningRoom(replayRun(unrelated)),null);
});

test("flat/room mode changes share the same run, and projection does not permit committing a locked echo",()=>{
  let run=mk();
  const clean=exportRun(run);
  projectListeningRoom(replayRun(run));
  hotspotActions(replayRun(run),"listening-chair");
  assert.equal(exportRun(run),clean);
  assert.throws(()=>act(run,"groove:echo"),/not available/);
  run=act(run,"groove:listen");
  assert.equal(projectListeningRoom(replayRun(run)).stage,"receipt");
});
