import { appendEvent, makeEvent } from "../kernel/events.js";
import type { ParticipantRef, WorldEvent } from "../kernel/types.js";
import { CAPACITY_VERBS, availableCapacityVerbs, deriveCharge, type CapacityVerb } from "../world/charge.js";
import { deriveFirstBellStory } from "./story.js";
import { FIRST_BELL_RELATION } from "../world/resonance.js";

export type FirstBellActionType =
  | "ENTER_PORCH" | "SET_OUT_CHAIR" | "ROUTE_CABLE" | "PUT_OUT_WATER" | "CHECK_DOOR"
  | "CONTINUE_PREPARATION" | "BELL_1" | "BELL_2" | "NOTICE_OPEN_CORNER"
  | "ENTER_RESONANCE" | "TRACE_PRIOR_RELATION" | "KNOCK" | "CLOSE_PLAY"
  | "MARK_ABSENCE" | CapacityVerb;

export interface FirstBellAction {
  readonly type: FirstBellActionType;
  readonly actor: ParticipantRef;
  readonly occurredAt: string;
  readonly subjectId?: string;
}

function lastParent(history: readonly WorldEvent[]): readonly string[] {
  const last = history.at(-1);
  return last ? [last.eventId] : [];
}

function hasPrepared(history: readonly WorldEvent[], objectId: string): boolean {
  return history.some((event) =>
    event.kind === "OBJECT_PREPARED" &&
    (event.payload as { objectId?: string }).objectId === objectId
  );
}

function append(
  history: readonly WorldEvent[],
  action: FirstBellAction,
  kind: string,
  payload: Record<string, unknown>,
  sourceStatus: "resolved" | "unresolved" | "contested" = "resolved",
): readonly WorldEvent[] {
  const event = makeEvent({
    kind,
    occurredAt: action.occurredAt,
    actor: action.actor,
    evidenceClass: kind === "RESONANCE_RELATION_TRACED" ? "derived" : "observed",
    sourceStatus,
    payload: payload as never,
    parentEventIds: lastParent(history),
  });
  return appendEvent(history, event);
}

export function dispatchFirstBellAction(
  history: readonly WorldEvent[],
  action: FirstBellAction,
): readonly WorldEvent[] {
  const story = deriveFirstBellStory(history);

  if (CAPACITY_VERBS.includes(action.type as CapacityVerb)) {
    const verb = action.type as CapacityVerb;
    if (!availableCapacityVerbs(deriveCharge(history)).includes(verb)) {
      throw new Error(`${verb} unavailable at current Charge`);
    }
    return append(history, action, "CAPACITY_PRACTICE", { verb });
  }

  switch (action.type) {
    case "ENTER_PORCH":
      if (history.some((event) => event.kind === "PORCH_ARRIVAL" && event.actor.id === action.actor.id)) return history;
      return append(history, action, "PORCH_ARRIVAL", { regionId: "the-porch" });

    case "SET_OUT_CHAIR":
      if (!history.some((event) => event.kind === "PORCH_ARRIVAL")) throw new Error("enter the porch first");
      if (hasPrepared(history, "chair-a")) return history;
      return append(history, action, "OBJECT_PREPARED", { objectId: "chair-a", verb: "set-out" });

    case "ROUTE_CABLE":
      if (!history.some((event) => event.kind === "PORCH_ARRIVAL")) throw new Error("enter the porch first");
      if (hasPrepared(history, "extension-cord")) return history;
      return append(history, action, "OBJECT_PREPARED", { objectId: "extension-cord", verb: "route" });

    case "PUT_OUT_WATER":
      if (!history.some((event) => event.kind === "PORCH_ARRIVAL")) throw new Error("enter the porch first");
      if (hasPrepared(history, "dog-water-bowl")) return history;
      return append(history, action, "OBJECT_PREPARED", { objectId: "dog-water-bowl", verb: "tend" });

    case "CHECK_DOOR":
      if (!history.some((event) => event.kind === "PORCH_ARRIVAL")) throw new Error("enter the porch first");
      if (history.some((event) => event.kind === "DOOR_CHECKED")) return history;
      return append(history, action, "DOOR_CHECKED", { objectId: "screen-door" });

    case "CONTINUE_PREPARATION":
      if (!history.some((event) => event.kind === "PORCH_ARRIVAL")) throw new Error("enter the porch first");
      if (history.some((event) => event.kind === "PREPARATION_CONTINUED")) return history;
      return append(history, action, "PREPARATION_CONTINUED", { objective: "GET_THE_ROOM_READY" });

    case "BELL_1":
      if (!history.some((event) => event.kind === "PORCH_ARRIVAL")) throw new Error("enter the porch before the Bell");
      if (story.bellCount >= 1) throw new Error("Bell 1 already occurred");
      return append(history, action, "BELL_OCCURRENCE", { ordinal: 1, interpretation: null }, "unresolved");

    case "BELL_2":
      if (story.bellCount < 1) throw new Error("Bell 1 must occur first");
      if (story.bellCount >= 2) throw new Error("Bell 2 already occurred");
      return append(history, action, "BELL_OCCURRENCE", { ordinal: 2, interpretation: null }, "unresolved");

    case "NOTICE_OPEN_CORNER":
      if (story.bellCount < 2) throw new Error("open-corner relation is not available before Bell 2");
      if (story.secretNoticed) return history;
      return append(history, action, "OPEN_CORNER_NOTICED", {
        relationHint: "lmv/open-corner",
        retrospectiveBellEvidence: false,
      });

    case "ENTER_RESONANCE":
      if (!story.secretNoticed) throw new Error("resonance is not lawfully reachable yet");
      if (story.resonanceEntered) return history;
      return append(history, action, "RESONANCE_ENTERED", { from: "surface" });

    case "TRACE_PRIOR_RELATION":
      if (!story.resonanceEntered) throw new Error("enter resonance before tracing a relation");
      if (story.relationTraced) return history;
      return append(history, action, "RESONANCE_RELATION_TRACED", {
        relationId: FIRST_BELL_RELATION.relationId,
        evidenceRefs: [...FIRST_BELL_RELATION.evidenceRefs],
        promotedClaim: false,
      }, "unresolved");

    case "KNOCK":
      if (story.bellCount < 2) throw new Error("the knock belongs after Bell 2");
      if (story.knockHeard) return history;
      return append(history, action, "KNOCK_OCCURRENCE", { repeats: 3, interpretation: null }, "unresolved");

    case "CLOSE_PLAY":
      if (!story.knockHeard) throw new Error("cannot close First Bell before the knock");
      if (story.status === "closed") return history;
      return append(history, action, "FIRST_BELL_PLAY_CLOSED", {
        bellSourceStatus: "unresolved",
        secretNoticed: story.secretNoticed,
        relationTraced: story.relationTraced,
      }, "unresolved");

    case "MARK_ABSENCE":
      if (!action.subjectId) throw new Error("MARK_ABSENCE requires subjectId");
      if (history.some((event) =>
        event.kind === "ABSENCE_MARKED" &&
        (event.payload as { subjectId?: string }).subjectId === action.subjectId
      )) return history;
      return append(history, action, "ABSENCE_MARKED", {
        subjectId: action.subjectId,
        presenceManufactured: false,
      }, "unresolved");

    default:
      throw new Error(`unsupported action: ${String(action.type)}`);
  }
}
