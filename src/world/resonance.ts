import type { WorldEvent } from "../kernel/types.js";

export interface ResonanceRelation {
  readonly relationId: string;
  readonly subjectRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly interpretation: string | null;
  readonly sourceStatus: "resolved" | "unresolved" | "contested";
  readonly promotedClaim: false;
}

export interface ResonanceState {
  readonly available: boolean;
  readonly entered: boolean;
  readonly relations: readonly ResonanceRelation[];
}

export interface RelationArchiveEntry {
  readonly relationId: string;
  readonly subjectRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly interpretation?: string;
  readonly sourceStatus: "resolved" | "unresolved" | "contested";
  readonly promotedClaim: false;
}

const DEFAULT_RELATION: RelationArchiveEntry = {
  relationId: "relation/first-bell-open-corner",
  subjectRefs: ["occurrence/bell"],
  evidenceRefs: ["archive/song/open-e-022100", "archive/card/lmv-open-corner"],
  interpretation: "A prior musical/card relation resembles the present Bell occurrence.",
  sourceStatus: "unresolved",
  promotedClaim: false,
};

export function deriveResonance(
  history: readonly WorldEvent[],
  archive: readonly RelationArchiveEntry[] = [DEFAULT_RELATION],
): ResonanceState {
  const available = history.some((event) => event.kind === "OPEN_CORNER_NOTICED");
  const entered = history.some((event) => event.kind === "RESONANCE_ENTERED");
  const tracedIds = new Set(
    history
      .filter((event) => event.kind === "RESONANCE_RELATION_TRACED")
      .map((event) => (event.payload as { relationId?: string }).relationId)
      .filter((id): id is string => Boolean(id)),
  );
  const relations = archive
    .filter((item) => tracedIds.has(item.relationId))
    .map((item) => ({
      relationId: item.relationId,
      subjectRefs: [...item.subjectRefs],
      evidenceRefs: [...item.evidenceRefs],
      interpretation: item.interpretation ?? null,
      sourceStatus: item.sourceStatus,
      promotedClaim: false as const,
    }));
  return { available, entered, relations };
}

export function traceRelation(
  relationId: string,
  archive: readonly RelationArchiveEntry[] = [DEFAULT_RELATION],
): ResonanceRelation {
  const relation = archive.find((item) => item.relationId === relationId);
  if (!relation) throw new Error(`unknown relation: ${relationId}`);
  return {
    relationId: relation.relationId,
    subjectRefs: [...relation.subjectRefs],
    evidenceRefs: [...relation.evidenceRefs],
    interpretation: relation.interpretation ?? null,
    sourceStatus: relation.sourceStatus,
    promotedClaim: false,
  };
}

export const FIRST_BELL_RELATION = DEFAULT_RELATION;
