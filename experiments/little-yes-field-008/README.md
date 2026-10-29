# Static Field / Little Yes Expansion Shelf 007–008

This additive, **review-only** branch stacks on Static Field Living Deck PR #12 exact head `80b08f7a45f6957239582091536ea9528df7a1b7`. It does not merge, deploy or select canon.

## Play at a table

Open `index.html` directly, then select one of two stand-alone, no-login, offline playable pages. The optional `postemahhn-living-deck-001` entrance uses a local HTTP server due to ES module imports.

* `rail/index.html` is the original synthetic Little Yes Express 007 standalone from CANNON PR #78 (pinned at `d634b9fb0ed1e9df9224fdc76cef279b5b40e4d4`), with the owner source `rail/game.mjs` and its original tests.
* `kingdom/index.html` is the self-contained Earth Remembers 008 party extension, inspired by lyrics provided by the user. `kingdom/kingdom.mjs` is re-extracted from its bundled author-provided local implementation, importing **the same original** `rail/game.mjs` for Node-level tests; HTML is a frozen inlined bundle and must be rebuilt if either engine changes.
* `field-bridge.mjs` **calls the actual Static Field Living Deck `buildBrowserHandoff` source**, then offers strictly held 007/008 local fiction play doors. Invalid card/sticker compositions REFUSE; valid ones never grant source-card proof, human consent or destination authority. This module is a source-supported experiment, not automatically invoked from the browser page.
* `catalog.json` links Groovetown 001–006 as independent review-only CANNON experiments and records GrO, GHoT, Reality 2.0 and Harmony history without pretending they are executable here.
* The shelf's optional return ticket exports a **local, unsent, unverified question** rather than dispatching help or creating a confirmed Deed.

## Execute tests

```sh
node --test experiments/postemahhn-living-deck-001/tests/*.test.mjs
node --test experiments/little-yes-field-008/rail/game.test.mjs experiments/little-yes-field-008/kingdom/kingdom.test.mjs experiments/little-yes-field-008/tests/*.test.mjs
```

## Authority limits

Play YES != real assent. A synthetic receipt != physical work. Song lyrics != actual Suno audio master. A relic/story-card digest != a blockchain NFT, issued token, material ownership or verified monetary transaction. Workers are not resources. Any source-owned, independently authorized real-world crossing requires a future separate review. Original First Bell, Wormhole Wars, Full Measure, ROroomOM, reLATTE, PENNY and live Reality 2.0 data are not modified.
