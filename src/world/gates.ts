import { stableId } from "../kernel/canonical.js";
import type { WorldEvent } from "../kernel/types.js";

export interface GateDescriptor {
  readonly gateId: string;
  readonly from: string;
  readonly triggerRefs: readonly string[];
  readonly status: "unknown" | "detected" | "open" | "closed";
  readonly authorized: boolean;
  readonly unresolvedConditions: readonly string[];
  readonly to?: string;
}

export function deriveDetectableGates(history: readonly WorldEvent[]): readonly GateDescriptor[] {
  const relation = history.find((event) => event.kind === "RESONANCE_RELATION_TRACED");
  if (!relation) return [];
  const body = {
    from: "static-field/worldseed-001/the-porch",
    triggerRefs: [relation.eventId],
    status: "detected" as const,
    authorized: false,
    unresolvedConditions: ["destination", "opening-authority", "transfer-policy"],
  };
  return [{
    gateId: stableId("gate", body),
    ...body,
  }];
}
