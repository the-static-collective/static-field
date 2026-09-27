import type { WorldEvent } from "../kernel/types.js";

export const CAPACITY_VERBS = [
  "RECEIVE", "HOLD", "POUR", "REST", "TEND", "PRAY",
  "PLAY", "WITNESS", "KEEP", "ASK_FOR_HELP",
] as const;

export type CapacityVerb = typeof CAPACITY_VERBS[number];

export interface ChargeState {
  readonly current: number;
  readonly max: number;
}

const DELTA: Record<CapacityVerb, number> = {
  RECEIVE: 0,
  HOLD: 0,
  POUR: -2,
  REST: 2,
  TEND: 1,
  PRAY: 1,
  PLAY: -2,
  WITNESS: 0,
  KEEP: 0,
  ASK_FOR_HELP: 0,
};

export function deriveCharge(history: readonly WorldEvent[]): ChargeState {
  let current = 1;
  const max = 10;
  for (const event of history) {
    if (event.kind !== "CAPACITY_PRACTICE") continue;
    const verb = (event.payload as { verb?: CapacityVerb }).verb;
    if (!verb) continue;
    current = Math.max(0, Math.min(max, current + DELTA[verb]));
  }
  return { current, max };
}

export function availableCapacityVerbs(state: ChargeState): readonly CapacityVerb[] {
  return CAPACITY_VERBS.filter((verb) => verb !== "POUR" || state.current >= 2);
}
