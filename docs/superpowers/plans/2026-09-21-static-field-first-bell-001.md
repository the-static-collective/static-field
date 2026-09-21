# STATIC-FIELD-FIRST-BELL-001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first deterministic, local-first STATIC FIELD playable specimen: enter THE PORCH, perform ordinary preparations, record attendance, hear two unresolved Bell occurrences, cross between Surface and Resonance maps, trace one prior relation, preserve the Bell's unresolved source, receive the ending knock, and persist the changed world state.

**Architecture:** Implement a headless TypeScript world kernel with append-only events and deterministic projections, then expose it through a tiny local browser surface. Keep Surface and Resonance as separate projections over one event history; no UI state may become world authority. THE FIRST BELL is fixture-driven and deterministic in v0.1 so later Band Runtime, Static Live, PostEmahh'n, Bandcamp/catalog, Upper Room, and Dogram adapters can attach without rewriting the core.

**Tech Stack:** Node.js 22+; TypeScript 5.x; ESM; Node built-in `node:test` and `assert`; Node `crypto` for SHA-256; built-in `http` for local server; plain HTML/CSS/JavaScript for the browser surface; zero runtime npm dependencies.

**Spec:** `docs/superpowers/specs/2026-09-21-static-field-worldseed-001-design.md`

## Global Constraints

- STATIC FIELD is the ordinary world encountered through accumulated musical resonance.
- Surface Map and Resonance Map are simultaneously valid and must never collapse into one authority plane.
- The Field remembers occurrences, not fantasies about them.
- Repetition may reveal relationship; it must not prove meaning.
- Songs may become geography without becoming source authority.
- The Field responds to particular parties, not generic account levels.
- Silence and absence remain representable.
- Ordinary verbs are the local magic grammar.
- Prayer and self-care affect capacity without assigning moral worth or certifying divine endorsement.
- Worlds continue while the party is away.
- Flashbacks, memories, dreams, and replay may expose new information but may not rewrite historical receipts.
- Model proposals or reconstructions do not manufacture witness.
- A Static Live fallback stem does not become a missing human performer.
- Band Runtime history/admission semantics remain external authority and may only be referenced through adapters.
- PostEmahh'n ancestry remains external authority and may only be referenced through adapters.
- WORLDSEED-001 implements one place and one occurrence chain correctly; it does not implement the entire Static Collective world.
- THE FIRST BELL must permit the Bell source to remain unresolved through the closing PlayReceipt.
- Not noticing a secret is a valid play outcome.
- The ending knock is an occurrence, not an automatic interpretation.
- Relationship without absorption is the thematic center.
- No framework, network service, database server, external model, map API, audio engine, or cloud service is required for the first crater.

## Review Focus

1. **Surface/Resonance authority collapse** — a Resonance discovery must never mutate a historical Surface occurrence or silently turn an interpretation into evidence. Task 4 pins this.
2. **Missed Bell/secret path** — a player who does not inspect the LMV/open-corner clue after Bell Two must still be able to continue and complete a valid play without the engine pretending the clue was noticed. Tasks 5 and 8 pin this.
3. **Replayed or duplicated ordinary actions** — repeated chair/cable/water actions must be idempotent where appropriate and must not inflate attendance, Field Depth, or Charge accidentally. Tasks 2 and 3 pin this.
4. **Unresolved-source coercion** — closing the story must not require assigning a Bell cause; the final receipt must preserve `sourceStatus: "unresolved"`. Tasks 5 and 8 pin this.
5. **Restart/persistence drift** — restarting the local server from persisted event history must rebuild the exact same Surface/Resonance state and not re-emit Bell or Knock events. Task 7 pins this.

---

## Repository file map

