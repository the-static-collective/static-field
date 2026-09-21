import test from "node:test";
import assert from "node:assert/strict";
import { act, exportBridgeArtifact, newMatch, type Action, type Lane, type Match } from "../../src/wormhole/game.js";
import {
  receiveBridge, replayReceiving, moveReceiving, exportReceivingResult,
  type ReceivingWorld
} from "../../src/wormhole/receiving.js";

function fixture(id = "source", lane: Lane = "porch"): Match {
  let match = newMatch(id);
  const actions: Action[] = [
    {kind:"play",actor:"north",card:"signal",lane},
    {kind:"play",actor:"south",card:"receiver",lane},
    {kind:"play",actor:"north",card:"second-chair",lane},
    {kind:"respond",actor:"south",accept:true},
    {kind:"play",actor:"north",card:"missing-corner",lane},
    {kind:"fit",actor:"south",adapter:"relay"},
    {kind:"test",actor:"north"},
    {kind:"deploy",actor:"south",lane}
  ];
  for (const action of actions) {
    const result = act(match, action);
    assert.equal(result.receipt.decision.status,"admitted");
    match = result.match;
  }
  return match;
}
function admit(match: Match, id = "local-receiver"): ReceivingWorld {
  return receiveBridge(match, exportBridgeArtifact(match), id, "admit");
}
function finish(world: ReceivingWorld, lane: Lane): ReceivingWorld {
  let w = moveReceiving(world, {kind:"inspect",actor:"north",lane}).world;
  w = moveReceiving(w, {kind:"attune",actor:"south",adapter:"relay"}).world;
  return moveReceiving(w, {kind:"cross",actor:"north",lane}).world;
}

test("destination makes separate admission decision from exact fully replayed source", () => {
  const m = fixture();
  const w = admit(m);
  assert.equal(w.admission.disposition,"admitted");
  assert.equal(w.admission.scope,"local-fictional-encounter-only");
  assert.notEqual(w.admission.receiptId,exportBridgeArtifact(m).artifactId);
  const state = replayReceiving(w);
  assert.equal(state.location,"outside");
  assert.equal(state.lane,"porch");
  assert.equal(state.eventCount,0);
  assert.equal(state.turn,"north");
});

test("a completed card battle produces a different playable crossing with exact ancestry", () => {
  const source = fixture("whole-route","hall");
  const artifact = exportBridgeArtifact(source);
  const entered = admit(source,"receiving-hall");
  const first = moveReceiving(entered,{kind:"inspect",actor:"north",lane:"hall"});
  assert.equal(first.receipt.disposition,"admitted");
  assert.equal(first.state.inspected,true);
  const second = moveReceiving(first.world,{kind:"attune",actor:"south",adapter:"relay"});
  assert.equal(second.state.attuned,true);
  const third = moveReceiving(second.world,{kind:"cross",actor:"north",lane:"hall"});
  assert.equal(third.receipt.previousReceipt, second.receipt.receiptId);
  assert.equal(third.state.crossed,true);
  assert.equal(third.state.location,"receiving-side");
  const result = exportReceivingResult(third.world);
  assert.equal(result.sourceArtifactId,artifact.artifactId);
  assert.equal(result.admissionReceipt,entered.admission.receiptId);
  assert.equal(result.completionReceipt,third.receipt.receiptId);
  assert.equal(result.authorization,"none");
  assert.deepEqual(exportReceivingResult(JSON.parse(JSON.stringify(third.world)) as ReceivingWorld),result);
});

test("destination can hold or refuse a valid incoming artifact without importing any action", () => {
  const source = fixture();
  for (const choice of ["hold","refuse"] as const) {
    const w = receiveBridge(source,exportBridgeArtifact(source),"owner-"+choice,choice);
    assert.equal(w.admission.disposition, choice === "hold" ? "held" : "refused");
    const proposed = moveReceiving(w,{kind:"inspect",actor:"north",lane:"porch"});
    assert.equal(proposed.receipt.disposition,"refused");
    assert.equal(proposed.receipt.reason,"receiving_world_has_not_admitted_source");
    assert.equal(proposed.state.inspected,false);
    assert.equal(proposed.state.turn,"north");
    assert.throws(()=>exportReceivingResult(proposed.world),/no completed/);
  }
});

