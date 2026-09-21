# STATIC FIELD runtime v0.1

## Event history

History is append-only. Every `WorldEvent` carries deterministic identity, occurrence time supplied by the caller, actor, evidence class, source status, payload, and parent references. Projection code never emits events.

## Surface projection

Surface reconstructs attributable local state: Porch arrival, prepared objects, door state, Bell occurrences, and the ending Knock. Surface occurrence records are never rewritten by Resonance.

## Resonance projection

Resonance is a second projection over the same history. It may expose archived relations and interpretation text, but `evidenceRefs`, `interpretation`, and `sourceStatus` remain distinct. `promotedClaim` is fixed `false` in v0.1.

## Authority boundary

A relation can be found without establishing cause. Repetition can add evidence references without proving meaning. Model reconstruction does not manufacture witness. Neighboring systems remain external authorities and enter only through future adapters.

## Persistence

`FileEventLog` stores one canonical `{eventHash,event}` envelope per JSONL line. Loading rejects malformed JSON, duplicate event IDs, and content/hash mismatch. Restart reconstructs projections from history rather than replaying story actions.
