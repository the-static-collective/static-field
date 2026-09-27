import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileEventLog } from "../../src/persistence/event-log.js";
import { dispatchFirstBellAction } from "../../src/first-bell/reducer.js";
import { projectWorld } from "../../src/kernel/projection.js";
import { sha256Canonical } from "../../src/kernel/canonical.js";

const actor={kind:"human" as const,id:"human/lu"};
const at=(n:number)=>`2026-09-21T21:${String(n).padStart(2,"0")}:00.000Z`;

test("restart rebuilds identical state and does not re-emit Bell events", async () => {
  const dir=await mkdtemp(join(tmpdir(),"static-field-"));
  try {
    const log=new FileEventLog(join(dir,"history.jsonl"));
    let h:any[]=[];
    for (const [i,type] of ["ENTER_PORCH","BELL_1","BELL_2"].entries()) {
      const next=dispatchFirstBellAction(h,{type,actor,occurredAt:at(i)} as never) as any[];
      for (const e of next.slice(h.length)) await log.append(e);
      h=next;
    }
    const before=sha256Canonical(projectWorld(h));
    let reloaded=await log.loadHistory();
    assert.equal(sha256Canonical(projectWorld(reloaded)),before);
    for (const [j,type] of ["NOTICE_OPEN_CORNER","ENTER_RESONANCE","TRACE_PRIOR_RELATION","KNOCK","CLOSE_PLAY"].entries()) {
      const next=dispatchFirstBellAction(reloaded,{type,actor,occurredAt:at(j+3)} as never);
      for (const e of next.slice(reloaded.length)) await log.append(e);
      reloaded=next;
    }
    const final=await log.loadHistory();
    assert.equal(final.filter(e=>e.kind==="BELL_OCCURRENCE").length,2);
    assert.equal(projectWorld(final).story.status,"closed");
  } finally { await rm(dir,{recursive:true,force:true}); }
});


test("event log rejects content/hash tampering", async () => {
  const dir=await mkdtemp(join(tmpdir(),"static-field-tamper-"));
  try {
    const path=join(dir,"history.jsonl");
    const log=new FileEventLog(path);
    const h=dispatchFirstBellAction([],{
      type:"ENTER_PORCH",actor,occurredAt:at(0)
    });
    await log.append(h[0]!);
    const { readFile, writeFile } = await import("node:fs/promises");
    const raw=await readFile(path,"utf8");
    const envelope=JSON.parse(raw.trim());
    envelope.event.payload.regionId="somewhere-else";
    await writeFile(path,JSON.stringify(envelope)+"\n","utf8");
    await assert.rejects(()=>log.loadHistory(),/hash mismatch/i);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test("event log rejects a forged event id even when the envelope hash is recomputed", async () => {
  const temp = await mkdtemp(join(tmpdir(), "static-field-forged-id-"));
  const path = join(temp, "history.jsonl");
  const log = new FileEventLog(path);
  const actor = { kind: "human", id: "human/test" } as const;
  const history = dispatchFirstBellAction([], { type: "ENTER_PORCH", actor, occurredAt: "2026-09-21T20:00:00.000Z" });
  await log.append(history[0]!);

  const { readFile, writeFile } = await import("node:fs/promises");
  const raw = await readFile(path, "utf8");
  const envelope = JSON.parse(raw.trim());
  envelope.event.eventId = "event/forged";
  envelope.eventHash = sha256Canonical(envelope.event);
  await writeFile(path, `${JSON.stringify(envelope)}\n`, "utf8");

  await assert.rejects(() => log.loadHistory(), /event id mismatch/i);
});
