import type { WorldEvent } from "../kernel/types.js";

export type StoryStatus = "not-started" | "preparing" | "investigating" | "closed";

export interface FirstBellStoryState {
  readonly status: StoryStatus;
  readonly objective: "GET_THE_ROOM_READY" | "FIND_OUT_WHETHER_THIS_HAS_HAPPENED_BEFORE" | "PLAY_CLOSED";
  readonly bellCount: number;
  readonly secretNoticed: boolean;
  readonly resonanceEntered: boolean;
  readonly relationTraced: boolean;
  readonly knockHeard: boolean;
}

export function deriveFirstBellStory(history: readonly WorldEvent[]): FirstBellStoryState {
  const entered = history.some((event) => event.kind === "PORCH_ARRIVAL");
  const bellCount = history.filter((event) => event.kind === "BELL_OCCURRENCE").length;
  const secretNoticed = history.some((event) => event.kind === "OPEN_CORNER_NOTICED");
  const resonanceEntered = history.some((event) => event.kind === "RESONANCE_ENTERED");
  const relationTraced = history.some((event) => event.kind === "RESONANCE_RELATION_TRACED");
  const knockHeard = history.some((event) => event.kind === "KNOCK_OCCURRENCE");
  const closed = history.some((event) => event.kind === "FIRST_BELL_PLAY_CLOSED");

  let status: StoryStatus = "not-started";
  if (entered) status = "preparing";
  if (secretNoticed || resonanceEntered || relationTraced) status = "investigating";
  if (closed) status = "closed";

  const objective = closed
    ? "PLAY_CLOSED"
    : secretNoticed
      ? "FIND_OUT_WHETHER_THIS_HAS_HAPPENED_BEFORE"
      : "GET_THE_ROOM_READY";

  return { status, objective, bellCount, secretNoticed, resonanceEntered, relationTraced, knockHeard };
}
