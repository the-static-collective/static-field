import type { JsonValue } from "./canonical.js";

export type EvidenceClass = "observed" | "reported" | "derived" | "unresolved";
export type SourceStatus = "resolved" | "unresolved" | "contested";
export type MapKind = "surface" | "resonance";

export type ParticipantRef =
  | { readonly kind: "human"; readonly id: string }
  | { readonly kind: "model"; readonly id: string };

export interface WorldEvent {
  readonly eventId: string;
  readonly kind: string;
  readonly occurredAt: string;
  readonly actor: ParticipantRef;
  readonly evidenceClass: EvidenceClass;
  readonly sourceStatus: SourceStatus;
  readonly payload: JsonValue;
  readonly parentEventIds: readonly string[];
}

export interface EventDraft {
  readonly kind: string;
  readonly occurredAt: string;
  readonly actor: ParticipantRef;
  readonly evidenceClass: EvidenceClass;
  readonly sourceStatus: SourceStatus;
  readonly payload: JsonValue;
  readonly parentEventIds: readonly string[];
}
