# LISTENING ROOM 0.1 — THE LISTENING ECHO
## Implementation-ready vertical-slice brief

**Project:** STATIC PLAY SEEDPLATE / STATIC FIELD experimental lab  
**Parent design:** [ROOM-002 — The Room You Can Enter](./ROOM-002.md)  
**Current reference code:** [seedplate.mjs](./seedplate.mjs), [app.mjs](./app.mjs), [index.html](./index.html), [seedplate.test.mjs](./seedplate.test.mjs)  
**Status:** authorized **design handoff**; greybox runtime, 3D models, render QA, budgeted assets, and public deployment have **not** been completed or approved by this document.  
**Scope:** one optional, solo, browser-local, 3–7 minute listening room composed from **Toaster × GrooveRooms**, with no project-native Toaster or GrooveRooms runtime invocation.

### 1. Player fantasy and complete first-session flow

The player steps into a beautiful, lived-in living room. A slightly strange picture machine on the side table shows *possible* scenes. A deep upholstered chair is a place to listen. When the player has spent a moment listening and chosen one exact scene to keep, the chair lets that scene leave a listening echo behind. The room remembers the two distinct acts and their relationship.

This must feel like a small story/game, not a 3D asset showroom. One screen of inviting room art first; no setup form. A compact, human-language choice panel only when an object is selected. The journal is an optional drawer, not a persistent technical dashboard.

**Happy path, matching the existing replay contract:**

1. **Enter**: compose exactly `["toaster","groove"]` in the flat Seedplate lab; opt into **Visit listening room**. Do not reset the run or silently create a new one. If the player enters mid-run, derive the room from that exact saved run.
2. **Listen**: inspect the listening chair, preview **Listen to the room**, commit `{type:"act",actionId:"groove:listen"}`. One of four available beats is spent; a local listening memory appears. Return to the room via `{type:"continue"}`.
3. **See possibilities**: inspect picture machine; commit `{type:"act",actionId:"toaster:propose"}`. The stage becomes `candidates`, displaying exactly three deterministic proposed scenes, with one focused at a time. Looking costs no beat; focusing never writes an event.
4. **Choose**: optionally `{type:"scrape"}` up to twice, or `{type:"pass"}` to set proposals aside. For this happy path, explicitly select one candidate from the current `getCandidates(view.round)` family and commit `{type:"keep",candidateId}`. KEEP spends one beat and creates exactly one admitted fictional memory. Complete the consequence stage with `continue`.
5. **Return to the listening chair**: after both `groove:listen` and `toaster:keep` exist, `replayRun(run).choices` supplies `groove:echo`. Preview, then commit `{type:"act",actionId:"groove:echo"}`; the new listening-echo memory points via `parentId` to the **exact kept Toaster event**, not the previously focused preview, the latest unrelated act, or an imagined remote listener. One beat is spent.
6. **See the consequence and memory**: an optional subtle room-light/art change follows the committed echo. **The room remembers** drawer displays the listening act, the kept scene, and the echo with its source parent. The same exported run opens in flat mode with identical event IDs, parentage, beats, and stage.

**Equally valid alternate path:** KEEP before listening, then listen, then return and make the echo. If the player sets candidates aside, the scene remains unkept and the echo remains unavailable. The player may leave at any point without forfeiting the run. The existing four-beat attendance remains the game's ending; leaving the spatial view is *not* ending the day.

### 2. Visual / experience seed

Use the previously approved *mood* of the cozy living-room concept image as inspiration, **not** a measured floor plan or an existing licensed production asset: afternoon sunlight, layered ivory/terracotta/sage textiles, wood, a slightly open-feeling porch threshold, bookshelf, central table, low glowing picture machine, generous listening chair, tiny lived-in particulars. The reference's puppy, extra card mechanics, and richly populated porch are **ambient future possibilities**, not promises that those features are playable in this two-donor slice.

