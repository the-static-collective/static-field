import type { WorldEvent } from "../kernel/types.js";

export interface FieldDepth {
  readonly attributableArrivals: number;
  readonly careActs: number;
  readonly repairs: number;
  readonly performances: number;
  readonly unresolvedAbsences: number;
  readonly unfinishedThreads: number;
}

export function deriveFieldDepth(history: readonly WorldEvent[]): FieldDepth {
  let attributableArrivals = 0;
  let careActs = 0;
  let repairs = 0;
  let performances = 0;
  let unresolvedAbsences = 0;
  let unfinishedThreads = 0;

  for (const event of history) {
    if (event.kind === "PORCH_ARRIVAL") attributableArrivals += 1;
    if (event.kind === "OBJECT_PREPARED") {
      const objectId = (event.payload as { objectId?: string }).objectId;
      if (objectId === "dog-water-bowl") careActs += 1;
    }
    if (event.kind === "REPAIR_RECORDED") repairs += 1;
    if (event.kind === "CAPACITY_PRACTICE") {
      const verb = (event.payload as { verb?: string }).verb;
      if (verb === "TEND") careActs += 1;
      if (verb === "PLAY") performances += 1;
    }
    if (event.kind === "ABSENCE_MARKED") unresolvedAbsences += 1;
    if (event.sourceStatus === "unresolved" &&
        (event.kind === "BELL_OCCURRENCE" || event.kind === "KNOCK_OCCURRENCE")) {
      unfinishedThreads += 1;
    }
  }
  return {
    attributableArrivals,
    careActs,
    repairs,
    performances,
    unresolvedAbsences,
    unfinishedThreads,
  };
}
