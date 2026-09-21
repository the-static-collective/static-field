import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startStaticFieldServer, type RunningStaticFieldServer } from "../../src/server/app.js";

function sourceActions(lane = "porch") {
  return [
    {kind:"play",actor:"north",card:"signal",lane},
    {kind:"play",actor:"south",card:"receiver",lane},
    {kind:"play",actor:"north",card:"second-chair",lane},
    {kind:"respond",actor:"south",accept:true},
    {kind:"play",actor:"north",card:"missing-corner",lane},
    {kind:"fit",actor:"south",adapter:"relay"},
    {kind:"test",actor:"north"},
    {kind:"deploy",actor:"south",lane}
  ];
}
async function command(runtime: RunningStaticFieldServer, body: unknown) {
  const response=await fetch(runtime.url+"/api/wormhole/command", {
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify(body)
  });
  return { status:response.status, body:await response.json() as any };
}
async function world(runtime: RunningStaticFieldServer) {
  return await (await fetch(runtime.url+"/api/state")).json() as any;
}
test("browser table offers original local card play and retains source/receiving results through restart",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"wormhole-003-"));
  const path=join(dir,"world.jsonl");
  let runtime=await startStaticFieldServer({port:0,eventLogPath:path});
  try {
    const first=(await fetch(runtime.url+"/wormhole.html"));
    assert.equal(first.status,200);
    assert.match(await first.text(),/WORMHOLE/);
    const script=await fetch(runtime.url+"/wormhole.js");
    assert.equal(script.status,200);
    assert.match(await script.text(),/api\/wormhole\/command/);
    assert.equal((await command(runtime,{kind:"start"})).status,200);
    const wrong=(await command(runtime,{kind:"card",action:{
      kind:"play",actor:"south",card:"receiver",lane:"porch"
    }}));
    assert.equal(wrong.status,200);
    assert.equal(wrong.body.source.events[0].decision.reason,"not_your_turn");
    for(const action of sourceActions()){
      const move=await command(runtime,{kind:"card",action});
      assert.equal(move.status,200,JSON.stringify(move.body));
      assert.equal(move.body.source.events.at(-1).decision.status,"admitted");
    }
    const finished=(await world(runtime));
    assert.equal(finished.wormhole.source.board.finished,true);
    assert.equal(finished.story.bellCount,0);
    assert.equal(finished.surface.entered,false);
    const artifact=finished.wormhole.source.artifact;
    const receive=await command(runtime,{kind:"receive",choice:"admit",artifact});
    assert.equal(receive.status,200);
    assert.equal(receive.body.receiving.admission.disposition,"admitted");
    assert.equal(receive.body.receiving.state.crossed,false);
    const premature=await command(runtime,{kind:"receiving",action:{
      kind:"cross",actor:"north",lane:"porch"
    }});
    assert.equal(premature.status,200);
    assert.equal(premature.body.receiving.events[0].reason,"receiving_route_not_attuned");
    for(const action of [
      {kind:"inspect",actor:"north",lane:"porch"},
      {kind:"attune",actor:"south",adapter:"relay"},
      {kind:"cross",actor:"north",lane:"porch"}
    ]) {
      const response=await command(runtime,{kind:"receiving",action});
      assert.equal(response.status,200,JSON.stringify(response.body));
      assert.equal(response.body.receiving.events.at(-1).disposition,"admitted");
    }
    await runtime.close();
    runtime=await startStaticFieldServer({port:0,eventLogPath:path});
    const resumed=await world(runtime);
    assert.equal(resumed.wormhole.receiving.state.crossed,true);
    assert.equal(resumed.wormhole.crossings.length,0);
    assert.equal(resumed.wormhole.receiving.published,false);
    assert.equal(resumed.story.bellCount,0);
    const [published,duplicate]=await Promise.all([
      command(runtime,{kind:"publish"}),command(runtime,{kind:"publish"})
    ]);
    assert.deepEqual([published.status,duplicate.status].sort(),[200,409]);
    const after=await world(runtime);
    assert.equal(after.wormhole.crossings.length,1);
    assert.equal(after.wormhole.receiving.published,true);
    assert.equal(after.gates.length,0);
    assert.equal(after.surface.entered,false);
    assert.equal((await command(runtime,{kind:"receive",choice:"admit",artifact})).status,409);
    const originalAction=await fetch(runtime.url+"/api/action",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"ENTER_PORCH"})
    });
    assert.equal(originalAction.status,200);
    const afterPorch=await world(runtime);
    assert.equal(afterPorch.surface.entered,true);
    assert.equal(afterPorch.wormhole.crossings.length,1);
    assert.equal(afterPorch.gates.length,0);
    await runtime.close();
    runtime=await startStaticFieldServer({port:0,eventLogPath:path});
    const reloaded=await world(runtime);
    assert.equal(reloaded.wormhole.crossings.length,1);
    assert.equal(reloaded.wormhole.receiving.state.crossed,true);
    assert.equal(reloaded.surface.entered,true);
    assert.equal((await readFile(path,"utf8")).includes("WORMHOLE_LOCAL_CROSSING_RECORDED"),true);
  } finally {
    await runtime.close().catch(()=>undefined);
    await rm(dir,{recursive:true,force:true});
  }
});

test("HTTP guard rejects undeclared commands and invalid source; owner can hold without granting a passage",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"wormhole-guards-"));
  const runtime=await startStaticFieldServer({port:0,eventLogPath:join(dir,"history.jsonl")});
  try {
    const malformed=await command(runtime,{kind:"start",admin:true});
    assert.equal(malformed.status,400);
    assert.equal((await command(runtime,{kind:"publish"})).status,409);
    assert.equal((await command(runtime,{kind:"start"})).status,200);
    const injected=await command(runtime,{kind:"card",action:{
      kind:"execute",actor:"north",shell:"echo external"
    }});
    assert.equal(injected.status,409);
    assert.equal((await world(runtime)).wormhole.source.board.eventCount,0);
    assert.equal((await command(runtime,{kind:"receive",choice:"admit",artifact:{}})).status,409);
    for(const action of sourceActions("road")) {
      assert.equal((await command(runtime,{kind:"card",action})).status,200);
    }
    const current=await world(runtime);
    assert.equal((await command(runtime,{kind:"receive",choice:"hold",artifact:current.wormhole.source.artifact})).status,200);
    assert.equal((await command(runtime,{kind:"publish"})).status,409);
    const held=await world(runtime);
    assert.equal(held.wormhole.receiving.admission.disposition,"held");
    assert.equal(held.wormhole.crossings.length,0);
    assert.equal(held.surface.entered,false);
  } finally {
    await runtime.close();
    await rm(dir,{recursive:true,force:true});
  }
});
