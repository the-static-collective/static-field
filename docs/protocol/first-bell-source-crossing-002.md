# FIRST-BELL SOURCE CROSSING 002 — LOCAL BREACH

Status: opt-in, source-owned, file-based prototype on a branch stacked above STATIC FIELD PR #1. This is **not** a live network link or authenticated human/world identity service.

## Boundary

The original FIRST BELL history and its receipts are immutable. After a closed play with the open corner actually traced, STATIC FIELD may append a native `GATE_OPEN_OFFERED` event. A source Gate offer is not a destination admission or a source departure. After a separately scoped FOREIGN ROOM admission and explicit same-player confirmation, the source can append `PORCH_DEPARTED`, referencing both foreign receipts. It does not record or predict arrival. The Bell and Knock remain unresolved.

The source-owned native export snapshots are successors to the prior source snapshot; **they do not edit a running browser server's in-memory state or its original event log**. Stop the browser server before exporting a played Porch; do not run another independent writer against the same history. Hashes detect content mismatch but do not prove the real identity of a player or the author of a foreign receipt.

## Run a personally played Porch

On this branch, with Node 22 and dependencies installed:

```sh
npm run build
npm start
# Play First Bell to CLOSE PLAY in the browser, then stop the server.
npm run export:played-porch -- --log var/static-field/history.jsonl --out out/played-porch
npm run crossing:source -- --phase offer --from out/played-porch --out out/offered
```

Take `out/offered` to WORLDSEED's corresponding Origin real-source crossing branch. Its `prepare` operation independently validates the native offer and produces a destination-owned admission, and `confirm` records an explicit human CLI choice in a packet. After those operations:

```sh
npm run crossing:source -- --phase depart --from out/offered --packet /path/to/worldseed/packet.json --out out/departed
```

Return `out/offered`, `out/departed` and the packet to WORLDSEED for independently receipted destination arrival. Do not treat this path as globally exactly-once: creating multiple output forks from one input directory is intentionally possible in a filesystem prototype and requires a later durable source coordinator.

## Deterministic fixture

`npm run demo:first-bell -- --out out/first-bell` generates a *native executable fixture*, rather than replaying an actual person's browser interaction. For this dated fixture only, the source offer can use `--at 2026-09-21T22:13:00.000Z`; confirmation, departure and arrival times must be later in that order. This proves contract compatibility, **not** actual personal participation.

Nonclaims: no historical Bell/Knock cause, no external person identity or consent, no project authority inheritance, no private memory or local Charge transfer, and no real-world portal.
