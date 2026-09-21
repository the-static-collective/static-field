# THE FIRST BELL — 001

## Story-control frame

**Promise:** an ordinary room can become strange without losing track of what actually happened.

**Pressure:** two unexplained Bell occurrences disturb preparation, but the runtime refuses to force an interpretation.

**Change chain:** arrive → prepare → Bell I → continue → Bell II → optionally notice → optionally enter Resonance → optionally trace relation → Knock → close receipt.

**Knowledge rule:** a clue only enters player-visible state when a noticing event exists. The runtime does not backfill observation because a relation exists elsewhere.

**Irreversible change:** after play closes, the Porch history persists, including unresolved Bell and Knock occurrences.

**Exit question:** who or what is at the screen door, and what—if anything—does the prior relation have to do with the Bell?

## Normal relation path

The player notices the LMV/open-corner relation after Bell II, enters Resonance, and traces an archived relation. A `ResonanceRelationReceipt` is emitted with unresolved source status. The historical Bell events remain unchanged.

## Missed-secret path

The player may never notice the clue. They can continue ordinary preparation, hear the Knock, and close a valid play with `secretNoticed: false`. No Resonance relation receipt is fabricated.

## Ending

The Knock is an occurrence with unresolved interpretation. `FirstBellPlayReceipt` closes the bounded play while preserving the Bell source as unresolved. Restart does not reset the Porch.
