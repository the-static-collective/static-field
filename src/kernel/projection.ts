import type { WorldEvent } from "./types.js";
import { projectWormholeWorld } from "../wormhole/world-ledger.js";
import { deriveSurface } from "../world/surface.js";
import { deriveResonance } from "../world/resonance.js";
import { deriveParty } from "../world/party.js";
import { deriveFirstBellStory } from "../first-bell/story.js";
import { deriveAttendance } from "../world/attendance.js";
import { deriveFieldDepth } from "../world/field-depth.js";
import { deriveCharge } from "../world/charge.js";
import { deriveDetectableGates } from "../world/gates.js";

export function projectWorld(history: readonly WorldEvent[]) {
  return {
    surface: deriveSurface(history),
    resonance: deriveResonance(history),
    attendance: deriveAttendance(history),
    fieldDepth: deriveFieldDepth(history),
    charge: deriveCharge(history),
    party: deriveParty(history),
    gates: deriveDetectableGates(history),
    wormhole: projectWormholeWorld(history),
    story: deriveFirstBellStory(history),
  };
}

export type WorldProjection = ReturnType<typeof projectWorld>;
