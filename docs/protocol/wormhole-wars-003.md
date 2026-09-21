# WORMHOLE WARS-003 — The Card Table Enters Static Field

Status: isolated local-browser experiment, stacked on WORMHOLE WARS-002 and -001, and the FIRST BELL branch. It does not independently authorize any canonical cross-world gate, external system effect, authenticated multiplayer identity, physical-card ownership, or real-world occurrence.

## What now exists

Visit /wormhole.html on the loopback Static Field server. The responsive card table displays the NORTH and SOUTH declared local roles, three tactical lanes, Charge, available cards, a Second Chair offer/response, concrete adapter choices, an outcome timeline, and the receiving-side game. All state-changing controls send bounded commands to the server. There is no client-created success receipt. The browser reload button reconstructs the view from the destination-owned persistent event log.

The existing world log now stores five explicitly fictional event kinds: WORMHOLE_MATCH_STARTED, WORMHOLE_CARD_ACTION, WORMHOLE_RECEIVING_STARTED, WORMHOLE_RECEIVING_ACTION, and WORMHOLE_LOCAL_CROSSING_RECORDED. Their payloads are re-evaluated against their owning local game reducers before being appended. Subsequent projections replay all the relevant events rather than trusting recorded success strings. The FIRST BELL surface, resonance, attendance, charge, and unresolved Gate rules are unchanged; the world projection adds a separately named wormhole surface.

On completion of a card match, the browser submits the entire *derived* source bridge artifact and an explicit receiving-owner choice. The destination replays the full source game and re-derives the submitted artifact. An incomplete or altered source is not admitted, even if the browser requests ADMIT. HOLD and REFUSE remain valid independent local outcomes. The second game then requires INSPECT -> ATTUNE RELAY -> CROSS in the imported lane.

Only after the receiving-side game has completed may the player explicitly press RECORD LOCAL CROSSING. This action creates one idempotently guarded world-log record referencing the local result and its source artifact. Repeating it cannot manufacture a second crossing. It does NOT open the separate FIRST BELL Gate or grant authority to Workbench, CONSTITUTE, Full Measure, MEMENTO, or any external service.

## Run on the branch

    git switch experiment/wormhole-wars-003-table-world
    npm install --ignore-scripts
    npm test
    npm run typecheck
    npm run build
    npm start

Open http://127.0.0.1:4173/wormhole.html on the same computer. The original Porch page links to the new table. Choose NEW LOCAL MATCH to create a game; select a lane and tap cards, then follow the on-screen composition controls. In a clean successful path: North SIGNAL, South RECEIVER, North SECOND CHAIR, South ACCEPT, North MISSING CORNER, South FIT relay, North TEST, South DEPLOY. The second game can then be explicitly admitted, inspected, attuned, crossed, and separately recorded in the world.

The server uses the existing var/static-field/history.jsonl path unless configured otherwise. Restarting the process preserves the match, receiving choice, and published result. NEW LOCAL MATCH starts a fresh active game but does not delete the earlier world events or prior recorded crossings. This is currently one locally shared table with two **declared** roles, not authenticated online multiplayer. Do not expose this loopback-only server directly to the public internet.

## Separation and limitations

- The MEMENTO source binder remains private and never appears in this module's source, browser assets, API payloads, or game receipts. All shipped card text and mechanics are original.
- Each action is a specific finite typed transition. No arbitrary game-supplied JavaScript, shell command, filesystem operation, or general external adapter is executed.
- All new world events carry derived/unresolved evidentiary status. Browser-chosen north/south roles and local owner admission are game declarations, not authenticated human identities or proof of real-world consent.
- Source/destination replay proves consistency under a trusted local reducer; it does not prevent a privileged operator from fabricating a fully self-consistent local history. Hashes are not signatures.
- WORMHOLE_LOCAL_CROSSING_RECORDED is a separate fictional world event; it never modifies the first Bell's source status or authorizes its detected Gate.
- This slice provides graphical click-to-play interaction and replayed persistence, not a fully balanced real-time competitive battler. The adapter vocabulary remains intentionally small.
- The shared event log serialization is process-local. Running multiple processes against one log file or exposing multiple clients without authentication remains unsupported.
- The earlier WORMHOLE WARS-002 independent command-line receiving game remains available; the new browser loop uses the same verified game reducer through an added world-owned ledger adapter.

## Verification

    npm test
    npm run typecheck
    npm run build
    npm run demo:wormhole
    npm run demo:wormhole-receiving

The new tests check a full browser-API game, rejected illegal moves and undeclared commands, separate local admission, held/invalid imports, destination-side play, replay after restart, single-publication semantics during concurrent requests, distinct First Bell state, and source/destination receipt tampering. A manual graphical playtest is a separate acceptance gate.
