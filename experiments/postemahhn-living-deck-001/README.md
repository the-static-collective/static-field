# PostEmahh'n Living Deck 001 — Fellowship Table experiment

Status: **experimental / noncanonical / independent of the existing First Bell and Wormhole Wars stacks**.

This is a deliberately bounded card × sticker × Static Field composition specimen. It does **not** implement or impersonate the PostEmahh'n source system. The four cards and six operations are local illustrative fixtures only. PostEmahh'n retains ownership of identity, embodiment, composition lineage, NOW/MAIL/HEIR and delegated capabilities, as described in `docs/superpowers/specs/2026-09-21-static-field-worldseed-001-design.md`.

## Run

From this directory:

```sh
node --test tests/composer.test.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` in a browser. Use a local HTTP server because the page imports an ES module. Node 18+ is sufficient for the tests. No install, API key, external JavaScript library or network service is required.

## Try it

1. Select **Cicada on the Porch** as source, **The Porch Radio** as receiver, and **ECHO** as sticker. Compose; INSPECT and ATTEMPT; play the synthesized four-note loop; adjust its tempo; stop it; export a JSON receipt.
2. Reverse the cards with ECHO: the compiler must refuse the unsupported receiver/source orientation rather than guess an adapter.
3. Select Blue Cup → Missing Corner + OPEN. This yields a proposed local room and quest with no executable tool. Leave without attempting: an unresolved encounter is a valid result.
4. Export receipts for different combinations and compare their ordered references. The browser events are local preview actions; exporting does not publish anything to the shared world.

## Proposed contract for future adapters

The pure `compose` function validates the fixture card/sticker relation and produces a stable, ordered proposed receipt, a candidate Full Measure quest specification, a candidate ROroomOM scene specification, and an optional browser-local sound instrument. Unsupported relations fail closed, and unsupported executable tools return `null`. Inputs cannot set acceptance, authority, source verification, or arbitrary commands.

Real adapters must be separate and explicit:

- **PostEmahh'n → import:** check genuine card identity, sticker embodiment, permissions, delegated capability, lineage and signatures/receipts through its own authoritative interface. Do not silently promote the fixture strings in this demo.
- **Full Measure → admission:** validate a requested quest against destination-owned world/party state and return admit/hold/refuse; a browser preview is never an external occurrence.
- **ROroomOM → rendering:** use a constrained scene schema, and dispatch only allowed local actions. Do not evaluate untrusted card-supplied JavaScript.
- **Static Field → event history:** record only an independently authorized, attributable destination-local crossing. Source events, Resonance interpretations and historical receipts must not be rewritten.
- **Physical cards/stickers:** printed QR codes can point to the card's public identity/encounter, but scanning them alone does not prove ownership, authenticate authorship, or grant permission.

## Receipt and limits

The receipt includes `provenance.origin=local-demo-fixture`, `verifiedExternalCardIdentity=false`, `authority=none`, and `acceptedIntoSharedWorld=false`. Audio is locally synthesized, not sourced from a real Static Collective recording. Export is an explicit browser download, not remote submission. No persistent session, physical sticker recognition, server world update, outside repo adapter, authentication, multiplayer, or canonical card generation is implemented.

**Next test frontier:** import one real card and one real sticker through their source-owned interface, and demonstrate separate proposal, destination admission, and an actual authorized local receipt before claiming any cross-system integration.
