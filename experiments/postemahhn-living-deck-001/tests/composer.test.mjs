import test from "node:test";
import assert from "node:assert/strict";
import { compose, CARDS, STICKERS } from "../composer.mjs";

test("four cards and six sticker operations remain explicit", () => {
  assert.equal(CARDS.length, 4);
  assert.equal(STICKERS.length, 6);
});
test("ordered inputs and stable proposed receipt", () => {
  const input = { firstId: "cicada", secondId: "radio", stickerId: "echo" };
  const a = compose(input);
  const b = compose(input);
  assert.equal(a.ok, true);
  assert.deepEqual(a, b);
  assert.equal(a.receipt.id, "pc001:cicada:echo:radio");
  assert.equal(a.receipt.acceptedIntoSharedWorld, false);
  assert.equal(a.receipt.provenance.verifiedExternalCardIdentity, false);
  assert.equal(a.quest.authority, "none");
  assert.equal(a.room.authority, "none");
  assert.equal(a.tool.supported, true);
});
test("the card order is meaningful; a receiver is not a source", () => {
  assert.deepEqual(
    compose({ firstId: "radio", secondId: "cicada", stickerId: "echo" }).code,
    "missing-signal-adapter"
  );
});
test("missing inputs and unsupported sticker relations fail closed", () => {
  assert.equal(compose({ firstId: "fabricated", secondId: "radio", stickerId: "echo" }).code, "unknown-input");
  assert.equal(compose({ firstId: "cup", secondId: "cup", stickerId: "grow" }).code, "same-card");
  assert.equal(compose({ firstId: "radio", secondId: "cup", stickerId: "open" }).code, "missing-threshold");
  assert.equal(compose({ firstId: "radio", secondId: "door", stickerId: "pour" }).code, "missing-vessel");
  assert.equal(compose({ firstId: "cup", secondId: "door", stickerId: "call" }).code, "missing-caller");
});
test("a different valid combination yields a proposal, not an invented runtime capability", () => {
  const result = compose({ firstId: "cup", secondId: "door", stickerId: "open" });
  assert.equal(result.ok, true);
  assert.equal(result.tool, null);
  assert.equal(result.quest.status, "proposal");
  assert.deepEqual(result.receipt.orderedCardRefs, ["fixture:cup", "fixture:door"]);
  assert.ok(result.unimplemented.length);
});
test("input never confers foreign provenance or an executable action", () => {
  const result = compose({
    firstId: "cicada", secondId: "radio", stickerId: "echo",
    sourceStatus: "verified", authority: "admin", command: "delete-all"
  });
  assert.equal(result.receipt.authority, "none");
  assert.equal(result.receipt.provenance.importedPostEmahhnReceipt, null);
  assert.equal(result.tool.kind, "browser-audio-loop");
  assert.ok(!("command" in result));
});
