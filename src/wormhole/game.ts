import { sha256Canonical, canonicalize } from "../kernel/canonical.js";

export const WORMHOLE_SCHEMA = "static-field.wormhole-wars.match/v0.1";
export const ARTIFACT_SCHEMA = "static-field.wormhole-wars.artifact/v0.1";
export type Player = "north" | "south";
export type Lane = "porch" | "hall" | "road";
export type Card = "signal" | "receiver" | "second-chair" | "missing-corner";
export type Adapter = "direct" | "relay" | "reverse";
export type Action =
  | { kind: "play"; actor: Player; card: Card; lane: Lane }
  | { kind: "respond"; actor: Player; accept: boolean }
  | { kind: "fit"; actor: Player; adapter: Adapter }
  | { kind: "test"; actor: Player }
  | { kind: "deploy"; actor: Player; lane: Lane }
  | { kind: "rest"; actor: Player };

export interface Decision {
  readonly status: "admitted" | "refused";
  readonly reason: string;
}
export interface Receipt {
  readonly schema: "static-field.wormhole-wars.event/v0.1";
  readonly matchId: string;
  readonly sequence: number;
  readonly previousReceipt: string | null;
  readonly action: Action;
  readonly decision: Decision;
  readonly receiptId: string;
}
export interface Match {
  readonly schema: typeof WORMHOLE_SCHEMA;
  readonly matchId: string;
  readonly events: readonly Receipt[];
}
interface Piece {
  readonly id: string;
  readonly kind: "source" | "target";
  readonly owner: Player;
  readonly lane: Lane;
  readonly port: "tone:bell" | "tone:knock";
}
interface Offer {
  readonly lane: Lane;
  readonly from: Player;
  readonly to: Player;
  readonly receiptId: string;
  readonly accepted: boolean;
}
interface Puzzle {
  readonly lane: Lane;
  readonly sourceId: string;
  readonly targetId: string;
  readonly openedReceipt: string;
  adapter: Adapter | null;
  adapterReceipt: string | null;
}
export interface Board {
  turn: Player;
  charge: Record<Player, number>;
  hand: Record<Player, Record<Card, number>>;
  pieces: Piece[];
  offer: Offer | null;
  puzzle: Puzzle | null;
  bridgeReceipt: string | null;
  bridgeLane: Lane | null;
  finished: boolean;
  finishedReceipt: string | null;
  refused: number;
  receiptHead: string | null;
  eventCount: number;
}
const LANES: readonly Lane[] = ["porch", "hall", "road"];
const CARDS: readonly Card[] = ["signal", "receiver", "second-chair", "missing-corner"];
const ADAPTERS: readonly Adapter[] = ["direct", "relay", "reverse"];
const LIMIT = 128;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
function opponent(p: Player): Player { return p === "north" ? "south" : "north"; }
function keys(value: unknown, names: readonly string[]): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && canonicalize(Object.keys(value).sort()) === canonicalize([...names].sort());
}
function asserted(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function validateAction(value: unknown): asserts value is Action {
  asserted(value !== null && typeof value === "object" && !Array.isArray(value), "invalid action");
  const a = value as Record<string, unknown>;
  asserted(a.actor === "north" || a.actor === "south", "invalid actor");
  const simple = ["rest", "test"].includes(String(a.kind));
  if (simple) asserted(keys(a, ["kind", "actor"]), "undeclared action fields");
  else if (a.kind === "play") {
    asserted(keys(a, ["kind", "actor", "card", "lane"])
      && CARDS.includes(a.card as Card) && LANES.includes(a.lane as Lane), "unsupported card or lane");
  } else if (a.kind === "respond") {
    asserted(keys(a, ["kind", "actor", "accept"]) && typeof a.accept === "boolean", "invalid response");
  } else if (a.kind === "fit") {
    asserted(keys(a, ["kind", "actor", "adapter"]) && ADAPTERS.includes(a.adapter as Adapter), "invalid adapter");
  } else if (a.kind === "deploy") {
    asserted(keys(a, ["kind", "actor", "lane"]) && LANES.includes(a.lane as Lane), "invalid deployment");
  } else asserted(false, "unsupported game action");
}
function newHand(): Record<Card, number> {
  return { signal: 1, receiver: 1, "second-chair": 1, "missing-corner": 1 };
}
function initial(): Board {
  return {
    turn: "north", charge: { north: 4, south: 4 },
    hand: { north: newHand(), south: newHand() },
    pieces: [], offer: null, puzzle: null, bridgeReceipt: null, bridgeLane: null,
    finished: false, finishedReceipt: null, refused: 0, receiptHead: null, eventCount: 0
  };
}
function cost(a: Action): number {
  if (a.kind === "play") return a.card === "missing-corner" ? 2 : 1;
  if (a.kind === "fit" || a.kind === "deploy") return 1;
  return 0;
}
function determine(s: Board, a: Action): Decision {
  const refuse = (reason: string): Decision => ({ status: "refused", reason });
  const yes = (reason: string): Decision => ({ status: "admitted", reason });
  if (s.finished) return refuse("encounter_already_finished");
  if (a.actor !== s.turn) return refuse("not_your_turn");
  if (s.charge[a.actor] < cost(a)) return refuse("insufficient_charge");
  if (a.kind === "rest") return s.charge[a.actor] < 5 ? yes("restored_capacity") : refuse("charge_already_full");
  if (a.kind === "respond") {
    if (!s.offer || s.offer.accepted || s.offer.to !== a.actor) return refuse("no_open_offer_for_actor");
    return yes(a.accept ? "chair_voluntarily_accepted" : "chair_declined");
  }
  if (a.kind === "play") {
    if (!s.hand[a.actor][a.card]) return refuse("card_not_in_hand");
    if (a.card === "signal" || a.card === "receiver") {
      if (s.puzzle || s.bridgeReceipt) return refuse("construction_already_underway");
      if (s.pieces.some(p => p.lane === a.lane && p.kind === (a.card === "signal" ? "source" : "target")))
        return refuse("that_lane_port_is_occupied");
      return yes("piece_placed");
    }
    if (a.card === "second-chair") {
      if (s.offer || s.puzzle || s.bridgeReceipt) return refuse("another_offer_or_construction_exists");
      if (!s.pieces.some(p => p.owner === a.actor && p.lane === a.lane))
        return refuse("offer_requires_your_piece_in_lane");
      return yes("collaboration_offered");
    }
    if (!s.offer || !s.offer.accepted || s.offer.lane !== a.lane)
      return refuse("missing_accepted_chair_for_lane");
    if (s.puzzle || s.bridgeReceipt) return refuse("puzzle_already_open");
    const source = s.pieces.find(p => p.kind === "source" && p.lane === a.lane);
    const target = s.pieces.find(p => p.kind === "target" && p.lane === a.lane);
    if (!source || !target || source.owner === target.owner
      || ![source.owner, target.owner].includes(s.offer.from)
      || ![source.owner, target.owner].includes(s.offer.to)) return refuse("need_distinct_collaborators_ports");
    return yes("concrete_gap_becomes_playable");
  }
  if (a.kind === "fit") {
    if (!s.puzzle || s.bridgeReceipt) return refuse("no_open_puzzle");
    return yes("adapter_selected");
  }
  if (a.kind === "test") {
    if (!s.puzzle || !s.puzzle.adapter) return refuse("no_adapter_to_test");
    const source = s.pieces.find(p => p.id === s.puzzle?.sourceId);
    const target = s.pieces.find(p => p.id === s.puzzle?.targetId);
    // There is no generic label-based compatibility: the selected relay converts
    // the declared bell output into the declared knock input in this local game.
    if (source?.port !== "tone:bell" || target?.port !== "tone:knock"
      || s.puzzle.adapter !== "relay") return refuse("concrete_port_join_failed");
    return yes("bridge_constituted");
  }
  if (!s.bridgeReceipt || s.bridgeLane !== a.lane) return refuse("no_admitted_bridge_at_lane");
  return yes("shared_lane_stabilized");
}
function apply(s: Board, a: Action, d: Decision, receiptId: string): void {
  s.receiptHead = receiptId;
  s.eventCount += 1;
  if (d.status === "refused") { s.refused += 1; return; }
  s.charge[a.actor] -= cost(a);
  if (a.kind === "rest") s.charge[a.actor] = Math.min(5, s.charge[a.actor] + 2);
  else if (a.kind === "respond") {
    if (a.accept && s.offer) s.offer = { ...s.offer, accepted: true };
    else s.offer = null;
  } else if (a.kind === "play") {
    s.hand[a.actor][a.card] -= 1;
    if (a.card === "signal" || a.card === "receiver") {
      s.pieces.push({
        id: receiptId, owner: a.actor, lane: a.lane,
        kind: a.card === "signal" ? "source" : "target",
        port: a.card === "signal" ? "tone:bell" : "tone:knock"
      });
    } else if (a.card === "second-chair") {
      s.offer = { lane: a.lane, from: a.actor, to: opponent(a.actor), receiptId, accepted: false };
    } else {
      const source = s.pieces.find(p => p.kind === "source" && p.lane === a.lane);
      const target = s.pieces.find(p => p.kind === "target" && p.lane === a.lane);
      if (!source || !target) throw new Error("accepted opening lacks pieces");
      s.puzzle = {
        lane: a.lane, sourceId: source.id, targetId: target.id,
        openedReceipt: receiptId, adapter: null, adapterReceipt: null
      };
    }
  } else if (a.kind === "fit") {
    if (!s.puzzle) throw new Error("accepted fitting lacks puzzle");
    s.puzzle.adapter = a.adapter;
    s.puzzle.adapterReceipt = receiptId;
  } else if (a.kind === "test") {
    s.bridgeReceipt = receiptId;
    s.bridgeLane = s.puzzle?.lane ?? null;
  } else if (a.kind === "deploy") {
    s.finished = true;
    s.finishedReceipt = receiptId;
  }
  s.turn = opponent(s.turn);
}
export function newMatch(matchId: string): Match {
  asserted(typeof matchId === "string" && ID.test(matchId), "invalid local match ID");
  return { schema: WORMHOLE_SCHEMA, matchId, events: [] };
}
export function replayMatch(match: Match): Board {
  asserted(keys(match, ["schema", "matchId", "events"]) && match.schema === WORMHOLE_SCHEMA
    && typeof match.matchId === "string" && ID.test(match.matchId)
    && Array.isArray(match.events) && match.events.length <= LIMIT, "invalid match envelope");
  const s = initial();
  let prev: string | null = null;
  for (const [index, event] of match.events.entries()) {
    asserted(event && typeof event === "object", "invalid receipt");
    validateAction(event.action);
    const decision = determine(s, event.action);
    const body = {
      schema: "static-field.wormhole-wars.event/v0.1" as const,
      matchId: match.matchId, sequence: index + 1,
      previousReceipt: prev, action: event.action, decision
    };
    const expected = { ...body, receiptId: "ww-rct-sha256:" + sha256Canonical(body) };
    asserted(canonicalize(event) === canonicalize(expected), "game receipt/transition mismatch at " + (index + 1));
    apply(s, event.action, decision, expected.receiptId);
    prev = expected.receiptId;
  }
  return s;
}
export function act(match: Match, action: Action): { match: Match; receipt: Receipt; board: Board } {
  validateAction(action);
  const s = replayMatch(match);
  asserted(match.events.length < LIMIT, "local match event limit reached");
  const actionSnapshot = JSON.parse(canonicalize(action)) as Action;
  const body = {
    schema: "static-field.wormhole-wars.event/v0.1" as const,
    matchId: match.matchId, sequence: match.events.length + 1,
    previousReceipt: s.receiptHead, action: actionSnapshot, decision: determine(s, actionSnapshot)
  };
  const receipt: Receipt = { ...body, receiptId: "ww-rct-sha256:" + sha256Canonical(body) };
  const next: Match = { schema: WORMHOLE_SCHEMA, matchId: match.matchId, events: [...match.events, receipt] };
  return { match: next, receipt, board: replayMatch(next) };
}
export function exportBridgeArtifact(match: Match): {
  schema: typeof ARTIFACT_SCHEMA; artifactId: string; matchId: string; lane: Lane;
  sourceReceipt: string; targetReceipt: string; offerReceipt: string;
  openingReceipt: string; adapterReceipt: string; bridgeReceipt: string;
  completionReceipt: string; authorization: "none"; evidence: "local-fictional-game";
} {
  const s = replayMatch(match);
  asserted(s.finished && s.puzzle && s.offer && s.puzzle.adapterReceipt && s.bridgeReceipt
    && s.finishedReceipt, "no completed local bridge encounter");
  const body = {
    schema: ARTIFACT_SCHEMA, matchId: match.matchId, lane: s.puzzle.lane,
    sourceReceipt: s.puzzle.sourceId, targetReceipt: s.puzzle.targetId,
    offerReceipt: s.offer.receiptId, openingReceipt: s.puzzle.openedReceipt,
    adapterReceipt: s.puzzle.adapterReceipt, bridgeReceipt: s.bridgeReceipt,
    completionReceipt: s.finishedReceipt,
    authorization: "none" as const, evidence: "local-fictional-game" as const
  };
  return { ...body, artifactId: "ww-art-sha256:" + sha256Canonical(body) };
}