```text
static-field/
  README.md
  package.json
  tsconfig.json
  src/
    kernel/
      canonical.ts
      types.ts
      events.ts
      receipts.ts
      projection.ts
    world/
      charge.ts
      attendance.ts
      field-depth.ts
      surface.ts
      resonance.ts
      party.ts
      gates.ts
    first-bell/
      fixtures.ts
      reducer.ts
      story.ts
      receipts.ts
    persistence/
      event-log.ts
    server/
      app.ts
      routes.ts
    cli/
      first-bell.ts
  public/
    index.html
    app.js
    styles.css
  tests/
    kernel/
      canonical.test.ts
      projection.test.ts
    world/
      attendance.test.ts
      charge.test.ts
      resonance.test.ts
    first-bell/
      story.test.ts
      missed-secret.test.ts
      restart.test.ts
    integration/
      first-bell-browser-contract.test.ts
  fixtures/
    first-bell/
      prior-relations.json
      initial-world.json
      expected-receipts.json
  docs/
    protocol/
      static-field-runtime-v01.md
      first-bell-001.md
```

Each source file owns one responsibility. Browser files render and dispatch declared actions only; they do not compute canonical receipts or decide world truth.

---

### Task 1: Repository bootstrap and deterministic canonical identity

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/kernel/canonical.ts`
- Create: `src/kernel/types.ts`
- Create: `tests/kernel/canonical.test.ts`

**Interfaces:**
- Consumes: Node `crypto`.
- Produces:
  - `type JsonValue`
  - `canonicalize(value: JsonValue): string`
  - `sha256Canonical(value: JsonValue): string`
  - `stableId(namespace: string, value: JsonValue): string`
  - base discriminated unions for `WorldEvent`, `ParticipantRef`, `MapKind`, `EvidenceClass`, `SourceStatus`

- [ ] **Step 1: Create package and TypeScript configuration**

Use this `package.json` shape:

```json
{
  "name": "@static-collective/static-field",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "npm run build:test && node --test build-test/tests/**/*.test.js",
    "build:test": "tsc -p tsconfig.json --outDir build-test",
    "typecheck": "tsc --noEmit",
    "build": "tsc -p tsconfig.json",
    "start": "node build/server/app.js",
    "demo:first-bell": "node build/cli/first-bell.js"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0"
  }
}
```

Configure strict ESM TypeScript with source root `.`, output `build`, and include `src/**/*.ts` plus `tests/**/*.ts`.

- [ ] **Step 2: Write failing canonicalization tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize, sha256Canonical } from "../../src/kernel/canonical.js";

test("object key order does not change canonical hash", () => {
  assert.equal(
    sha256Canonical({ a: 1, b: 2 }),
    sha256Canonical({ b: 2, a: 1 }),
  );
});

test("array order remains significant", () => {
  assert.notEqual(
    sha256Canonical(["surface", "resonance"]),
    sha256Canonical(["resonance", "surface"]),
  );
});

test("non-finite numbers are rejected", () => {
  assert.throws(() => canonicalize({ n: Number.NaN as never }));
});
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```bash
npm test -- tests/kernel/canonical.test.ts
```

Expected: failure because `canonicalize` is not implemented.

- [ ] **Step 4: Implement canonicalization and stable IDs**

Canonicalization must recursively sort object keys, preserve array order, encode UTF-8 deterministically, and reject `undefined`, functions, symbols, bigint, NaN, and infinities.

- [ ] **Step 5: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json src/kernel tests/kernel/canonical.test.ts
git commit -m "feat: establish deterministic static-field identity"
```

---

### Task 2: Append-only world events, receipts, and deterministic projection

**Files:**
- Create: `src/kernel/events.ts`
- Create: `src/kernel/receipts.ts`
- Create: `src/kernel/projection.ts`
- Test: `tests/kernel/projection.test.ts`

**Interfaces:**
- Consumes: canonical hashing and base types.
- Produces:
  - `appendEvent(history, draft): readonly WorldEvent[]`
  - `projectWorld(history): WorldProjection`
  - `createEventReceipt(event, historyBefore): EventReceipt`
  - `WorldProjection = { surface, resonance, party, story }`

- [ ] **Step 1: Write failing append-only tests**

