# STATIC PLAY SEEDPLATE 001 — living donor cards

Status: **experimental design and executable local prototype**, not a constitutional rule or source of cross-project admission. The source project owns its UX and implementation; this catalog captures one **bounded adaptation** of a documented interaction, not a reusable copy of its code, artwork, trade dress, or authority.

| Seed | Source | Mechanic carried | Visual mood carried | Explicit non-claim |
| --- | --- | --- | --- | --- |
| Grace · House | [Full Measure GRACE](https://github.com/the-static-collective/full-measure-world-layer/pull/33), [Lovable Grace prototype](https://lovable.dev/projects/0a9024b9-daf0-4ad3-8463-8a7b389a54c9) | Scene-first intimate choices; finite day; choice → consequence → memory; leftover needs stay open | Warm editorial paper, intimate illustration, readable generous tap targets | The Lovable prototype is a standalone design donor, not a connected Full Measure runtime. |
| Haunted Toaster | [Toaster release contract](https://github.com/the-static-collective/the-haunted-toaster/blob/main/README.md) | Generate a bounded family of *possibilities*; focus is observational; KEEP permits only a particular candidate; SCRAPE asks for a fresh family | Surprising moving picture / specimen stage with clear focused candidate | A previewed or scraped proposal is neither world history nor a learned negative preference. |
| GrooveRooms | [GrooveRooms](https://github.com/the-static-collective/groove-rooms/blob/main/README.md), [Lovable Band Room](https://lovable.dev/projects/64664457-d2ad-46d1-aad3-375e9d8b224b) | Presence-centered listening room; contributions create identifiable encounter traces; history available in a drawer | Warm dark studio / shared space / visible arrivals and pauses | This prototype is **solo-local**, not networked multiplayer or a claim another participant actually responded. |
| FORK! | [FORK! app](https://github.com/the-static-collective/fork-EXCLAIM/blob/main/src/App.tsx), [card dealing](https://github.com/the-static-collective/fork-EXCLAIM/blob/main/src/components/CardDeal.tsx) | Present KEEP/BEND/INTRUDER, make one move, retain parentage, replay from a descendant | Punchy, high-contrast zine card energy; a strong contrast to Grace's quiet warmth | A proposed intruder is not an actual arrival; a branch never rewrites its parent. |

## What is a seedplate?

A seedplate is a **source-attributed generative rule**:
`seed = interaction + visual impulse + emotional job + boundaries`.
It is not a screenshot to copy, a JSX component to paste everywhere, or a score for one donor.

A composition is `(distinct seed ids, encounter, retained event sequence)`. The first executable lab supports 2, 3, or 4 distinct donors. It retains each seed identity and a clear, ordered action/receipt trail. Every selected donor must contribute an **actual playable move**; simply changing a palette does not constitute a composition.

## Composition moves (experiment)

- **LAYER**: a donor changes framing without taking over another donor's operation; e.g. an intimate Grace room containing a Toaster preview stage.
- **CROSS**: two independently recognizable moves combine in one encounter; e.g. a speculative image card carried into a GrooveRooms-style locally witnessed note.
- **INTERRUPT**: a donor changes the order of attention; an incoming candidate or guest appears without inventing an external occurrence.
- **RETURN**: an accepted action leaves a bounded descendant that the room can encounter on a later turn.

The generator in `seedplate.mjs` is **deterministic**, uses no network/AI/model calls, and exposes no project-adapter API. It proves the UX composition grammar, not an autonomous story generator.

## Invariants

1. **Source ≠ adaptation ≠ canon.** A donor's design is attributed; the new encounter is local fiction.
2. **Proposal ≠ occurrence.** Toaster candidate options cannot become retained memory except through KEEP. Scrape does not express a negative feature preference.
3. **Presence ≠ multiplayer.** The GrooveRooms-derived note is player-authored local fiction, not a remotely observed human reply.
4. **Branch ≠ rewriting.** FORK-derived branches preserve their parent turn and cannot edit it.
5. **Attention ≠ morality.** A Grace-derived time cost is finite but cannot grade the person or the choice.
6. **Skip/stop is legal.** Nothing in this prototype gates access to rest, care, or personal relationships.
7. **Visual differentiation is intentional.** All four donors need not share a beige skin; use the grammar, not the surface clone.

## LISTENING ROOM 0.1 / PLAY-SEEDPLATE-002A — procedural spatial greybox

A **browser-playable optional 3D room** has now landed in this experimental branch. Select both **Haunted Toaster** and **GrooveRooms**, compose the room, and use **Visit the listening room**. It dynamically starts a warm procedural Three.js interior with an inspect-only picture machine and listening chair. The two accessible DOM hotspot buttons perform the same inspection for keyboard/touch users; any gameplay choice still uses the original card preview and `appendRunEvent`. **Back to simple view** retains exactly the same local save. Selecting a new composition or clearing the existing one disposes the old renderer.

To exercise the combined move, inspect the chair → listen → return; inspect the machine → view candidates → explicitly KEEP one → return; inspect the chair again → create the now-available **listening echo**. The existing deterministic replay supplies the unlock and exact kept-scene parent, not the 3D renderer. KEEP-first, then listen, also works. A viewed or scraped candidate never silently becomes history.

**Zero external model/asset spend.** The room is built from authored Three.js primitive meshes and lighting. [room-asset-manifest.json](./room-asset-manifest.json) pins the **optional prototype** renderer to Three.js `0.180.0` on jsDelivr and records its MIT license and source. **This experimental room needs browser network access and WebGL2** to load the 3D view. Loading failure/context loss returns to the fully functional simple view. A final shipped build requires a separately reviewed bundled/vendored Three.js package rather than a CDN dependency.

**Browser QA:** [PLAY-SEEDPLATE proof CI](https://github.com/the-static-collective/static-field/actions/workflows/play-seedplate-proof.yml) now runs the pure game/projection tests plus an actual mobile-sized Chromium smoke test. The smoke test boots the 3D canvas, uses DOM hotspots for listening and KEEP→echo, checks event IDs and local-save parity across mode switching and reload, and blocks the Three.js URL to verify the flat-game fallback. The run also uploads a phone-sized screenshot artifact. **This is executable proof, not human visual acceptance, measured phone FPS, final room geometry certification, or production deployment.**

**Next gate:** manual visual and mobile-device review of the loaded camera and tap target placement. Approve a measured room plan/actual aperture schedule before replacing this greybox with final geometry or paying an asset provider; [ROOM-002](./ROOM-002.md) and [the build brief](./LISTENING-ROOM-0.1-BUILD-BRIEF.md) hold those conditions. No Game Development Studio local CLI invocation, Meshy/Tripo/Thrixel credit spend, Unity migration, or publishing has occurred.

## Proof and exercise

From the repository root:

```bash
node --test experiments/play-seedplate-001/seedplate.test.mjs
python3 -m http.server 8765
```

Visit `http://localhost:8765/experiments/play-seedplate-001/` in a browser. Choose at least two donor cards; press **Compose this room**; perform an action or propose/scrape/keep a candidate; return to the room; inspect the **Room remembers** drawer; alter the seed selection and compare. The **Copy this seed recipe** action exports selected donor identities, independently chosen visual lead, source links, mechanic descriptions, and explicit non-claims as portable JSON. It neither copies donor implementations nor invokes them.

The current lab supports every 2–4-donor set, but it has no networked rooms, real media render, live world crossing, actual FORK inheritance transfer, or Full Measure admission. No production donor repository was modified.