Visual priority: picture machine aperture first when inspecting/previewing, listening chair first when listening, the particular admitted image + a subtle echo treatment after KEEP and echo. Everything else frames these two interactive anchors without becoming a false button. Camera and foreground UI must remain legible at a phone viewport, including 390 px width and 44 px minimum main targets. Respect reduced motion, contrast, keyboard focus, and static fallback.

**Avoid:** neon control consoles; four competing glowing hotspots; permanent HUD lore; giant floating text; visually open doors that imply traversal when no destination exists; an unskippable cinematic; scoring a player's taste; copying another game's trade dress.

### 3. Function-stage provisional room brief

The following measurements are **proposed greybox implementation assumptions only**. They must not be treated as approved Form/Runtime geometry, a certified navigation route, or a Meshy prop specification.

| Item | Greybox assumption | Game purpose |
| --- | --- | --- |
| Interior | Rectangular approximately 6 m wide × 4.5 m deep × 2.8 m high; metre units; solid floor/wall/ceiling proxy | A coherent small stage with room to frame two distinct objects |
| Production camera | Single fixed three-quarter camera, slightly above seated eye line; design for a phone-safe central silhouette | Spatial clarity with no joystick, camera mode, or navigation demand |
| Picture machine | On right-side table, identifiable front/screen, clear unobstructed framing | Toaster proposal/focus/KEEP/SCRAPE hotspot |
| Listening chair | At left-center, visibly faceable toward the room / picture machine | GrooveRooms listen/echo/local-note hotspot |
| Memory drawer | **Accessible DOM control**, not a physical prop that must be clicked | Replayed local memory and parentage |
| Porch threshold | Closed screen door or a clearly non-interactive scenic treatment for greybox | Atmosphere only; no claimed traversable route |
| Optional details | Books, cup, letter, rug, small plant using low-cost procedural proxies | Readable lived-in identity; no false affordances |

**Function gate still required for final 3D composition:** declare exact bounds, real camera framing, prop attachment/front axes, hero-reserve space, collision/sightline assumptions, a measured monochrome plan and opening schedule, and explicit human layout approval. If a door/window becomes a physical opening, validate real wall depth, reveal, visible destination, and navigation/collision before visually promising a passage. Paid asset generation requires a separately confirmed maximum spend and approved source images. A beautiful render is not Function approval.

### 4. Interactable surface / action map

**Hotspots select; they never mutate replay.** An interaction opens the existing DOM preview/commit controls. All gameplay mutations call the exact existing `appendRunEvent(run,event)`, then persist via the existing `exportRun(run)` and existing local-storage key. Refresh and mode-switch recover through `importRun` + `replayRun`.

| Focus | Available when | DOM preview / confirm | Committed event or effect |
| --- | --- | --- | --- |
| Picture machine | Current run includes `toaster` and stage is `room`, with `toaster:propose` in `view.choices` | “Look through the picture machine”; describe proposals versus kept history | `act/toaster:propose`; no beat spent yet |
| Picture candidates | `view.stage==="candidates"` | Three candidate cards; focus, SCRAPE (max two), KEEP exact selected candidate, or set aside | `scrape`, `keep(candidateId)`, or `pass`; focus is view-only |
| Listening chair | Stage is `room`; `groove:listen`, `groove:note`, or `groove:echo` actually appears in `view.choices` | One context-specific action; show its beat cost and honest local scope | `act/groove:listen`, `act/groove:note` (with bounded player text), or `act/groove:echo` |
| Consequence | `view.stage==="receipt"` | One short scene response and “Return to the room” | `continue` |
| Journal | Any stage | Read-only memories, sources, exact echo parent; candidate previews labeled *not kept* when applicable | No gameplay event |
| Leave spatial view | Any stage | “Back to cards” or “Use simple view” | No gameplay event; same run, same save |
| Attendance | `view.stage==="ending"` | Room's retained moments and unfulfilled possibilities, optional compose-another-room | No auto-reset; new run requires explicit confirmation |

