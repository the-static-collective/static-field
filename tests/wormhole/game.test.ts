import test from "node:test";
import assert from "node:assert/strict";
import {
  act, exportBridgeArtifact, newMatch, replayMatch, type Action, type Match,
} from "../../src/wormhole/game.js";

function take(match: Match, action: Action): Match { return act(match, action).match; }
function play(actor: "north" | "south", card: "signal" | "receiver" | "second-chair" | "missing-corner", lane = "porch" as const): Action {
  return { kind: "play", actor, card, lane };
}
function opened(): Match {
  let m = newMatch("specimen");
  m = take(m, play("north", "signal"));
  m = take(m, play("south", "receiver"));
  m = take(m, play("north", "second-chair"));
  m = take(m, { kind: "respond", actor: "south", accept: true });
  m = take(m, play("north", "missing-corner"));
  return m;
}
function finish(): Match {
  let m = opened();
  m = take(m, { kind: "fit", actor: "south", adapter: "relay" });
  m = take(m, { kind: "test", actor: "north" });
  m = take(m, { kind: "deploy", actor: "south", lane: "porch" });
  return m;
}
test("two players construct one new playable lane action through exact port matching", () => {
  const m = finish();
  const board = replayMatch(m);
  assert.equal(board.finished, true);
  assert.equal(board.finishedReceipt, m.events.at(-1)?.receiptId);
  assert.equal(board.bridgeReceipt, m.events.at(-2)?.receiptId);
  assert.equal(board.pieces.length, 2);
  assert.notEqual(board.pieces[0]?.owner, board.pieces[1]?.owner);
  const artifact = exportBridgeArtifact(m);
  assert.equal(artifact.authorization, "none");
  assert.equal(artifact.sourceReceipt, m.events[0]?.receiptId);
  assert.equal(artifact.targetReceipt, m.events[1]?.receiptId);
  assert.equal(artifact.offerReceipt, m.events[2]?.receiptId);
  assert.equal(artifact.openingReceipt, m.events[4]?.receiptId);
  assert.equal(artifact.adapterReceipt, m.events[5]?.receiptId);
  assert.equal(artifact.bridgeReceipt, m.events[6]?.receiptId);
  assert.equal(artifact.completionReceipt, m.events[7]?.receiptId);
  assert.deepEqual(exportBridgeArtifact(JSON.parse(JSON.stringify(m)) as Match), artifact);
});
test("a refused attempt is receipted but does not steal the other player's turn", () => {
  const match = newMatch("refusals");
  const first = act(match, play("south", "receiver"));
  assert.equal(first.receipt.decision.status, "refused");
  assert.equal(first.receipt.decision.reason, "not_your_turn");
  assert.equal(first.board.turn, "north");
  assert.equal(first.board.hand.south.receiver, 1);
  assert.equal(first.board.charge.south, 4);
  const next = act(first.match, play("north", "signal"));
  assert.equal(next.receipt.decision.status, "admitted");
  assert.equal(next.board.turn, "south");
  assert.equal(next.board.refused, 1);
});
test("second chair acceptance is required and refusal does not impersonate consent", () => {
  let m = take(newMatch("consent"), play("north", "signal"));
  m = take(m, play("south", "receiver"));
  let failed = act(m, play("north", "missing-corner"));
  assert.equal(failed.receipt.decision.reason, "missing_accepted_chair_for_lane");
  assert.equal(failed.board.puzzle, null);
  m = take(failed.match, play("north", "second-chair"));
  const declined = act(m, { kind: "respond", actor: "south", accept: false });
  assert.equal(declined.receipt.decision.reason, "chair_declined");
  assert.equal(declined.board.offer, null);
  const reattempt = act(declined.match, play("north", "missing-corner"));
  assert.equal(reattempt.receipt.decision.status, "refused");
  assert.equal(reattempt.board.puzzle, null);
});
test("a wrong adapter exposes a concrete gap without declaring the bridge complete", () => {
  let m = opened();
  m = take(m, { kind: "fit", actor: "south", adapter: "direct" });
  const failed = act(m, { kind: "test", actor: "north" });
  assert.equal(failed.receipt.decision.reason, "concrete_port_join_failed");
  assert.equal(failed.board.bridgeReceipt, null);
  assert.equal(failed.board.turn, "north");
  assert.throws(() => exportBridgeArtifact(failed.match), /no completed/);
  m = take(failed.match, { kind: "fit", actor: "north", adapter: "relay" });
  m = take(m, { kind: "test", actor: "south" });
  assert.equal(replayMatch(m).bridgeReceipt, m.events.at(-1)?.receiptId);
});
test("insufficient charge must be restored by consuming a turn to rest", () => {
  let m = take(newMatch("scarcity"), play("north", "signal"));
  m = take(m, play("south", "receiver"));
  m = take(m, play("north", "second-chair"));
  m = take(m, { kind: "respond", actor: "south", accept: true });
  assert.equal(replayMatch(m).charge.north, 2);
  // A second missing-corner cannot be afforded after spending an additional turn or resource.
  m = take(m, { kind: "rest", actor: "north" });
  assert.equal(replayMatch(m).charge.north, 4);
  assert.equal(replayMatch(m).turn, "south");
  assert.equal(replayMatch(m).hand.north["missing-corner"], 1);
});
test("card stock and lane boundaries forbid duplicate ports and fake same-player collaboration", () => {
  let m = take(newMatch("port"), play("north", "signal"));
  const duplicate = act(m, play("south", "signal"));
  assert.equal(duplicate.receipt.decision.reason, "that_lane_port_is_occupied");
  m = take(duplicate.match, play("south", "receiver"));
  const lane = act(m, play("north", "second-chair", "road"));
  assert.equal(lane.receipt.decision.reason, "offer_requires_your_piece_in_lane");
  assert.equal(lane.board.offer, null);
});
test("sealed game history refuses modified rules, altered receipts and counterfeit bridge awards", () => {
  const m = finish();
  const mutations = [
    (x: Match) => { (x.events[0] as unknown as {action: {card: string}}).action.card = "receiver"; },
    (x: Match) => { (x.events[3] as unknown as {decision: {reason: string}}).decision.reason = "chair_declined"; },
    (x: Match) => { (x.events[4] as unknown as {previousReceipt: string}).previousReceipt = "forged"; },
    (x: Match) => { (x.events[6] as unknown as {receiptId: string}).receiptId = "ww-rct-sha256:" + "0".repeat(64); },
    (x: Match) => { (x.events[7] as unknown as {authorization: string}).authorization = "external"; },
  ];
  for (const modify of mutations) {
    const forged = structuredClone(m);
    modify(forged);
    assert.throws(() => replayMatch(forged), /mismatch/);
  }
  assert.throws(() => exportBridgeArtifact(newMatch("unearned")), /no completed/);
});
test("unsupported commands and unauthenticated authority fields are rejected", () => {
  const m = newMatch("guard");
  assert.throws(() => act(m, { kind: "execute", actor: "north", shell: "echo hi" } as unknown as Action), /unsupported/);
  assert.throws(() => act(m, { ...play("north", "signal"), admin: true } as unknown as Action), /undeclared/);
  assert.equal(m.events.length, 0);
});
test("deterministic replay and independent match IDs produce distinct descendants", () => {
  const a = finish();
  const b: Match = { ...a, matchId: "another-run" };
  assert.throws(() => replayMatch(b), /mismatch/);
  const clone = JSON.parse(JSON.stringify(a)) as Match;
  assert.deepEqual(replayMatch(clone), replayMatch(a));
  assert.equal(exportBridgeArtifact(clone).artifactId, exportBridgeArtifact(a).artifactId);
});
