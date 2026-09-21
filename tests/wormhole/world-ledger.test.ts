import test from "node:test";
import assert from "node:assert/strict";
import { makeEvent, appendEvent } from "../../src/kernel/events.js";
import { projectWorld } from "../../src/kernel/projection.js";
import type { WorldEvent } from "../../src/kernel/types.js";
import { exportBridgeArtifact, type Action } from "../../src/wormhole/game.js";
import { proposeWormholeEvent, replayWormholeWorld, projectWormholeWorld, type WormholeCommand } from "../../src/wormhole/world-ledger.js";

let clock = 0;
function commit(history: readonly WorldEvent[], command: WormholeCommand): readonly WorldEvent[] {
  const proposal = proposeWormholeEvent(history, command);
  const event = makeEvent({
    kind: proposal.kind, occurredAt: "2026-09-21T22:00:" + String(clock++).padStart(2, "0") + ".000Z",
    actor: { kind: "human", id: "human/local-player" },
    evidenceClass: "derived", sourceStatus: "unresolved",
    payload: proposal.payload as never,
    parentEventIds: history.length ? [history[history.length - 1]!.eventId] : []
  });
  const next = appendEvent(history, event);
  replayWormholeWorld(next);
  return next;
}
function source(): readonly WorldEvent[] {
  let h: readonly WorldEvent[] = [];
  h = commit(h, {kind:"start",matchId:"match-one"});
  const moves: Action[] = [
    {kind:"play",actor:"north",card:"signal",lane:"hall"},
    {kind:"play",actor:"south",card:"receiver",lane:"hall"},
    {kind:"play",actor:"north",card:"second-chair",lane:"hall"},
    {kind:"respond",actor:"south",accept:true},
    {kind:"play",actor:"north",card:"missing-corner",lane:"hall"},
    {kind:"fit",actor:"south",adapter:"relay"},
    {kind:"test",actor:"north"},
    {kind:"deploy",actor:"south",lane:"hall"}
  ];
  for (const action of moves) h = commit(h,{kind:"card",action});
  return h;
}
test("world ledger reconstructs source, admitting destination, and published independent encounter", () => {
  clock = 0;
  let history = source();
  const first = projectWormholeWorld(history);
  assert.equal(first.source?.board.finished,true);
  assert.equal(first.source?.artifact?.lane,"hall");
  assert.equal(first.crossings.length,0);
  const candidate = first.source!.artifact!;
  history = commit(history,{kind:"receive",receivingId:"receiving-one",choice:"admit",artifact:candidate});
  const receives = [
    {kind:"inspect",actor:"north",lane:"hall"},
    {kind:"attune",actor:"south",adapter:"relay"},
    {kind:"cross",actor:"north",lane:"hall"}
  ] as const;
  for (const action of receives) history = commit(history,{kind:"receiving",action});
  const before = projectWormholeWorld(history);
  assert.equal(before.receiving?.state.crossed,true);
  assert.equal(before.crossings.length,0);
  history = commit(history,{kind:"publish"});
  const projection = projectWorld(history);
  assert.equal(projection.wormhole.crossings.length,1);
  assert.equal(projection.wormhole.crossings[0]?.sourceArtifactId,candidate.artifactId);
  assert.equal(projection.wormhole.receiving?.published,true);
  assert.equal(projection.surface.entered,false);
  assert.equal(projection.resonance.available,false);
  assert.deepEqual(projection.gates,[]);
  assert.deepEqual(projectWormholeWorld(JSON.parse(JSON.stringify(history)) as WorldEvent[]),
    projectWormholeWorld(history));
  assert.throws(()=>proposeWormholeEvent(history,{kind:"publish"}),/already recorded/);
});

test("bad artifact and explicit hold/refuse never produce a world crossing", () => {
  clock=0;
  const first=source();
  const match=replayWormholeWorld(first).match!;
  const artifact=exportBridgeArtifact(match);
  for (const choice of ["hold","refuse"] as const) {
    const h=commit(first,{kind:"receive",receivingId:"receiving-"+choice,choice,artifact});
    assert.notEqual(projectWormholeWorld(h).receiving?.admission.disposition,"admitted");
    assert.throws(()=>proposeWormholeEvent(h,{kind:"publish"}),/only an admitted/);
    const refused=commit(h,{kind:"receiving",action:{kind:"inspect",actor:"north",lane:"hall"}});
    assert.equal(projectWormholeWorld(refused).receiving?.events[0]?.disposition,"refused");
    assert.equal(projectWormholeWorld(refused).receiving?.state?.crossed,false);
  }
  const bad={...artifact,sourceReceipt:"ww-rct-sha256:"+"0".repeat(64)};
  const h=commit(first,{kind:"receive",receivingId:"forged-import",choice:"admit",artifact:bad});
  assert.equal(projectWormholeWorld(h).receiving?.admission.disposition,"refused");
  assert.throws(()=>proposeWormholeEvent(h,{kind:"publish"}),/only an admitted/);
});

test("injected claimed approvals and unauthorized namespaces fail world-level replay", () => {
  clock=0;
  let history=source();
  const artifact=projectWormholeWorld(history).source!.artifact!;
  history=commit(history,{kind:"receive",receivingId:"receiving-two",choice:"admit",artifact});
  const last=history.at(-1)!;
  const manipulations=[
    {...last,payload:{...(last.payload as object),choice:"hold"}},
    {...last,payload:{...(last.payload as object),admission:{receiptId:"fake"}}},
    {...last,evidenceClass:"observed"}
  ] as WorldEvent[];
  for(const modified of manipulations){
    assert.throws(()=>replayWormholeWorld([...history.slice(0,-1),modified]));
  }
  const complete=commit(history,{kind:"receiving",action:{kind:"inspect",actor:"north",lane:"hall"}});
  const lastMove=complete.at(-1)!;
  const forged={...lastMove,payload:{...(lastMove.payload as object),receipt:{receiptId:"fake"}}} as WorldEvent;
  assert.throws(()=>replayWormholeWorld([...complete.slice(0,-1),forged]));
});

test("starting another match leaves earlier world events intact without inheriting their powers", () => {
  clock=0;
  const old=source();
  const newer=commit(old,{kind:"start",matchId:"fresh"});
  assert.equal(old.length+1,newer.length);
  assert.equal(projectWormholeWorld(newer).source?.board?.eventCount,0);
  assert.equal(projectWormholeWorld(newer).receiving,null);
  assert.throws(()=>proposeWormholeEvent(newer,{kind:"start",matchId:"match-one"}),/already used/);
});
