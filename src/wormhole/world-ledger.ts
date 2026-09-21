import { canonicalize } from "../kernel/canonical.js";
import type { WorldEvent } from "../kernel/types.js";
import {
  act, exportBridgeArtifact, newMatch, replayMatch,
  type Action, type Match
} from "./game.js";
import {
  receiveBridge, replayReceiving, moveReceiving, exportReceivingResult,
  type AdmissionChoice, type IncomingArtifact, type ReceivingAction, type ReceivingWorld
} from "./receiving.js";

export type WormholeCommand =
  | { readonly kind: "start"; readonly matchId: string }
  | { readonly kind: "card"; readonly action: Action }
  | { readonly kind: "receive"; readonly receivingId: string;
      readonly choice: AdmissionChoice; readonly artifact: IncomingArtifact }
  | { readonly kind: "receiving"; readonly action: ReceivingAction }
  | { readonly kind: "publish" };

export type WormholeEventKind =
  | "WORMHOLE_MATCH_STARTED" | "WORMHOLE_CARD_ACTION"
  | "WORMHOLE_RECEIVING_STARTED" | "WORMHOLE_RECEIVING_ACTION"
  | "WORMHOLE_LOCAL_CROSSING_RECORDED";

export interface LocalCrossing {
  readonly worldEventId: string;
  readonly receivingId: string;
  readonly sourceArtifactId: string;
  readonly resultId: string;
  readonly scope: "local-fictional-encounter-only";
}
export interface WormholeLedgerState {
  readonly match: Match | null;
  readonly receiving: ReceivingWorld | null;
  readonly crossings: readonly LocalCrossing[];
}
const KINDS = new Set<string>([
  "WORMHOLE_MATCH_STARTED", "WORMHOLE_CARD_ACTION", "WORMHOLE_RECEIVING_STARTED",
  "WORMHOLE_RECEIVING_ACTION", "WORMHOLE_LOCAL_CROSSING_RECORDED"
]);
function ensure(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function same(a: unknown, b: unknown): boolean {
  return canonicalize(a) === canonicalize(b);
}
function rawPayload(event: WorldEvent): Record<string, unknown> {
  ensure(event.payload !== null && typeof event.payload === "object"
    && !Array.isArray(event.payload), "malformed wormhole world event");
  return event.payload as Record<string, unknown>;
}
/**
 * Destination-owned replay of source/receiving game data inside the *existing*
 * Static Field world history. First Bell projections deliberately ignore these
 * explicitly fictional kinds. A receipt's contents never self-authorize a crossing.
 */
export function replayWormholeWorld(history: readonly WorldEvent[]): WormholeLedgerState {
  let match: Match | null = null;
  let receiving: ReceivingWorld | null = null;
  const crossings: LocalCrossing[] = [];
  const seenMatchIds = new Set<string>();
  const seenReceivingIds = new Set<string>();

  for (const event of history) {
    if (!KINDS.has(event.kind)) continue;
    ensure(event.evidenceClass === "derived" && event.sourceStatus === "unresolved",
      "wormhole world event must remain derived and source-unresolved");
    const payload = rawPayload(event);
    if (event.kind === "WORMHOLE_MATCH_STARTED") {
      ensure(Object.keys(payload).length === 1 && typeof payload.matchId === "string",
        "malformed game-start payload");
      const id = payload.matchId;
      ensure(!seenMatchIds.has(id), "match identity cannot be reused");
      match = newMatch(id);
      seenMatchIds.add(id);
      receiving = null;
    } else if (event.kind === "WORMHOLE_CARD_ACTION") {
      ensure(match && payload.matchId === match.matchId && Object.keys(payload).length === 3,
        "card action for missing or different match");
      const next = act(match, payload.action as Action);
      ensure(same(next.receipt, payload.receipt), "card world event does not match source reducer");
      match = next.match;
    } else if (event.kind === "WORMHOLE_RECEIVING_STARTED") {
      ensure(match && replayMatch(match).finished && receiving === null
        && Object.keys(payload).length === 4
        && typeof payload.receivingId === "string", "no valid receiving-world start");
      const id = payload.receivingId;
      ensure(!seenReceivingIds.has(id), "receiving identity cannot be reused");
      receiving = receiveBridge(match, payload.artifact as IncomingArtifact,
        id, payload.choice as AdmissionChoice);
      ensure(same(receiving.admission, payload.admission), "unverified receiving-world admission");
      seenReceivingIds.add(id);
    } else if (event.kind === "WORMHOLE_RECEIVING_ACTION") {
      ensure(receiving && payload.receivingId === receiving.receivingId
        && Object.keys(payload).length === 3, "receiving action without its owning encounter");
      const next = moveReceiving(receiving, payload.action as ReceivingAction);
      ensure(same(next.receipt, payload.receipt), "receiving world event mismatch");
      receiving = next.world;
    } else {
      ensure(receiving && Object.keys(payload).length === 2
        && payload.receivingId === receiving.receivingId,
        "crossing publication requires its active receiving world");
      ensure(!crossings.some(c => c.receivingId === receiving?.receivingId),
        "same receiving encounter cannot be published twice");
      const expected = exportReceivingResult(receiving);
      ensure(same(expected, payload.result), "crossing result does not match destination-local replay");
      crossings.push({
        worldEventId: event.eventId, receivingId: receiving.receivingId,
        sourceArtifactId: expected.sourceArtifactId, resultId: expected.resultId,
        scope: "local-fictional-encounter-only"
      });
    }
  }
  return { match, receiving, crossings };
}

export function proposeWormholeEvent(history: readonly WorldEvent[], command: WormholeCommand):
  { kind: WormholeEventKind; payload: Record<string, unknown> } {
  const state = replayWormholeWorld(history);
  if (command.kind === "start") {
    newMatch(command.matchId);
    ensure(!history.some(e => e.kind === "WORMHOLE_MATCH_STARTED"
      && (e.payload as { matchId?: string }).matchId === command.matchId),
      "match ID already used");
    return { kind: "WORMHOLE_MATCH_STARTED", payload: { matchId: command.matchId } };
  }
  if (command.kind === "card") {
    ensure(state.match && !state.receiving, "source card match unavailable after receiving began");
    const next = act(state.match, command.action);
    return { kind: "WORMHOLE_CARD_ACTION", payload: {
      matchId: state.match.matchId, action: next.receipt.action, receipt: next.receipt
    } };
  }
  if (command.kind === "receive") {
    ensure(state.match && replayMatch(state.match).finished && !state.receiving,
      "complete a source match before opening a receiving world");
    const destination = receiveBridge(state.match, command.artifact, command.receivingId, command.choice);
    ensure(!history.some(e => e.kind === "WORMHOLE_RECEIVING_STARTED"
      && (e.payload as { receivingId?: string }).receivingId === command.receivingId),
      "receiving ID already used");
    return { kind: "WORMHOLE_RECEIVING_STARTED", payload: {
      receivingId: command.receivingId, artifact: destination.claimedArtifact,
      choice: command.choice, admission: destination.admission
    } };
  }
  ensure(state.receiving, "no receiving encounter exists");
  if (command.kind === "receiving") {
    const next = moveReceiving(state.receiving, command.action);
    return { kind: "WORMHOLE_RECEIVING_ACTION", payload: {
      receivingId: state.receiving.receivingId, action: next.receipt.action, receipt: next.receipt
    } };
  }
  ensure(state.receiving.admission.disposition === "admitted",
    "only an admitted receiving game may record a completed crossing");
  ensure(!state.crossings.some(c => c.receivingId === state.receiving?.receivingId),
    "crossing is already recorded in the destination world");
  const result = exportReceivingResult(state.receiving);
  return { kind: "WORMHOLE_LOCAL_CROSSING_RECORDED",
    payload: { receivingId: state.receiving.receivingId, result } };
}

export function projectWormholeWorld(history: readonly WorldEvent[]) {
  const state = replayWormholeWorld(history);
  const board = state.match ? replayMatch(state.match) : null;
  const receiving = state.receiving ? replayReceiving(state.receiving) : null;
  const sourceArtifact = state.match && board?.finished ? exportBridgeArtifact(state.match) : null;
  const published = state.receiving
    ? state.crossings.some(c => c.receivingId === state.receiving?.receivingId) : false;
  return {
    source: state.match ? {
      matchId: state.match.matchId, board,
      artifact: sourceArtifact, events: state.match.events
    } : null,
    receiving: state.receiving ? {
      receivingId: state.receiving.receivingId, admission: state.receiving.admission,
      state: receiving, events: state.receiving.events,
      result: receiving?.crossed ? exportReceivingResult(state.receiving) : null,
      published
    } : null,
    crossings: state.crossings
  };
}