test("a forged, incomplete or mismatched source cannot pass even on local admit request", () => {
  const m = fixture();
  const original = exportBridgeArtifact(m);
  const altered = {...original, lane:"road" as const};
  const falseCard = receiveBridge(m,altered,"wrong-card","admit");
  assert.equal(falseCard.admission.disposition,"refused");
  assert.equal(falseCard.admission.reason,"submitted_artifact_differs_from_replayed_source");
  assert.equal(replayReceiving(falseCard).lane,null);
  const tampered = structuredClone(m);
  (tampered.events[0] as unknown as {decision:{status:string}}).decision.status="refused";
  const fakeMatch = receiveBridge(tampered,original,"bad-history","admit");
  assert.equal(fakeMatch.admission.disposition,"refused");
  assert.equal(fakeMatch.admission.reason,"source_unverifiable_or_incomplete");
  const partial = newMatch("unfinished-source");
  const unfinished = receiveBridge(partial,original,"not-done","admit");
  assert.equal(unfinished.admission.disposition,"refused");
  assert.throws(()=>exportReceivingResult(unfinished),/no completed/);
});

test("inspection cannot jump lane, wrong tuning cannot manufacture an admitted crossing", () => {
  const w = admit(fixture("road-source","road"),"road-receiver");
  const premature = moveReceiving(w,{kind:"cross",actor:"north",lane:"road"});
  assert.equal(premature.receipt.reason,"receiving_route_not_attuned");
  const wrongLane = moveReceiving(premature.world,{kind:"inspect",actor:"north",lane:"hall"});
  assert.equal(wrongLane.receipt.reason,"source_bridge_has_different_lane");
  assert.equal(wrongLane.state.turn,"north");
  const surveyed = moveReceiving(wrongLane.world,{kind:"inspect",actor:"north",lane:"road"});
  const incorrect = moveReceiving(surveyed.world,{kind:"attune",actor:"south",adapter:"direct"});
  assert.equal(incorrect.receipt.reason,"wrong_concrete_adapter_for_bridge");
  assert.equal(incorrect.state.attuned,false);
  const tuned = moveReceiving(incorrect.world,{kind:"attune",actor:"south",adapter:"relay"});
  const end = moveReceiving(tuned.world,{kind:"cross",actor:"north",lane:"road"});
  assert.equal(end.state.crossed,true);
  assert.equal(end.state.refused,3);
  assert.equal(exportReceivingResult(end.world).location,"receiving-side");
});

test("source or admission receipt cannot be changed without failing full replay", () => {
  const w = finish(admit(fixture("tamper-source"),"tamper-receive"),"porch");
  const altered = [
    (x:ReceivingWorld) => { (x.admission as unknown as {disposition:string}).disposition="held"; },
    (x:ReceivingWorld) => { (x.claimedArtifact as unknown as {authorization:string}).authorization="external"; },
    (x:ReceivingWorld) => { (x.sourceMatch.events[3] as unknown as {action:{accept:boolean}}).action.accept=false; },
    (x:ReceivingWorld) => { (x.events[1] as unknown as {decision:{reason:string}}).decision.reason="fake"; },
    (x:ReceivingWorld) => { (x.events[2] as unknown as {previousReceipt:string}).previousReceipt="forged"; },
    (x:ReceivingWorld) => { (x as unknown as {receivingId:string}).receivingId="changed-receiver"; },
    (x:ReceivingWorld) => { (x.events[2] as unknown as {authority:string}).authority="world-admin"; },
  ];
  for (const alter of altered) {
    const clone=structuredClone(w);
    alter(clone);
    assert.throws(()=>replayReceiving(clone));
  }
});

test("new encounter IDs give distinct local descendants without duplicating originating card", () => {
  const match=fixture("same-source");
  const a=finish(admit(match,"first-receiving"),"porch");
  const b=finish(admit(match,"second-receiving"),"porch");
  assert.notEqual(exportReceivingResult(a).resultId,exportReceivingResult(b).resultId);
  assert.equal(exportReceivingResult(a).sourceArtifactId,exportReceivingResult(b).sourceArtifactId);
});

test("unsupported execution, extra authority fields and actor impersonation shapes are rejected", () => {
  const w=admit(fixture("bounded-source"),"bounded-receiver");
  assert.throws(()=>moveReceiving(w,{kind:"execute",actor:"north",shell:"uname -a"} as never),/unsupported/);
  assert.throws(()=>moveReceiving(w,{kind:"inspect",actor:"north",lane:"porch",admin:true} as never),/invalid inspect/);
  assert.throws(()=>moveReceiving(w,{kind:"attune",actor:"north",adapter:"relay"} as never),/invalid attune/);
  assert.equal(replayReceiving(w).eventCount,0);
});

test("the receiving encounter can be abandoned without crossing or altering First Bell history", () => {
  const game=admit(fixture("noncompulsory"),"walk-away");
  assert.equal(game.events.length,0);
  assert.equal(replayReceiving(game).crossed,false);
  assert.equal(replayReceiving(game).location,"outside");
});
