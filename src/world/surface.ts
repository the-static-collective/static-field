import type { WorldEvent } from "../kernel/types.js";

export interface PorchSurfaceState {
  readonly regionId: "the-porch";
  readonly entered: boolean;
  readonly preparedObjectIds: readonly string[];
  readonly doorChecked: boolean;
  readonly bellOccurrences: readonly {
    eventId: string;
    sourceStatus: "unresolved" | "resolved" | "contested";
  }[];
  readonly knockEventId: string | null;
}

export function deriveSurface(history: readonly WorldEvent[]): PorchSurfaceState {
  const prepared = new Set<string>();
  const bells: PorchSurfaceState["bellOccurrences"][number][] = [];
  let entered = false;
  let doorChecked = false;
  let knockEventId: string | null = null;

  for (const event of history) {
    if (event.kind === "PORCH_ARRIVAL") entered = true;
    if (event.kind === "OBJECT_PREPARED") {
      const payload = event.payload as { objectId?: string };
      if (payload.objectId) prepared.add(payload.objectId);
    }
    if (event.kind === "DOOR_CHECKED") doorChecked = true;
    if (event.kind === "BELL_OCCURRENCE") {
      bells.push({ eventId: event.eventId, sourceStatus: event.sourceStatus });
    }
    if (event.kind === "KNOCK_OCCURRENCE") knockEventId = event.eventId;
  }

  return {
    regionId: "the-porch",
    entered,
    preparedObjectIds: [...prepared].sort(),
    doorChecked,
    bellOccurrences: bells,
    knockEventId,
  };
}
