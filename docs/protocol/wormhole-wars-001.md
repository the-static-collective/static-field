# WORMHOLE WARS-001 — The Folding Table

**Status:** isolated game-local executable experiment stacked on STATIC-FIELD-FIRST-BELL-001, not an admitted addition to the canonical Porch history.

The first battlefield is a three-lane folding table (porch, hall, road). Two declared local participant roles, north and south, alternate turns. Both begin with four Charge, four original cards, and no shared identity/witness authority. The first scenario is cooperative: establish two different parties' concrete ports in the same lane, voluntarily accept a Second Chair invitation, inspect a real composition gap, select a compatible relay, test it, and deploy the resulting bridge artifact to stabilize the lane.

The game has **no franchise character art, dialogue, quotes, lore, official cards, brand affiliation, external IP assets or proprietary copied card data**. Its private conceptual research source stays in MEMENTO; no private binder content is imported, shipped, fetched at runtime, or exposed through game APIs.

## Rules

Each successfully admitted move consumes a turn, alternating north and south. A refused attempt is still locally receipted but consumes neither Charge nor turn. Charge begins at 4 for each player; REST uses a turn and adds two Charge up to a cap of 5. Each participant has one copy of each authored game card.

| Card | Charge | Game-local effect |
| --- | ---: | --- |
| SIGNAL | 1 | Put a source of concrete port tone:bell into an unoccupied source slot in one lane. |
| RECEIVER | 1 | Put a receiver of concrete port tone:knock into an unoccupied target slot in one lane. |
| SECOND CHAIR | 1 | Offer a connection to the other participant in a lane containing the acting player's piece. The other participant explicitly accepts or declines on their own turn. |
| MISSING CORNER | 2 | With an accepted chair and source/receiver owned by different participants in the selected lane, open a concrete-gap construction puzzle. |

Within an opened puzzle, FIT consumes one Charge and one turn. Select one of three fixed adapters: direct, relay, reverse. TEST uses a turn if the exact connection is valid. This fixture's source is tone:bell, its receiver is tone:knock, and **only relay** transforms the source into the target. A wrong TEST records an unresolved obstruction and does not consume the actor's turn. The same player may REST and choose another FIT, with turn order still enforced. After an admitted TEST, DEPLOY costs one Charge and one turn, stabilizes that lane and completes the match.

Both players must hold relevant pieces and one must voluntarily accept the offer. Merely knowing the word relay or holding one player's entire deck does not create the bridge. There is no attack, death, permanent failure, randomized loot, marketplace, cash transaction, or moral score. This first module models tactical placement, Charge choice, cooperation, and an executable composition puzzle rather than a full real-time battler.

## Play

Requirements: Node.js >=22, npm, in a checkout of this **experimental branch**:

    npm install
    npm run build
    npm run demo:wormhole

The demo executes an entire deterministic eight-move local match without persisting any changes or touching the FIRST BELL world event log.

For an interactive CLI match:

    node build/src/cli/wormhole-wars.js init /tmp/wormhole-match.json porch-demo
    node build/src/cli/wormhole-wars.js show /tmp/wormhole-match.json

Then supply one strict JSON action per turn:

    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"play","actor":"north","card":"signal","lane":"porch"}'
    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"play","actor":"south","card":"receiver","lane":"porch"}'
    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"play","actor":"north","card":"second-chair","lane":"porch"}'
    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"respond","actor":"south","accept":true}'
    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"play","actor":"north","card":"missing-corner","lane":"porch"}'
    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"fit","actor":"south","adapter":"relay"}'
    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"test","actor":"north"}'
    node build/src/cli/wormhole-wars.js move /tmp/wormhole-match.json '{"kind":"deploy","actor":"south","lane":"porch"}'
    node build/src/cli/wormhole-wars.js artifact /tmp/wormhole-match.json

Choose any of porch, hall, road consistently. Explore a declined chair, a wrong adapter, or a different turn order. A refused attempt is preserved; the relevant puzzle cannot be bypassed by inventing a receipt. For a different state, initialize a new local match file.

## The artifact / candidate wormhole

Only a completed, replay-verified game produces an artifact containing exact references to the source piece, target piece, voluntary offer, puzzle opening, chosen adapter, admitted bridge test, and final deployment receipt. The exported artifact has schema static-field.wormhole-wars.artifact/v0.1, evidence local-fictional-game, and authorization none. It is **not** a witnessed human deed, authenticated player identity, earned financial asset, actual physical card, or accepted inter-world crossing.

The module uses Static Field's existing canonical content digest, but it runs its **own isolated match history**, not the existing FIRST BELL event log or its Surface/Resonance projections. Local JSON digests and replay catch inconsistent edits and false admitted decisions under the trusted reducer. They do not independently authenticate a person or prevent a privileged actor from generating a completely new, self-consistent fictional history.

Future integration gate: a destination-owned adapter must independently verify whatever source it admits, declare its permitted local mechanic, and preserve the artifact's origin and unresolved limitations. Do not import this toy match as authoritative world history simply because its port labels match. Workbench Book of Machines, Full Measure, MEMENTO, DerekDerrikDark and any private binder remain separate owners.

## Checks and unbuilt directions

    npm test
    npm run typecheck
    npm run build
    npm run demo:wormhole

Next review should inspect game balance, cross-process local-file concurrency, real participant authorization before networking, play-testing with two people, a browser card table, and a first narrow destination-local artifact adapter. No live multiplayer, PvP balancing, browser UI, automatic external execution, or public source-binder publication is claimed by this slice.