Tests must prove:
- append returns a new history array;
- prior event objects remain unchanged;
- duplicate event IDs are rejected;
- projection from identical histories is deterministic;
- replaying the same history produces the same projection hash.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/kernel/projection.test.ts
```

Expected: FAIL because event/projection functions do not exist.

- [ ] **Step 3: Implement event append and receipt envelope**

Every event must include:
- `eventId`
- `kind`
- `occurredAt`
- `actor`
- `evidenceClass`
- `sourceStatus`
- `payload`
- `parentEventIds`

No event append operation may mutate an earlier event.

- [ ] **Step 4: Implement deterministic projection reducer**

The reducer may derive state from event history but may never add new events during projection.

- [ ] **Step 5: Run tests/typecheck and commit**

```bash
npm test
npm run typecheck
git add src/kernel tests/kernel/projection.test.ts
git commit -m "feat: add append-only field event projection"
```

---

### Task 3: THE PORCH Surface state, attendance, Field Depth, and Charge

**Files:**
- Create: `src/world/surface.ts`
- Create: `src/world/attendance.ts`
- Create: `src/world/field-depth.ts`
- Create: `src/world/charge.ts`
- Create: `src/world/party.ts`
- Create: `fixtures/first-bell/initial-world.json`
- Test: `tests/world/attendance.test.ts`
- Test: `tests/world/charge.test.ts`

**Interfaces:**
- Consumes: `WorldEvent`, projection reducer.
- Produces:
  - `PorchSurfaceState`
  - `AttendanceState`
  - `ChargeState`
  - `applySurfaceEvent()`
  - `deriveAttendance()`
  - `deriveFieldDepth()`
  - `deriveCharge()`

- [ ] **Step 1: Write failing Porch/attendance tests**

Fixture must contain:
- two chairs;
- extension cord;
- old amp;
- chipped cup / coffee place;
- dog-water bowl;
- screen door;
- repaired handrail;
- unresolved hanging/bell position.

Tests must prove:
- arrival creates attendance once;
- repeating the same idempotent setup action does not duplicate the object's prepared state;
- placing a second chair does not imply a second person arrived;
- absence can be represented without manufacturing a participant;
- Field Depth derives from qualifying historical events and is not writable directly.

- [ ] **Step 2: Write failing Charge tests**

Pin:
- `REST`, `TEND`, `PRAY`, `PLAY`, `WITNESS`, `KEEP`, `ASK_FOR_HELP` are valid capacity verbs;
- Charge cannot be negative;
- low Charge may disable `POUR` while leaving `RECEIVE`, `HOLD`, `REST`, `ASK_FOR_HELP`;
- PRAY records an intentional practice event but does not set any field equivalent to `divineApproval: true`.

- [ ] **Step 3: Run RED**

```bash
npm test -- tests/world/attendance.test.ts tests/world/charge.test.ts
```

- [ ] **Step 4: Implement derived world state**

Field Depth must be a derived structure such as:

```ts
interface FieldDepth {
  attributableArrivals: number;
  careActs: number;
  repairs: number;
  performances: number;
  unresolvedAbsences: number;
  unfinishedThreads: number;
}
```

Do not collapse this to one moral/player score in v0.1.

- [ ] **Step 5: Run full suite/typecheck and commit**

```bash
npm test
npm run typecheck
git add src/world fixtures/first-bell/initial-world.json tests/world
git commit -m "feat: establish the porch and attendance physics"
```

---

### Task 4: Resonance Map and relation-without-promotion

**Files:**
- Create: `src/world/resonance.ts`
- Create: `fixtures/first-bell/prior-relations.json`
- Test: `tests/world/resonance.test.ts`

**Interfaces:**
- Consumes: Surface events and archived relation fixture.
- Produces:
  - `ResonanceState`
  - `ResonanceRelation`
  - `deriveResonance(history, relationArchive): ResonanceState`
  - `traceRelation(relationId): RelationTrace`

- [ ] **Step 1: Write failing Surface/Resonance separation tests**

Tests must prove:
- a Bell Surface occurrence remains `sourceStatus: "unresolved"` after a related archived musical source is found;
- a Resonance relation may point to multiple sources without selecting one as cause;
- a repeated motif increments relation evidence references but not semantic certainty;
- deleting/altering a Resonance fixture cannot mutate historical Surface events;
- `interpretation` and `evidenceRefs` remain separate fields.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/world/resonance.test.ts
```

