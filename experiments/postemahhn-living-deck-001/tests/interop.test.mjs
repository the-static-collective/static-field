import test from "node:test";
import assert from "node:assert/strict";
import { prepareHandoff, evaluateHandoff, DESIGN_SOURCE } from "../interop.mjs";

const selection = { firstId: "cicada", secondId: "radio", stickerId: "echo" };
const digest = "a".repeat(64);
const sourceCardVerifier = async ({ requestedCardRef }) => ({
  ok: true, sourceOwned: true, kind: "card", subjectRef: requestedCardRef,
  scope: "composition-input", receiptRef: `test-stub:${requestedCardRef}`, digest,
});
const sourceStickerVerifier = async ({ requestedStickerRef }) => ({
  ok: true, sourceOwned: true, kind: "sticker", subjectRef: requestedStickerRef,
  scope: "composition-input", receiptRef: `test-stub:${requestedStickerRef}`, digest,
});
const fullMeasurePort = async ({ fingerprint }) => ({
  destination: "full-measure", fingerprint, disposition: "admitted", receiptRef: "test-stub:fm:1",
});
const roomPort = async ({ fingerprint, fullMeasureReceiptRef }) => ({
  destination: "roroomom", fingerprint,
  disposition: fullMeasureReceiptRef === "test-stub:fm:1" ? "admitted" : "refused",
  receiptRef: "test-stub:room:1",
});
const ports = { sourceCardVerifier, sourceStickerVerifier, fullMeasurePort, roomPort };
const prep = () => prepareHandoff(selection);
const clone = x => JSON.parse(JSON.stringify(x));

test("design-backed seed is a real pinned design document, never an issued card or sticker", () => {
  assert.equal(DESIGN_SOURCE.sourceCardTitle, "RECEIVE // G0");
  assert.equal(DESIGN_SOURCE.commit.length, 40);
  assert.equal(DESIGN_SOURCE.proofOfPhysicalCard, false);
  assert.equal(DESIGN_SOURCE.proofOfStickerIssuance, false);
  assert.equal(prep().input.sourceCardReceipts, null);
  assert.equal(prep().input.sourceStickerReceipt, null);
});
test("prepare yields deterministic and interoperably shaped proposals without making a real project", () => {
  const a = prep(), b = prep();
  assert.equal(a.disposition, "prepared");
  assert.equal(a.fingerprint.length, 64);
  assert.equal(a.fingerprint, b.fingerprint);
  assert.deepEqual(a.input.cardRefs, ["fixture:cicada", "fixture:radio"]);
  assert.equal(a.projectDraft.status, "proposal");
  assert.equal(a.projectDraft.notAProjectRecord, true);
  assert.equal(a.roomCapsule.format, "static-room-source-handoff");
  assert.match(a.roomCapsule.boundary, /Not a ROroomOM snapshot/);
  assert.equal(a.grantedAuthority, "none");
});
test("invalid or incompatible deck combinations refuse before creating a handoff", () => {
  assert.equal(prepareHandoff({ firstId: "cicada", secondId: "cicada", stickerId: "echo" }).disposition, "refused");
  assert.equal(prepareHandoff({ firstId: "radio", secondId: "cicada", stickerId: "echo" }).disposition, "refused");
  assert.equal(prepareHandoff({ firstId: "nonexistent", secondId: "radio", stickerId: "echo" }).disposition, "refused");
});
test("absence of human approval or real ports is a hold, never success", async () => {
  assert.equal((await evaluateHandoff(prep(), ports)).reason, "explicit-human-approval-required");
  assert.equal((await evaluateHandoff(prep(), { humanApproval: true })).reason, "source-and-destination-adapters-not-connected");
});
test("JSON that self-declares a valid card or alters a quest is rejected", async () => {
  const fake = clone(prep());fake.input.sourceCardReceipts = [{verified:true}];
  assert.equal((await evaluateHandoff(fake, { ...ports, humanApproval: true })).reason, "tampered-preparation");
  const fake2 = clone(prep());fake2.projectDraft.story = "FORGED";
  assert.equal((await evaluateHandoff(fake2, { ...ports, humanApproval: true })).reason, "tampered-preparation");
  const fake3 = clone(prep());fake3.roomCapsule.sourceEvidence.actualIssuedCardProof = { verified:true };
  assert.equal((await evaluateHandoff(fake3, { ...ports, humanApproval: true })).reason, "tampered-preparation");
});
test("unsupported proof / forged subject / sticker proof missing all hold before contacting destination", async () => {
  let called = 0;
  const fm = async () => { called++;return fullMeasurePort(...arguments) };
  const invalid = async ({ requestedCardRef }) => ({
    ok:true, sourceOwned:true,kind:"card",subjectRef:requestedCardRef,
    scope:"composition-input",receiptRef:"stub:card:1", digest:"wrong"
  });
  let res = await evaluateHandoff(prep(), { ...ports, sourceCardVerifier:invalid, fullMeasurePort:fm,humanApproval:true });
  assert.equal(res.reason,"source-card-proof-unavailable");
  res = await evaluateHandoff(prep(), { ...ports, sourceStickerVerifier:async()=>({ok:true}),fullMeasurePort:fm,humanApproval:true });
  assert.equal(res.reason,"source-sticker-proof-unavailable");
  assert.equal(called,0);
});
test("Full Measure hold and refusal never invoke ROroomOM", async () => {
  let calls=0;
  for(const d of ["held","refused"]){
    const res = await evaluateHandoff(prep(),{
      ...ports,humanApproval:true,
      fullMeasurePort:async({fingerprint})=>({destination:"full-measure",fingerprint,disposition:d,receiptRef:"test:fm"}),
      roomPort:async()=>{calls++;throw Error("room must not run");}
    });
    assert.equal(res.disposition,d);
    assert.equal(res.reason,"full-measure-destination-decision");
  }
  assert.equal(calls,0);
});
test("ROroomOM refusal is distinct from Full Measure admission; no world event",async()=>{
  const res=await evaluateHandoff(prep(),{...ports,humanApproval:true,
    roomPort:async({fingerprint})=>({destination:"roroomom",fingerprint,disposition:"refused",receiptRef:"test:room"})
  });
  assert.equal(res.disposition,"refused");
  assert.equal(res.fullMeasure.disposition,"admitted");
  assert.equal(res.roroomom.disposition,"refused");
});
test("a supplied trusted-adapter STUB can demonstrate a double admission but not real proof",async()=>{
  const res=await evaluateHandoff(prep(),{...ports,humanApproval:true});
  assert.equal(res.disposition,"admitted");
  assert.equal(res.fullMeasure.receiptRef,"test-stub:fm:1");
  assert.equal(res.roroomom.receiptRef,"test-stub:room:1");
  assert.equal(res.emittedStaticFieldEvent,false);
  assert.equal(res.externalPublication,false);
});
test("indeterminate ports and mismatched destination receipt refuse success",async()=>{
  let res=await evaluateHandoff(prep(),{...ports,humanApproval:true,fullMeasurePort:async()=>{throw Error("network ambiguity")}});
  assert.equal(res.reason,"full-measure-outcome-indeterminate");
  res=await evaluateHandoff(prep(),{...ports,humanApproval:true,
    fullMeasurePort:async()=>({destination:"full-measure",fingerprint:"wrong",disposition:"admitted",receiptRef:"test:fm"})
  });
  assert.equal(res.reason,"full-measure-disposition-invalid");
  res=await evaluateHandoff(prep(),{...ports,humanApproval:true,roomPort:async()=>{throw Error("room unavailable")}});
  assert.equal(res.reason,"roroomom-outcome-indeterminate");
});