**Critical kernel detail:** in the currently implemented seedplate, `groove:echo` is presented only after a `groove:listen` occurrence **and** a `toaster:keep` occurrence; the echo's parent points to the most recent kept Toaster event. The first 3D adapter must read this behavior from `view.choices`, not rebuild its own unlock boolean or infer it from whether the projected picture is visible. The current run begins with four beats; the happy path spends three (listen, KEEP, echo). No remote listener, genuine song render, or outside-world performance is claimed.

### 5. UI stage contract and accessibility

- **Room mode:** canvas fills the optional spatial stage; at most two active object hotspots in this donor pair. A permanently reachable, compact DOM pair of “Picture machine” and “Listening chair” buttons mirrors the hotspots. Hover/focus may reveal small labels. The same preview card appears whether selected by touch, pointer, keyboard, screen reader, or fallback DOM.
- **Candidate mode:** camera may ease toward the machine, but proposal text and cards are DOM. Label “Possibility — not kept.” Candidate focus and turning the camera are **not** a KEEP. SCRAPE remains user-invoked and does not teach a global negative preference. “Set them aside” remains available.
- **Consequence mode:** show exactly one receipt beat without blocking/auto-committing the next act. A small image/light change after KEEP/echo is *visual feedback only* and must be computed from `replayRun`, including on page refresh.
- **Memory mode:** expandable drawer lists the exact retained memory order, links to seed sources in existing recipe, and labels the echo's selected parent in plain language (“From your kept scene: …”). No claimed remote participant.
- **Failure mode:** if WebGL is unavailable, performance poor, motion reduced, or scene assets not ready, show original seedplate 2D view and retain usable DOM actions. The user can switch back manually anytime. Do not force a download or sign-in.
- **Input/status:** minimum 44 px pressable targets; visible keyboard focus; no touch-only/hover-only actions; avoid autoplay audio, unexpected scroll locking, full-screen takeover, and persistent numerical dashboard.

### 6. Implementation seams and files

Keep current public browser lab at `experiments/play-seedplate-001/`. Add spatial rendering additively; do not migrate all work to Unity/React for the first slice.

**Suggested small file plan (not yet implemented):**

- `listening-room.mjs`: optional renderer adapter; initializes/disposes Three.js scene, camera, two object hit regions, resize and context-loss handling. It receives a read-only projection from `replayRun` and calls an **inspect-only** callback such as `onInspect("picture-machine"|"listening-chair")`. It never imports, writes, or independently serializes the run.
- `room-projection.mjs`: pure mapping `replayRun(run) -> room visual state`, including stage, objects available, proposal-only screen, current kept scene ID/title and echo-parent ID. No independent simulation or one-off timers affecting outcomes.
- `app.mjs`: add an explicit “Visit listening room” toggle when the active composition includes `toaster` and `groove`; wire hotspot inspection into the existing `showRoom` / `showCandidates` / `showReceipt` actions or extract shared DOM action renderer. Keep `commit()` as the only mutation path; keep `STORE` and save schema unchanged for this additive display feature.
- `index.html` / `seedplate.css`: add a no-JS-fail, optional canvas container, readable hotspot list, “Back to simple view”, loading/fallback status, and fluid viewport layout.
- `room-asset-manifest.json`: for first pass, stable keys identifying **procedural proxies only**. Do not vendor or download Meshy/Tripo/Thrixel props yet. Later accepted GLB assets need separate provenance/license/hash and explicit placement gates.
- `listening-room.test.mjs` (or appropriate browser QA files): pure projection and entry/exit parity cases below. For browser screenshot/mobile QA, test the real loaded canvas plus DOM, not just Node unit tests.

**Suggested adapter shape (illustrative interface, not code already shipped):**

```text
run (existing seedplate state)
  └── replayRun(run) → view (read-only)
        ├── existing flat DOM player
        └── room-projection → optional spatial renderer
                              └── inspect(hotspotId) → shared DOM selection
                                                           └── user confirms
                                                                └── existing commit(event)
```

