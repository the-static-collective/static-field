import type { ParticipantRef, WorldEvent } from "../kernel/types.js";
import { deriveCharge } from "./charge.js";

export interface PartyState {
  readonly partyId: "party/first-bell";
  readonly members: readonly ParticipantRef[];
  readonly pointCharacter: string | null;
  readonly anchor: string | null;
  readonly currentWorld: "static-field/worldseed-001";
  readonly currentCharge: number;
}

export function deriveParty(history: readonly WorldEvent[]): PartyState {
  const byKey = new Map<string, ParticipantRef>();
  for (const event of history) byKey.set(`${event.actor.kind}:${event.actor.id}`, event.actor);
  const members = [...byKey.values()].sort((a,b)=>a.id.localeCompare(b.id));
  const human = members.find((member) => member.kind === "human");
  const arrival = history.find((event) => event.kind === "PORCH_ARRIVAL");
  return {
    partyId: "party/first-bell",
    members,
    pointCharacter: human?.id ?? members[0]?.id ?? null,
    anchor: arrival?.eventId ?? null,
    currentWorld: "static-field/worldseed-001",
    currentCharge: deriveCharge(history).current,
  };
}
