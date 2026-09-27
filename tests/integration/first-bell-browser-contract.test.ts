import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startStaticFieldServer } from "../../src/server/app.js";

test("loopback API exposes separated maps and rejects arbitrary/impossible actions", async () => {
  const dir=await mkdtemp(join(tmpdir(),"static-field-http-"));
  const runtime=await startStaticFieldServer({port:0,eventLogPath:join(dir,"history.jsonl")});
  try {
    const state=await (await fetch(`${runtime.url}/api/state`)).json() as any;
    assert.ok(state.surface);
    assert.ok(state.resonance);
    assert.equal(JSON.stringify(state).includes("bell source resolved"),false);

    const bad=await fetch(`${runtime.url}/api/action`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"TRACE_PRIOR_RELATION",shell:"rm -rf /"})
    });
    assert.equal(bad.status,400);

    const impossible=await fetch(`${runtime.url}/api/action`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"TRACE_PRIOR_RELATION"})
    });
    assert.equal(impossible.status,409);
  } finally {
    await runtime.close();
    await rm(dir,{recursive:true,force:true});
  }
});


test("browser missed-secret play persists across server restart without fabricating resonance", async () => {
  const dir=await mkdtemp(join(tmpdir(),"static-field-http-restart-"));
  const eventLogPath=join(dir,"history.jsonl");
  let runtime=await startStaticFieldServer({port:0,eventLogPath});
  const post=async (action:string) => {
    const response=await fetch(`${runtime.url}/api/action`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action})
    });
    assert.equal(response.status,200,`${action} rejected`);
    return response.json() as Promise<any>;
  };
  try {
    for (const action of ["ENTER_PORCH","BELL_1","BELL_2","CONTINUE_PREPARATION","KNOCK","CLOSE_PLAY"]) {
      await post(action);
    }
    let state=await (await fetch(`${runtime.url}/api/state`)).json() as any;
    assert.equal(state.story.status,"closed");
    assert.equal(state.story.secretNoticed,false);
    assert.equal(state.resonance.relations.length,0);
    assert.equal(state.surface.bellOccurrences.length,2);
    await runtime.close();

    runtime=await startStaticFieldServer({port:0,eventLogPath});
    state=await (await fetch(`${runtime.url}/api/state`)).json() as any;
    assert.equal(state.story.status,"closed");
    assert.equal(state.story.secretNoticed,false);
    assert.equal(state.resonance.relations.length,0);
    assert.equal(state.surface.bellOccurrences.length,2);
  } finally {
    await runtime.close().catch(()=>undefined);
    await rm(dir,{recursive:true,force:true});
  }
});

test("concurrent world mutations serialize so one Bell cannot occur twice", async () => {
  const dir = await mkdtemp(join(tmpdir(), "static-field-http-race-"));
  const eventLogPath = join(dir, "history.jsonl");
  const runtime = await startStaticFieldServer({ port: 0, eventLogPath });
  const post = (action: string) => fetch(`${runtime.url}/api/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
  try {
    assert.equal((await post("ENTER_PORCH")).status, 200);
    const [first, second] = await Promise.all([post("BELL_1"), post("BELL_1")]);
    assert.deepEqual([first.status, second.status].sort(), [200, 409]);

    const state = await (await fetch(`${runtime.url}/api/state`)).json() as any;
    assert.equal(state.surface.bellOccurrences.length, 1);

    await runtime.close();
    const restarted = await startStaticFieldServer({ port: 0, eventLogPath });
    try {
      const restartedState = await (await fetch(`${restarted.url}/api/state`)).json() as any;
      assert.equal(restartedState.surface.bellOccurrences.length, 1);
    } finally {
      await restarted.close();
    }
  } finally {
    await runtime.close().catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  }
});
