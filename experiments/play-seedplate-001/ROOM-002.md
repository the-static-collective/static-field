# PLAY-SEEDPLATE-002 — THE ROOM YOU CAN ENTER

**Status:** proposed bounded vertical slice, not an implementation receipt or approved 3D layout.
**Parent:** [PLAY-SEEDPLATE-001 experimental composer](./README.md) / [draft PR #7](https://github.com/the-static-collective/static-field/pull/7).
**Purpose:** turn a selected UX-seed composition into **one browser-playable spatial room** with an accessible scene-first surface. The experiment demonstrates an actual gameplay composition, not a 3D catalog or a generalized world engine.

## Player promise / session

> You enter a small room that remembers the particular things you chose to keep. Its objects let you do different kinds of play without turning the experience into a tool console.

**Target:** a 3–7 minute optional spatial encounter inside the existing seedplate lab. The existing 2D game must remain fully playable and be the initial low-bandwidth/default surface on phones. No account, external project access, multiplayer, or paid service is required to play.

1. **Enter** by opting in to “Visit this room” after composing at least two seeds. The actual seed IDs and visual lead determine decoration and available interactions, not a wholesale engine swap.
2. **See** a warm, concise room with one legible hero object and clear foreground options. A porch/window/chair/table may frame it, but should not silently imply a traversable doorway unless navigation truly exists.
3. **Interact** with two to four spatial affordances. Example: the table carries Grace’s local choice; the small picture machine opens Toaster proposals; a listening seat enables GrooveRooms' local note; a card pile enables FORK's intruder.
4. **Choose** with DOM cards: inspect → preview → explicit act or KEEP/SCRAPE → consequence. No 3D click directly commits a state change.
5. **Return** to the unchanged composed run, with event IDs and parentage exactly as if the existing 2D UI had been used. Pause, reduced motion, or failure to load WebGL cannot strand the player or alter the event sequence.
6. **Inspect** “The room remembers” in accessible, optional DOM UI. Candidate imagery, 3D props, animation, and imagined presences are never evidence that an outside-world event occurred.

### One combined encounter to prove

**TOASTER × GROOVEROOMS: THE LISTENING ECHO.** The player examines a picture-machine artifact (pure candidate); after explicit KEEP they may sit in the listening seat. The room reveals an additional action to create a local listening echo with an exact parent event ID. The source picture is preserved; no remote listener is invented. Grace and FORK can join as distinct optional verbs when selected but are not required to execute this two-seed proof.

## Stack and ownership

- **Existing deterministic `seedplate.mjs` replay is the state authority.** Add a separate renderer/view adapter only. No game rules in render-loop callbacks, no independent scene-local save.
- **Runtime choice:** plain Three.js in an isolated browser module is an appropriate later implementation for the current vanilla HTML/JS prototype. Use GLB/glTF 2.0 manifest keys for imported assets. Do not rewrite the existing lab in Unity or React merely to add a room.
- **DOM owns text and accessible controls**; canvas renders ambient geometry/camera. Touch and keyboard users can trigger the same hotspot actions from a persistent accessible DOM list. Pointer/camera movement never automatically accepts/keeps a candidate.
- **Input map:** inspect hotspot, select candidate, preview, confirm, cancel, return to 2D. A single fixed or gently orbitable camera; no first-person joystick in v0.1. Reduced-motion and low-bandwidth mode skip cinematic transitions.
- **Grace/Lovable's polished frontend stays a design donor** rather than being forced into 3D. Preserve a comfortable phone viewport and 44px+ primary actions.
- **No automatic remote publication** of room renders, asset files, player events, or user-supplied material.

## Room Function gate — human approval required before asset spend or final composition

Provisional room identity: `seedplate-listening-room-001`.
- **Function:** small fictional listening/choice room, not a traversable world or performance venue.
- **Footprint:** one compact interior with a visible porch/window area, a central table, listening chair, small picture machine and optional card pile. Exact dimensions/camera/door cuts must be established in the approved layout and opening schedule, not invented by assets.
- **Hero:** the kept candidate picture at the picture machine, *only after KEEP*; before then it is an obviously provisional preview. Do not treat this art object as a structural wall or real performance.
- **Circulation:** for first slice, a fixed-camera hotspot room with no implied navigable corridor. If a door is visibly open, its actual aperture, depth, destination and collision must be validated or it should be presented as a closed, non-traversable entry.
- **Performance targets** (design goals, not verified measurements): mobile initial interactive view under 5 s on representative midrange hardware and connection; interactive frame target 30 fps, reduced-motion static fallback. Measure with reproducible scenario before claiming either.
- **Visual target:** source-composed palette with readable central silhouette, restrained original props, ordinary objects with lived-in character. No neon asset-gallery aesthetic.
- **Spend envelope for first pass:** $0 provider spend; procedural proxy/primitive geometry only. Meshy remains a separate later approval with a declared maximum credits/asset and total ceiling.
- **Blocking Function outputs:** room brief, exact opening schedule, monochrome measured floor plan, production camera and hero reserve, restrained prop manifest with functional roles, reference contact sheet, user approval of the room layout and each proposed source image. Until approved, do not charge Meshy or claim room Form/Runtime approval.

## Provider/tool roles and explicit boundaries

| Tool | Useful next step | Not a substitute for |
| --- | --- | --- |
| Game Studio | Browser-game foundation, plain Three.js implementation route, DOM HUD, and playtests against existing replay kernel | Source-of-truth world model |
| Build 3D Game Rooms | Function → asset → Form → Runtime gates; measured floor plan, collision, actual wall openings and camera review | Skipping layout approval because an attractive render exists |
| Meshy | Later produce **one or two approved GLB props** (e.g. a chipped cup or picture machine); inspect scale, license, topology and preview | Entire room shell or an unrestricted paid generation loop |
| Game Development Studio | When local CLI is available, inspect/normalize and package accepted GLBs, verify license and hashes, visual/runtime QA and perf telemetry | Automatic asset admission, authentication, or permission to mutate local project |
| HyperFrames | Optional short composited “the room awakens” transition or artifact trailer after visual identity is pinned, with reduced-motion/static alternate | Live gameplay renderer or real-time simulation |
| Unity Essentials | Optional future Unity project onboarding/build check if we choose a Unity target with actual `Assets/`, `Packages/manifest.json`, and `ProjectSettings/ProjectVersion.txt` | A prerequisite to this phone-first browser room |

No paid Meshy generation, local GPU capture, local CLI mutation, Unity project edits, live-video generation, deployment or publication are authorized by this document.

## Concrete implementation slices

**002A · no-cost runnable greybox**: render a recognizable room with procedural shell/props and two active hotspots, mirror all hotspot selection as DOM buttons, route every committed action through existing `appendRunEvent`, ensure a visual-disabled device still plays the entire loop. Fixture: Toaster proposal → KEEP → GrooveRooms listening echo returns the same event sequence and source parent in both 2D and 3D entry.

**002B · visual QA and accepted asset gate**: approve measured floor plan and reference images; request and inspect only explicitly budgeted Meshy prop(s); normalize to metric attachment/pivot conventions, license and hash manifest; prove actual runtime camera, visual fit, memory and WebGL fallback. Keep performance measurements separate from attractive still renders.

**002C · optional cinematic affordance**: a small HyperFrames transition based on the approved visual identity. It is player-skippable, does not gate interactions or mutate world state, and has a static accessible equivalent.

**002D · optional Unity bridge**: only if a verified Unity project/runtime target later exists; read-only Unity onboarding first, then an explicit decision whether Unity adds enough to justify a second renderer.

## Acceptance test / non-claims

- Same two distinct donors can be played in flat and spatial mode and yield **identical replayable event IDs, resources, proposal/admission status, and exact listening-echo parent**.
- No hotspot can silently KEEP, auto-admit a proposal, claim a remote human listener, or add an unselected donor's action.
- The spatial view does not hide the essential options; full play remains possible with keyboard/DOM controls and on WebGL failure.
- Mobile visual and performance evidence from the loaded production camera; no claim from proxy screenshots alone.
- Layout, paid-asset, Form, Runtime, Unity-build, and public-deployment approvals are individually explicit.
- A plausible beautiful room without real input/feedback and state parity **fails** the slice.

**What exists as of this document:** PLAY-SEEDPLATE-001 browser composer, deterministic replay, 10 green Node tests on its PR head, and a portable source-attributed recipe. **What does not yet exist:** a built 3D room, Meshy assets, a Unity port, a HyperFrames transition, or a measured browser 3D playtest.
