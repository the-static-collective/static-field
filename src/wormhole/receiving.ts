import { canonicalize, sha256Canonical } from "../kernel/canonical.js";
import { exportBridgeArtifact, type Match, type Lane } from "./game.js";

/**
 * A receiving-world game owned by Static Field's experimental wormhole module.
 * This does NOT dispatch into First Bell or import permissions from a card.
 * Source records are local fictional histories, not identity-authenticated facts.
 */
export const RECEIVING_SCHEMA = "static-field.wormhole-wars.receiving/v0.1";
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_ACTIONS = 64;
type Actor = "north" | "south";
export type AdmissionChoice = "admit" | "hold" | "refuse";
export type IncomingArtifact = ReturnType<typeof exportBridgeArtifact>;
export type ReceivingAction =
  | { readonly kind: "inspect"; readonly actor: "north"; readonly lane: Lane }
  | { readonly kind: "attune"; readonly actor: "south"; readonly adapter: "relay" | "direct" }
  | { readonly kind: "cross"; readonly actor: "north"; readonly lane: Lane };

export interface Admission {
  readonly schema: "static-field.wormhole-wars.admission/v0.1";
  readonly receivingId: string;
  readonly sourceDigest: string;
  readonly claimedArtifactId: string;
  readonly requestedDisposition: AdmissionChoice;
  readonly disposition: "admitted" | "held" | "refused";
  readonly reason: string;
  readonly scope: "local-fictional-encounter-only";
  readonly receiptId: string;
}
export interface ReceivingReceipt {
  readonly schema: "static-field.wormhole-wars.receiving-event/v0.1";
  readonly receivingId: string;
  readonly sequence: number;
  readonly previousReceipt: string;
  readonly action: ReceivingAction;
  readonly disposition: "admitted" | "refused";
  readonly reason: string;
  readonly receiptId: string;
}
export interface ReceivingWorld {
  readonly schema: typeof RECEIVING_SCHEMA;
  readonly receivingId: string;
  readonly sourceMatch: Match;
  readonly claimedArtifact: IncomingArtifact;
  readonly requestedDisposition: AdmissionChoice;
  readonly admission: Admission;
  readonly events: readonly ReceivingReceipt[];
}
export interface ReceivingState {
  readonly disposition: Admission["disposition"];
  readonly lane: Lane | null;
  readonly turn: Actor;
  readonly inspected: boolean;
  readonly attuned: boolean;
  readonly crossed: boolean;
  readonly refused: number;
  readonly receiptHead: string;
  readonly eventCount: number;
  readonly location: "outside" | "receiving-side";
}
function requireCondition(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function exactKeys(v: unknown, names: readonly string[]): boolean {
  return !!v && typeof v === "object" && !Array.isArray(v)
    && canonicalize(Object.keys(v).sort()) === canonicalize([...names].sort());
}
function snapshot<T>(input: T): T {
  return JSON.parse(canonicalize(input)) as T;
}
function verifySource(source: Match, claimed: IncomingArtifact):
  { good: boolean; reason: string; lane: Lane | null } {
  try {
    const expected = exportBridgeArtifact(source); // independently replays EVERY source move
    if (canonicalize(expected) !== canonicalize(claimed)) {
      return { good: false, reason: "submitted_artifact_differs_from_replayed_source", lane: null };
    }
    // This checks local game rules only; local content hashes are not signatures.
    return { good: true, reason: "source_locally_replayed_and_artifact_matched", lane: expected.lane };
  } catch {
    return { good: false, reason: "source_unverifiable_or_incomplete", lane: null };
  }
}
function calculateAdmission(
  id: string, match: Match, claimed: IncomingArtifact, choice: AdmissionChoice
): Admission {
  const result = verifySource(match, claimed);
  const disposition: Admission["disposition"] = !result.good || choice === "refuse" ? "refused"
    : choice === "hold" ? "held" : "admitted";
  const reason = !result.good ? result.reason : choice === "hold" ? "receiving_owner_held"
    : choice === "refuse" ? "receiving_owner_refused" : "receiving_owner_admitted_local_play";
  const body = {
    schema: "static-field.wormhole-wars.admission/v0.1" as const,
    receivingId: id,
    sourceDigest: sha256Canonical(match),
    claimedArtifactId: typeof claimed?.artifactId === "string" ? claimed.artifactId : "unresolved",
    requestedDisposition: choice,
    disposition, reason, scope: "local-fictional-encounter-only" as const
  };
  return { ...body, receiptId: "ww-adm-sha256:" + sha256Canonical(body) };
}
function validAction(a: unknown): asserts a is ReceivingAction {
  requireCondition(a && typeof a === "object" && !Array.isArray(a), "invalid receiving action");
  const action = a as Record<string, unknown>;
  if (action.kind === "inspect") {
    requireCondition(exactKeys(action, ["kind", "actor", "lane"]) && action.actor === "north"
      && ["porch","hall","road"].includes(String(action.lane)), "invalid inspect");
  } else if (action.kind === "attune") {
    requireCondition(exactKeys(action, ["kind", "actor", "adapter"]) && action.actor === "south"
      && ["relay","direct"].includes(String(action.adapter)), "invalid attune");
  } else if (action.kind === "cross") {
    requireCondition(exactKeys(action, ["kind", "actor", "lane"]) && action.actor === "north"
      && ["porch","hall","road"].includes(String(action.lane)), "invalid crossing");
  } else throw new Error("unsupported receiving-world action");
}
function judge(s: ReceivingState, action: ReceivingAction): { disposition: "admitted" | "refused"; reason: string } {
  const refuse = (reason: string) => ({ disposition: "refused" as const, reason });
  const yes = (reason: string) => ({ disposition: "admitted" as const, reason });
  if (s.disposition !== "admitted") return refuse("receiving_world_has_not_admitted_source");
  if (s.crossed) return refuse("crossing_already_complete");
  if (action.actor !== s.turn) return refuse("not_your_turn");
  if (action.kind === "inspect") {
    if (s.inspected) return refuse("route_already_inspected");
    if (action.lane !== s.lane) return refuse("source_bridge_has_different_lane");
    return yes("receiving_route_inspected");
  }
  if (action.kind === "attune") {
    if (!s.inspected) return refuse("route_not_inspected");
    if (s.attuned) return refuse("route_already_attuned");
    if (action.adapter !== "relay") return refuse("wrong_concrete_adapter_for_bridge");
    return yes("receiving_relay_attuned");
  }
  if (!s.attuned) return refuse("receiving_route_not_attuned");
  if (action.lane !== s.lane) return refuse("crossing_lane_mismatch");
  return yes("new_local_crossing_completed");
}
function initial(world: ReceivingWorld, lane: Lane | null): ReceivingState {
  return {
    disposition: world.admission.disposition, lane, turn: "north", inspected: false,
    attuned: false, crossed: false, refused: 0, receiptHead: world.admission.receiptId,
    eventCount: 0, location: "outside"
  };
}
function transition(s: ReceivingState, a: ReceivingAction, receipt: ReceivingReceipt): ReceivingState {
  if (receipt.disposition === "refused") {
    return { ...s, refused: s.refused + 1, eventCount: s.eventCount + 1, receiptHead: receipt.receiptId };
  }
  if (a.kind === "inspect") {
    return { ...s, inspected: true, turn: "south", eventCount: s.eventCount + 1, receiptHead: receipt.receiptId };
  }
  if (a.kind === "attune") {
    return { ...s, attuned: true, turn: "north", eventCount: s.eventCount + 1, receiptHead: receipt.receiptId };
  }
  return { ...s, crossed: true, location: "receiving-side",
    eventCount: s.eventCount + 1, receiptHead: receipt.receiptId };
}
export function receiveBridge(
  sourceMatch: Match, claimedArtifact: IncomingArtifact, receivingId: string,
  requestedDisposition: AdmissionChoice
): ReceivingWorld {
  requireCondition(typeof receivingId === "string" && ID.test(receivingId), "invalid receiving identity");
  requireCondition(["admit", "hold", "refuse"].includes(requestedDisposition), "invalid admission choice");
  const source = snapshot(sourceMatch);
  const claimed = snapshot(claimedArtifact);
  const admission = calculateAdmission(receivingId, source, claimed, requestedDisposition);
  return {
    schema: RECEIVING_SCHEMA, receivingId, sourceMatch: source, claimedArtifact: claimed,
    requestedDisposition, admission, events: []
  };
}
export function replayReceiving(world: ReceivingWorld): ReceivingState {
  requireCondition(exactKeys(world, ["schema","receivingId","sourceMatch","claimedArtifact",
    "requestedDisposition","admission","events"]) && world.schema === RECEIVING_SCHEMA,
    "invalid receiving-world envelope");
  requireCondition(typeof world.receivingId === "string" && ID.test(world.receivingId)
    && ["admit", "hold", "refuse"].includes(world.requestedDisposition)
    && Array.isArray(world.events) && world.events.length <= MAX_ACTIONS,
    "invalid receiving-world metadata");
  const calculated = calculateAdmission(world.receivingId, world.sourceMatch,
    world.claimedArtifact, world.requestedDisposition);
  requireCondition(canonicalize(world.admission) === canonicalize(calculated),
    "receiving admission receipt mismatch");
  const source = verifySource(world.sourceMatch, world.claimedArtifact);
  let state = initial(world, calculated.disposition === "admitted" && source.good ? source.lane : null);
  for (const [i, recorded] of world.events.entries()) {
    requireCondition(recorded && typeof recorded === "object", "missing receiving receipt");
    validAction(recorded.action);
    const decision = judge(state, recorded.action);
    const body: Omit<ReceivingReceipt, "receiptId"> = {
      schema: "static-field.wormhole-wars.receiving-event/v0.1",
      receivingId: world.receivingId, sequence: i + 1,
      previousReceipt: state.receiptHead, action: recorded.action, ...decision
    };
    const expected: ReceivingReceipt = { ...body, receiptId: "ww-rcv-sha256:" + sha256Canonical(body) };
    requireCondition(canonicalize(recorded) === canonicalize(expected),
      "receiving encounter receipt/transition mismatch at " + (i + 1));
    state = transition(state, recorded.action, expected);
  }
  return state;
}
export function moveReceiving(world: ReceivingWorld, action: ReceivingAction): {
  world: ReceivingWorld; receipt: ReceivingReceipt; state: ReceivingState
} {
  validAction(action);
  const state = replayReceiving(world);
  requireCondition(world.events.length < MAX_ACTIONS, "receiving encounter event limit reached");
  const actionSnapshot = snapshot(action);
  const decision = judge(state, actionSnapshot);
  const body: Omit<ReceivingReceipt,"receiptId"> = {
    schema: "static-field.wormhole-wars.receiving-event/v0.1",
    receivingId: world.receivingId, sequence: world.events.length + 1,
    previousReceipt: state.receiptHead, action: actionSnapshot, ...decision
  };
  const receipt: ReceivingReceipt = { ...body, receiptId: "ww-rcv-sha256:" + sha256Canonical(body) };
  const next: ReceivingWorld = { ...world, events: [...world.events, receipt] };
  return { world: next, receipt, state: replayReceiving(next) };
}
export function exportReceivingResult(world: ReceivingWorld): {
  schema: "static-field.wormhole-wars.receiving-result/v0.1";
  sourceArtifactId: string; receivingId: string; admissionReceipt: string;
  completionReceipt: string; location: "receiving-side";
  authorization: "none"; evidence: "local-fictional-game";
  resultId: string;
} {
  const s = replayReceiving(world);
  requireCondition(s.crossed && world.admission.disposition === "admitted",
    "receiving world has no completed local crossing");
  const body = {
    schema: "static-field.wormhole-wars.receiving-result/v0.1" as const,
    sourceArtifactId: world.claimedArtifact.artifactId,
    receivingId: world.receivingId, admissionReceipt: world.admission.receiptId,
    completionReceipt: s.receiptHead, location: "receiving-side" as const,
    authorization: "none" as const, evidence: "local-fictional-game" as const
  };
  return { ...body, resultId: "ww-result-sha256:" + sha256Canonical(body) };
}