**Dependency decision before implementation:** the current lab runs as dependency-free vanilla ESM and is hosted from a simple HTTP server. Importing Three.js needs a deliberate, reproducible package/vendor route with locked version and license manifest. Do **not** assume `three` bare imports work with the current no-bundler setup, and do not rely on an unstable unpinned CDN as production packaging.

### 7. Test fixtures / acceptance gates

**Fixture A — exact two-donor happy path:** create `composeSeedplate(["toaster","groove"],{visualLead:"groove"})`; enter/leave spatial mode without events; listen → continue → propose → focus → KEEP one exact offered candidate → continue → echo. Compare exported run after 2D-only versus mixed-mode execution; equality of event sequence, IDs, beats, stage, `toaster:keep` source, `groove:echo.parentId` required.

**Fixture B — alternative ordering:** propose/KEEP/continue → listen/continue → echo; same rule and exact parent. No forced ordering gate exists in the current kernel.

**Fixture C — refusal and uncertainty:** propose → focus/SCRAPE/pass, then listen; no echo. Unchosen scene must not appear as remembered occurrence, even when preview art was rendered on a 3D screen.

**Fixture D — importing and switching:** run can be refreshed, reopened in the 2D player, exported/imported, and projected back into room mode without altered event IDs or extra beats.

**Fixture E — accessibility/fallback:** block WebGL or simulate context loss; all gameplay controls remain available as DOM. Verify keyboard-only, screen-reader labeling, reduced-motion, responsive phone width and min 44px hit targets.

**Fixture F — visual performance (measurement required):** real runtime camera, actual mobile viewport with touch-only interaction, legible central picture-machine/chair silhouettes, and a measured load/frame profile. The desired 30 fps and responsive initial load are **targets**, not asserted achieved measurements.

**Done for 0.1:** one enterable room, two usable spatial hotspots, exact KEEP→listen→echo parentage, simple-view parity, locally durable run, human-playable phone-sized UX, and measured QA evidence. **Not done:** multiplayer, shared-world admission, a real Toaster render, live GrooveRooms participant, persistent 3D traversal, puppy mechanics, paid generated props, Unity port, final Form/Runtime room approval, or deployment.

### 8. Ordered execution and review gates

1. **Implement zero-spend 002A greybox** against the existing replay contract, with both interaction paths, pure projection, and fallback tests; preserve source branch's other gameplay.
2. **Human playtest the actual room**: can the player identify the picture machine, listening chair, KEEP status, and echo without a tutorial? Record actual confusing moments instead of redefining the game by aesthetic preference.
3. **Approve Function layout** with room plan, camera, prop family and opening schedule. Greybox coordinates alone do not approve or certify the final room.
4. **Consider one source-approved hero prop** via one selected asset provider only after documented price/credit ceiling and explicit approval. No duplicate parallel paid Meshy/Tripo/Thrixel attempts for the same prop.
5. **Integrate and inspect real shipped asset** (units, attachment, provenance, silhouette, frame-time, real runtime camera) through available game-asset tooling and a repeatable browser playtest. Obtain separate Form/Runtime approval before any public release.
6. **Optional HyperFrames crossing**: short, skippable scene-reveal presentation bound to accepted visual identity and a static equivalent; zero gameplay event on video completion.

### 9. Handoff receipt

- **Documented from current source:** `seedplate.mjs` already supports `toaster:propose`, `scrape` (max 2), `pass`, exact `keep(candidateId)`, `groove:listen`, `groove:echo`, replay, finite beats, event IDs, echo parentage, and exported local run. `app.mjs` already owns DOM selection, commit, the current local-storage key, and the optional memory drawer.
- **Proposed here, not implemented yet:** render adapter, physical room, two spatial hotspots, room projection, fixed camera and props, 2D/3D switching, actual browser QA.
- **Approval scope:** this build brief authorizes **no provider credits, project deployment, final asset acceptance, or promotion of the new room to STATIC FIELD canon**. It makes 002A sufficiently concrete to implement independently and then seek human layout/asset review.
