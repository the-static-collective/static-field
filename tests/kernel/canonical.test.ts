import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize, sha256Canonical, stableId } from "../../src/kernel/canonical.js";

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

test("non-finite numbers and undefined are rejected", () => {
  assert.throws(() => canonicalize({ n: Number.NaN as never }));
  assert.throws(() => canonicalize({ n: undefined as never }));
});

test("stable ids are deterministic and namespaced", () => {
  assert.equal(stableId("bell", { n: 1 }), stableId("bell", { n: 1 }));
  assert.notEqual(stableId("bell", { n: 1 }), stableId("knock", { n: 1 }));
});
