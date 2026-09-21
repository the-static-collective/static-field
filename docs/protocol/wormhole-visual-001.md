# WORMHOLE WARS VISUAL-001 — original card-table art contract

**Status:** experimental visual treatment on top of `experiment/wormhole-wars-003-table-world`; not a new world law, gameplay system, art-market entitlement, or approved 3D asset spend.

## The direction

A found-object strategy game played on a folding table where analogue artifacts meet small, bounded dimensional openings. The feel is tactile, worn, legible, and strange: copper, enamel, dark glass, paper edges, incomplete geometry. Avoid copying the look, emblems, characters, layouts, writing, interface, or card frames of Rick and Morty or South Park. The private binder stays private; all four illustration assets were authored specifically for this project.

The visual language must communicate **source, receiver, relation, and obstruction** independently of the game's text:

| Card | Art motif | Accent | Recognizable gameplay meaning |
| --- | --- | --- | --- |
| SIGNAL | Brass bell emitting concentric circuits | Amber/brass | Source / `tone:bell` |
| RECEIVER | Glass resonator with inward-facing wave brackets | Mint/teal | Target / `tone:knock` |
| SECOND CHAIR | Two seats and an **open**, mutual arc | Dusty rose/warm cream | An offer the other declared role may accept or decline |
| MISSING CORNER | An incomplete square around a narrow aperture | Violet/pale mint | A proposed composition; not automatic success |

Implemented art is four source-controlled, text-free SVGs under `public/wormhole-art/`, served by an exact file whitelist. They are image assets, not privileged card definitions. They cannot carry game rules or modify First Bell history. Accessible card labels, descriptions, resource costs, and remaining counts stay in ordinary text adjacent to the images. Card art uses empty `alt` because the same card's title and gameplay effect are already rendered as text.

## Battlefield and game feedback

- PORCH: amber window, angled weathered floorboards and warm framed interior.
- HALL: mint-lit structural lines, framed depth, and a vertical aperture.
- ROAD: cold horizon, receding route and a distant beacon.
- Selected lane: high-contrast outline, not color alone. Occupied lane: source/target tokens with visible owner and exact port strings.
- Portal scene stays visually **unmade** until the source reducer reports its actual state. It has separate visual phases for gap, constituted bridge, stabilized source, admitted receiving world, and completed receiving-side crossing.
- The move-feedback panel reports only returned server outcomes. Refused moves retain a distinct visible treatment and an ordinary explanatory status message; the browser never invents admission success.
- Only subtle cosmetic pulse and portal motion are permitted. `prefers-reduced-motion` disables animations. Buttons retain keyboard focus outlines and visible text, with responsive two-column cards on phone widths.

## Single 3D asset experiment (not yet charged or generated)

**Object:** the folding tabletop, the same canonical stage used by all three lanes; do not generate an entire room yet.

**Purpose:** test whether one lightweight, reusable GLB increases tactility while the 2D DOM remains authoritative for readable cards, costs, accessibility, and input. A 3D stage must remain optional, never a required GPU dependency for the card game.

**Minimal prop brief:** one folding table with worn wooden top and folding metal legs; 1.6 m width × 0.75 m depth × 0.74 m height; unobstructed front and clean upper playing surface; no cards, characters, signage, proprietary design, text, or portal baked into mesh. Low-poly but careful silhouette, texture budget initially ≤1024 px per material set and target ≤15k triangles, GLB/glTF 2.0. Separate procedural VFX from geometry. Save origin, prompt, generator, credit consumption, source GLB, license, dimensions and measured triangle count before any game import.

**Provider routing:** Thrixel or Tripo can produce the model once the selected service is available and the user explicitly approves its current generation cost. Game Development Studio can inspect/package a produced GLB if its local `game-dev` CLI is configured; Build 3D Game Rooms becomes relevant for a later *whole receiving room*. No paid provider call, account setup, hosting, or asset claim is implied by Visual-001.

**Acceptance:** render the asset at tabletop camera angles and a phone-width screenshot, inspect leg/tabletop intersections, occlusion, glTF compatibility, GLB bytes and source license, CPU/GPU impact, and ensure no art layer covers interactive card text or accessible controls. If the model fails the mobile performance budget, preserve the 2D implementation as the primary experience.

## Verification distinction

GitHub CI verifies assets can be requested from the loopback server, are allowlisted text-free vector art, existing rules and game replay remain valid, and browser markup/script reference the correct visual states. CI does not, by itself, prove an image is aesthetically successful or certify actual phone rendering. A human browser inspection and any later measured 3D asset test are separate evidence.
