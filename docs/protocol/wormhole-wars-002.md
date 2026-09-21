# WORMHOLE WARS-002 — The Receiving World

**Status:** isolated, explicitly admitted local-game experiment stacked on WORMHOLE WARS-001 and FIRST BELL. No changes to First Bell's Surface, Resonance, world-event log, browser API, or admission authority.

## The crossing that actually runs

A completed tactical card-table match in WORMHOLE WARS-001 produces a bridge artifact. A second, destination-owned game in Static Field receives both the complete source match and the claimed artifact. It independently replays the source game and derives the expected artifact. It compares the entire artifact, not only a name, port, source ID, or claimed success field.

The receiving world then makes an explicit local disposition: admit, hold, or refuse. An invalid or incomplete source is refused even if the requested disposition was admit. Hold/refuse never unlock playable moves. A valid admitted source enables a distinct, three-turn receiving-side encounter:

1. North INSPECTS the exact lane of the imported bridge.
2. South ATTUNES the relay; guessing a direct link does not compose the bridge.
3. North CROSSES that lane and produces a receiving-side result with ancestry pointing to the source artifact, receiving-world admission, and its own completion receipt.

Wrong lane, wrong player, premature crossing, or incorrect adapter are receipted refusals without changing whose turn it is. The new crossing was previously unavailable inside this receiving encounter and becomes playable only after replay, independent local admission, and its own moves.

This is an executable adapter specimen between two distinct modules within Static Field. It is **not** an actual transfer into the canonical FIRST BELL history, an authorized external world crossing, or an already-implemented Workbench / CONSTITUTE adapter.

## Reproduce from a real saved source

Node 22+ in a checkout of the experiment/wormhole-wars-002-receiving-world branch:

    npm install --ignore-scripts
    npm test
    npm run typecheck
    npm run build
    npm run demo:wormhole-receiving

The demo executes a complete source card match, emits its bridge artifact, constructs a receiving world with an explicit local admission, and plays the full receiving encounter. It writes nothing to the FIRST BELL event log.

For the manual CLI, first play and save a completed WORMHOLE WARS-001 match using the exact eight actions in docs/protocol/wormhole-wars-001.md. Assume the source save is /tmp/wormhole-match.json and it was built in lane porch.

Export the claimed source artifact to a separate local file:

    node build/src/cli/wormhole-wars.js artifact /tmp/wormhole-match.json > /tmp/wormhole-artifact.json

Act as the local receiving owner and explicitly decide whether this proposed fictional import may start a new local encounter:

    node build/src/cli/wormhole-receiving.js receive /tmp/wormhole-match.json /tmp/wormhole-artifact.json /tmp/receiving.json admit receiving-porch

The alternative choices hold and refuse create their own local admission receipts and leave the receiving game non-playable; these are legitimate outcomes. An incorrect or forged artifact is refused regardless of the requested choice.

Inspect the new world and play three actual receiving-game moves:

    node build/src/cli/wormhole-receiving.js show /tmp/receiving.json
    node build/src/cli/wormhole-receiving.js move /tmp/receiving.json '{"kind":"inspect","actor":"north","lane":"porch"}'
    node build/src/cli/wormhole-receiving.js move /tmp/receiving.json '{"kind":"attune","actor":"south","adapter":"relay"}'
    node build/src/cli/wormhole-receiving.js move /tmp/receiving.json '{"kind":"cross","actor":"north","lane":"porch"}'
    node build/src/cli/wormhole-receiving.js result /tmp/receiving.json
    node build/src/cli/wormhole-receiving.js verify /tmp/receiving.json

Choose the actual source artifact's lane when inspecting and crossing. The receiving CLI supports only the three declared game actions; it cannot execute shell commands or arbitrary adapters supplied by cards.

## Evidence and authority boundaries

- The receiving module stores frozen source-match and claimed-artifact snapshots inside the independent receiving game. On every local action, replay rechecks the source transitions, match/artifact equality, destination choice, admission receipt, and all prior receiving transitions.
- The destination's admit argument is an explicit local declaration only, not proof of an authenticated owner. There is no networked identity, independently witnessed real-world occurrence, or automatic acceptance by the canonical First Bell kernel.
- Hashes establish deterministic consistency under the trusted local reducer; a privileged actor could construct and hash a wholly invented but self-consistent local fictional history. Admission here proves only that the source fixture's declared rules were satisfied locally.
- Source and destination each retain their own receipt chain. Matching ports do not give source code or external artifacts permission to modify world state.
- The result has authorization none and evidence local-fictional-game. It cannot be used as authentic physical-card custody, earned financial ownership, proof of human consent outside the game, or permission for effects in Full Measure, Workbench, MEMENTO, DerekDerrikDark, or FIRST BELL.
- No third-party character material or private MEMENTO binder text is shipped.
- No participation is compulsory; stop the CLI whenever desired. The receiving-side crossing is an optional fictional objective, not an ordinary exit control.

## Next independent gate

A canonical First Bell integration requires a separate explicit world-policy decision, authenticated participants where needed, and a project-owned event type plus world projection that can represent admitted crossings without inventing First Bell history. A browser UI and cross-process save concurrency are likewise unimplemented. This experiment does not silently claim those responsibilities.
