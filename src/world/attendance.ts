import type { WorldEvent } from "../kernel/types.js";

export interface AttendanceState {
  readonly presentParticipantIds: readonly string[];
  readonly absentParticipantIds: readonly string[];
}

export function deriveAttendance(history: readonly WorldEvent[]): AttendanceState {
  const present = new Set<string>();
  const absent = new Set<string>();
  for (const event of history) {
    if (event.kind === "PORCH_ARRIVAL") present.add(event.actor.id);
    if (event.kind === "ABSENCE_MARKED") {
      const payload = event.payload as { subjectId?: string };
      if (payload.subjectId) absent.add(payload.subjectId);
    }
  }
  return {
    presentParticipantIds: [...present].sort(),
    absentParticipantIds: [...absent].sort(),
  };
}