- [ ] **Step 3: Implement relation derivation**

Use an explicit type:

```ts
interface ResonanceRelation {
  relationId: string;
  subjectRefs: readonly string[];
  evidenceRefs: readonly string[];
  interpretation?: string;
  sourceStatus: "resolved" | "unresolved" | "contested";
  promotedClaim: false;
}
```

`promotedClaim` is fixed false in v0.1.

- [ ] **Step 4: Run full suite/typecheck and commit**

```bash
npm test
npm run typecheck
git add src/world/resonance.ts fixtures/first-bell/prior-relations.json tests/world/resonance.test.ts
git commit -m "feat: add non-promoting resonance map"
```

---

### Task 5: THE FIRST BELL story reducer

**Files:**
- Create: `src/first-bell/fixtures.ts`
- Create: `src/first-bell/reducer.ts`
- Create: `src/first-bell/story.ts`
- Create: `src/first-bell/receipts.ts`
- Test: `tests/first-bell/story.test.ts`
- Test: `tests/first-bell/missed-secret.test.ts`

**Interfaces:**
- Consumes: world projection, Porch state, Resonance state.
- Produces:
  - `FirstBellStoryState`
  - `FirstBellAction`
  - `dispatchFirstBellAction(history, action): readonly WorldEvent[]`
  - receipt constructors for arrival, attendance, Bell occurrences, relation, completed play.

- [ ] **Step 1: Write failing mainline story test**

Drive this exact deterministic sequence:

```text
ENTER_PORCH
SET_OUT_CHAIR
ROUTE_CABLE
PUT_OUT_WATER
CHECK_DOOR
BELL_1
CONTINUE_PREPARATION
BELL_2
NOTICE_OPEN_CORNER
ENTER_RESONANCE
TRACE_PRIOR_RELATION
KNOCK
CLOSE_PLAY
```

Assert:
- objective begins `GET_THE_ROOM_READY`;
- Bell 1 records an unresolved occurrence;
- Bell 2 records a second distinct unresolved occurrence;
- noticing the open-corner clue creates a noticing event, not retroactive Bell evidence;
- objective can become `FIND_OUT_WHETHER_THIS_HAS_HAPPENED_BEFORE`;
- tracing a prior relation creates `ResonanceRelationReceipt`;
- relation does not resolve Bell cause;
- KNOCK is recorded with unresolved interpretation;
- closing play emits `FirstBellPlayReceipt` preserving the unresolved Bell source.

- [ ] **Step 2: Write failing missed-secret test**

Sequence intentionally omits `NOTICE_OPEN_CORNER`.

Assert:
- story remains valid;
- Bell 2 still exists;
- engine does not add a notice event automatically;
- player may continue ordinary actions;
- a completed run may close with `secretNoticed: false`;
- no ResonanceRelationReceipt is fabricated.

- [ ] **Step 3: Run RED**

```bash
npm test -- tests/first-bell/story.test.ts tests/first-bell/missed-secret.test.ts
```

- [ ] **Step 4: Implement explicit story state machine**

The story reducer must reject impossible actions rather than silently skipping them.

Examples:
- `TRACE_PRIOR_RELATION` before entering Resonance → rejected;
- `CLOSE_PLAY` before KNOCK → rejected;
- second identical `BELL_1` action → rejected;
- `NOTICE_OPEN_CORNER` before Bell 2 → rejected.

- [ ] **Step 5: Run suite/typecheck and commit**

```bash
npm test
npm run typecheck
git add src/first-bell tests/first-bell
git commit -m "feat: make the first bell story executable"
```

---

### Task 6: Gate/party contracts and first unresolved Crossing residue

