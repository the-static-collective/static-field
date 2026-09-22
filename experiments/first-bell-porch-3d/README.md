# THE FIRST BELL — Porch 3D asset handoff (experimental)

**Purpose:** Preserve the first Higgsfield Porch scene so Static Field graphics work can reuse it. This is visual source material, **not** canonical Field state or a runtime adapter.

## Sources and pinned identity

- Original editable Higgsfield 3D Jutsu project: https://higgsfield.ai/3d-jutsu/6bc35142-41ee-4483-9cd1-07a2fe5b6596
- Project ID: `6bc35142-41ee-4483-9cd1-07a2fe5b6596`; committed **revision 1** (operation `porch-blockout-002`, 2026-09-21).
- Original exported GLB: 72,732 bytes; provider ETag `384a12a477926c922a6a32ca45f8e5df`.
- Original editable .blend: 924,991 bytes; provider ETag `9d5b6eff9ff1e5922c51c1e57a2dfda8`.
- Original GLB/.blend binary files **are not copied into this repository**. Provider download URLs expire; open the stable project above to retrieve that exact revision when available. An ETag is not a SHA-256 checksum.
- [build_porch.py](build_porch.py) is a reusable **local Blender reconstruction of the procedural scene**. Run `blender --background --python build_porch.py` to generate `porch-reconstructed.blend` and `porch-reconstructed.glb`. These outputs are not claimed byte-identical to Higgsfield's exported files.

## Existing scene facts (verified via Higgsfield Blender query)

44 objects including the porch, window, screen door, empty chair, workbench, Bell, open-corner mark, delivery camera and three area lights. Materials: Bell brass, Cedar, Desert, Lantern amber, Night and Oak. The project export succeeded at revision 1; appearance on different renderers and asset compatibility with the game are **not yet verified**. Blender AREA lights were reported unsupported by the GLB exporter; use game-native lighting or portable light types when integrating.

## Reuse target and contract

- First target: `STATIC-FIELD-FIRST-BELL-001`, THE PORCH.
- Treat this as a renderer-side asset only. Render the Surface scene and optionally express the distinct Resonance projection visually, but never let asset state mutate historical occurrences or resolve the Bell's unresolved source.
- Interactive anchors can map to: chair, workbench, screen door, Bell, open-corner mark. Their existence or visibility cannot imply a player's actual action, discovery, attendance or interpretation.
- Keep the visual scene optional: the headless deterministic world kernel, fixture, tests and local browser remain operable without Blender/Higgsfield.

## Integration checklist

- [ ] Download and validate the original revision-1 GLB and .blend **or** execute and validate `build_porch.py` with a local Blender install.
- [ ] Inspect both Surface and Resonance world maps; decide on 2D overlay vs. 3D render without changing event authority.
- [ ] Introduce named interaction anchors with explicit event/receipt mapping, not guessed gameplay from meshes.
- [ ] Check mobile rendering, GLB material and light fidelity, responsive fallback, asset size, accessibility and memory.
- [ ] Pin an approved asset build by immutable digest and document the loader under the actual Static Field implementation branch.
- [ ] Preserve the unresolved Bell source and missable open-corner clue in regression tests.

**Cross-project UI reference:** Workbench's [First Door UI study](https://github.com/the-static-collective/static-workbench/blob/main/docs/asset-handoffs/static-arg-first-door-figma-001.md). Neither asset silently promotes neighboring projects into shared authority.
