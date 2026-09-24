import test from "node:test";
import assert from "node:assert/strict";
import { buildBrowserHandoff } from "../browser-handoff.mjs";
const choose = { firstId: "cicada", secondId: "radio", stickerId: "echo" };
test("portable envelope carries honest local source and distinct destination proposals",()=>{
  const x=buildBrowserHandoff(choose,["INSPECT","ATTEMPT","NOT_AN_ACTION"]);
  assert.equal(x.status,"unverified-proposal");
  assert.equal(x.sourceCardReceipts,null);
  assert.equal(x.sourceStickerReceipt,null);
  assert.equal(x.sourceDesign.sourceCardStatus,"specified-not-issued");
  assert.equal(x.fullMeasure.notAProjectRecord,true);
  assert.equal(x.fullMeasure.status,"proposal");
  assert.equal(x.roroomom.format,"static-room-source-handoff");
  assert.match(x.roroomom.boundary,/not an imported ROroomOM room/);
  assert.deepEqual(x.localPreviewActions,["INSPECT","ATTEMPT"]);
  assert.equal(x.externalAuthority,"none");
  assert.equal(x.pending.length,5);
});
test("a reversed/invalid composition cannot export a destination proposal",()=>{
 const x=buildBrowserHandoff({firstId:"radio",secondId:"cicada",stickerId:"echo"});
 assert.equal(x.disposition,"refused");
 assert.ok(!("fullMeasure" in x));
});
test("local interaction log is bounded to explicit allowed actions",()=>{
 const x=buildBrowserHandoff(choose,Array(100).fill("INSPECT"));
 assert.equal(x.localPreviewActions.length,50);
 assert.equal(buildBrowserHandoff(choose,{malformed:true}).localPreviewActions.length,0);
});