**Files:**
- Create: `src/world/gates.ts`
- Modify: `src/world/party.ts`
- Modify: `src/first-bell/story.ts`
- Test: `tests/first-bell/story.test.ts`

**Interfaces:**
- Consumes: completed story events.
- Produces:
  - `GateDescriptor`
  - `PartyState`
  - `CrossingResidue`
  - `deriveDetectableGates()`
  - `derivePartyAnchor()`

- [ ] **Step 1: Add failing Gate tests**

After tracing the prior relation, assert a Gate-like residue may become **detectable** but:
- has no destination in v0.1;
- is not automatically open;
- grants no authority;
- may remain `status: "unknown"`;
- does not prevent story closure.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/first-bell/story.test.ts
```

- [ ] **Step 3: Implement minimal Gate descriptor**

```ts
interface GateDescriptor {
  gateId: string;
  from: string;
  to?: string;
  triggerRefs: readonly string[];
  status: "unknown" | "detected" | "open" | "closed";
  authorized: boolean;
  unresolvedConditions: readonly string[];
}
```

WORLDSEED-001 may reach `detected`; it must not reach `open`.

- [ ] **Step 4: Run suite/typecheck and commit**

```bash
npm test
npm run typecheck
git add src/world/gates.ts src/world/party.ts src/first-bell/story.ts tests/first-bell/story.test.ts
git commit -m "feat: leave the first crossing residue"
```

---

### Task 7: Durable local event log and restart-safe continuation

**Files:**
- Create: `src/persistence/event-log.ts`
- Create: `tests/first-bell/restart.test.ts`

**Interfaces:**
- Consumes: `WorldEvent[]`.
- Produces:
  - `FileEventLog`
  - `loadHistory(): Promise<readonly WorldEvent[]>`
  - `append(event): Promise<void>`
  - `replaceForTest(history): Promise<void>` test-only helper exported from test utility, not production class.

- [ ] **Step 1: Write failing restart test**

Test:
1. create temp log;
2. play through Bell 2;
3. persist each emitted event;
4. destroy in-memory runtime;
5. reload from file;
6. derive projection;
7. assert Surface/Resonance/story hashes match pre-restart state;
8. continue with NOTICE/TRACE/KNOCK/CLOSE;
9. assert Bell 1 and Bell 2 were not re-emitted;
10. restart again after close and assert world remains closed-but-persistent, not reset.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/first-bell/restart.test.ts
```

- [ ] **Step 3: Implement JSONL event storage**

One canonical event per line.

On load:
- reject malformed JSON;
- reject duplicate IDs;
- reject event sequence whose stored hash does not match canonical event content;
- never truncate automatically.

- [ ] **Step 4: Run suite/typecheck and commit**

```bash
npm test
npm run typecheck
git add src/persistence tests/first-bell/restart.test.ts
git commit -m "feat: persist field history across restarts"
```

---

### Task 8: Local browser Porch surface

**Files:**
- Create: `src/server/app.ts`
- Create: `src/server/routes.ts`
- Create: `public/index.html`
- Create: `public/app.js`
- Create: `public/styles.css`
- Create: `tests/integration/first-bell-browser-contract.test.ts`

**Interfaces:**
- Consumes: persisted event log and First Bell action dispatcher.
- Produces HTTP endpoints:
  - `GET /api/state`
  - `POST /api/action`
  - `GET /api/history`
  - static files under `/`

- [ ] **Step 1: Write failing HTTP contract tests**

Start server on ephemeral loopback port.

Assert:
- `GET /api/state` exposes separate `surface` and `resonance` keys;
- initial browser state does not expose a fake Bell source;
- `POST /api/action` accepts only named declared actions, not arbitrary code/command payload;
- impossible action returns 409 with a machine-readable reason;
- missed-secret route remains valid;
- browser state after restart is reconstructed from event log;
- no endpoint allows editing prior events.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/integration/first-bell-browser-contract.test.ts
```

- [ ] **Step 3: Implement tiny loopback HTTP server**

Bind `127.0.0.1` by default.

`POST /api/action` payload:

```json
{
  "action": "SET_OUT_CHAIR"
}
```

No browser-supplied shell command, file path, JavaScript expression, receipt ID override, event ID override, or arbitrary object mutation is accepted.

- [ ] **Step 4: Implement browser presentation**

The UI must visibly contain two modes:
- **SURFACE**
- **RESONANCE**

Initial SURFACE copy should be mundane and sparse:
- Porch title;
- current ordinary objective;
- inspectable chair/cable/water/door objects;
- attendance rail;
- Charge/capacity affordances without gamified moral scoring.

RESONANCE should be unavailable/quiet until lawfully reachable.

Secrets are not auto-highlighted.

- [ ] **Step 5: Run suite/typecheck/build and commit**

```bash
npm test
npm run typecheck
npm run build
git add src/server public tests/integration
git commit -m "feat: inhabit the porch in a local browser"
```

---

### Task 9: Deterministic CLI specimen and checked-in receipts

**Files:**
- Create: `src/cli/first-bell.ts`
- Create: `fixtures/first-bell/expected-receipts.json`
- Create: `docs/protocol/static-field-runtime-v01.md`
- Create: `docs/protocol/first-bell-001.md`
- Create: `README.md`

**Interfaces:**
- Consumes: complete headless runtime.
- Produces output directory:
  - `history.jsonl`
  - `surface.json`
  - `resonance.json`
  - `attendance-receipt.json`
  - `bell-1-receipt.json`
  - `bell-2-receipt.json`
  - `resonance-relation-receipt.json`
  - `first-bell-play-receipt.json`

- [ ] **Step 1: Add deterministic CLI test behavior to story tests**

Use fixed participant IDs and fixed timestamps in the specimen.

Assert same specimen run twice yields identical canonical receipt hashes.

- [ ] **Step 2: Implement CLI**

Command:

```bash
npm run build
npm run demo:first-bell -- --out ./out/first-bell
```

The CLI must not contain story rules; it calls the same dispatcher used by the server.

- [ ] **Step 3: Freeze expected receipt hashes**

Write canonical IDs into `fixtures/first-bell/expected-receipts.json`.

- [ ] **Step 4: Write protocol docs**

`static-field-runtime-v01.md` explains:
- event history;
- Surface projection;
- Resonance projection;
- authority boundary;
- persistence.

`first-bell-001.md` explains:
- normal path;
- missed-secret path;
- unresolved Bell source;
- ending knock;
- persisted continuation.

- [ ] **Step 5: Write README**

README must clearly state:
- what STATIC FIELD is;
- what WORLDSEED-001 proves;
- how to test;
- how to run CLI specimen;
- how to run local browser;
- what it does not prove;
- neighboring-system boundaries.

- [ ] **Step 6: Run suite/typecheck/build/CLI and commit**

```bash
npm test
npm run typecheck
npm run build
rm -rf out/first-bell
npm run demo:first-bell -- --out ./out/first-bell
test -f out/first-bell/first-bell-play-receipt.json
```

Expected: all commands exit 0.

```bash
git add src/cli fixtures docs/protocol README.md
git commit -m "feat: close STATIC-FIELD-FIRST-BELL-001"
```

---

### Task 10: Constitutional audit and repeatability proof

**Files:**
- Modify only files required by verified findings.
- Test: full suite.

**Interfaces:**
- Consumes: complete implementation.
- Produces: no new gameplay surface.

- [ ] **Step 1: Search for authority/promotion violations**

Run:

```bash
grep -RniE 'prophecy confirmed|divine approval|bell source resolved|dream proves|model witnessed|automatic gate authority|player level' src public docs README.md || true
```

Review every match manually.

- [ ] **Step 2: Search deterministic kernel for hidden nondeterminism/effects**

```bash
grep -RniE 'Date\.now|Math\.random|child_process|exec\(|spawn\(|fetch\(' src/kernel src/world src/first-bell || true
```

Expected: no hidden nondeterminism in canonical runtime.

- [ ] **Step 3: Run full verification**

```bash
npm test
npm run typecheck
npm run build
```

Expected: all green.

- [ ] **Step 4: Double-run the specimen**

```bash
rm -rf out/run-a out/run-b
npm run demo:first-bell -- --out out/run-a
npm run demo:first-bell -- --out out/run-b
find out/run-a -type f -print0 | sort -z | xargs -0 sha256sum > /tmp/run-a.sha
find out/run-b -type f -print0 | sort -z | xargs -0 sha256sum > /tmp/run-b.sha
```

Compare corresponding file hashes after normalizing directory prefixes.

Expected: deterministic specimen artifacts match byte-for-byte.

- [ ] **Step 5: Manually verify weird-particular invariants**

Confirm:
- Porch remains mundane at first;
- Resonance can become strange;
- Bell source remains unresolved;
- player can miss the clue;
- Surface and Resonance remain separate;
- absence remains representable;
- prayer/care do not produce moral rank;
- Gate remains detected/unknown, not open;
- Knock is an occurrence, not interpretation;
- restart preserves history;
- world remains changed after play closes;
- no neighboring repository's authority was reimplemented silently.

- [ ] **Step 6: Commit audit corrections if necessary**

If corrections are required:

```bash
git add -A
git commit -m "fix: preserve static-field constitutional boundaries"
```

Do not create an empty commit if no correction is required.

---

## Plan self-review result

### Spec coverage

Implemented in this crater:
- one STATIC FIELD region: THE PORCH;
- ordinary Surface Map;
- separate Resonance Map;
- append-only occurrences;
- attendance;
- derived Field Depth;
- basic Charge/capacity verbs;
- absence representation;
- ordinary preparation actions;
- Bell One;
- Bell Two;
- optional clue notice;
- missed-secret valid outcome;
- relation tracing without meaning promotion;
- unresolved Bell source;
- detectable but unopened Gate residue;
- ending Knock;
- persistent world state;
- deterministic receipts;
- local browser inhabitance;
- deterministic CLI proof.

Represented in contracts but intentionally not fully generalized:
- Parish topology;
- Traveling Party beyond the first fixture;
- Point Character switching;
- WALK/SUMMON/LEAP/COLLISION;
- full knowledge-inventory UX;
- multiple event local charts;
- arbitrary World/Gate contracts.

Explicitly deferred per the design:
- giant open world;
- every album as geography;
- MMO networking;
- combat;
- economy;
- generalized NPC AI;
- omniscient model memory;
- live Band Runtime/Static Live/PostEmahh'n adapters;
- Upper Room Crossing;
- Dogram runtime integration;
- persistent geolocation;
- dream interpretation engine;
- full Paula world;
- card marketplace.

### Placeholder scan

No placeholder markers, deferred implementation stubs, or unspecified edge-case instructions are permitted. Every task names exact files, interfaces, failing behaviors, commands, expected results, and commit boundary.

### Type consistency

The plan consistently uses:
- `WorldEvent` as immutable historical occurrence;
- `WorldProjection` as derived Surface/Resonance/party/story state;
- `PorchSurfaceState` for local physical facts;
- `ResonanceRelation` for non-promoting relationships;
- `FirstBellStoryState` for story progression;
- `GateDescriptor` for detected/opening state;
- `FileEventLog` for JSONL persistence.

No browser structure is used as canonical receipt identity.

### Review Focus coverage

Each Review Focus risk has an explicit test:
- Surface/Resonance collapse → Task 4;
- missed clue → Tasks 5 and 8;
- duplicate actions → Task 3;
- unresolved-source coercion → Task 5;
- restart drift → Task 7.

### Execution recommendation

Use **native execution** unless a real subagent-spawn tool becomes available. The ten tasks are strongly sequential around one event model, so preserving one implementation context is efficient; TDD plus the final constitutional audit provides the gate. If true subagents are available, subagent-driven is preferable for Tasks 4, 5, 7, 8, and 10 because they carry the highest semantic risk.
