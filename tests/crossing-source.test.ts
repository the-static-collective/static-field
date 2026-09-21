import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalize} from "../src/kernel/canonical.js";
import {dispatchFirstBellAction} from "../src/first-bell/reducer.js";
import {dispatchSourceCrossing,sourceGateOfferReceipt,sourceDepartureReceipt} from "../src/crossing/source.js";
import type {WorldEvent} from "../src/kernel/types.js";
const actor={kind:"human" as const,id:"human/specimen"};
function play(withClue=true):readonly WorldEvent[]{
 let h:readonly WorldEvent[]=[];
 const sequence=["ENTER_PORCH","BELL_1","BELL_2",...(withClue?["NOTICE_OPEN_CORNER","ENTER_RESONANCE","TRACE_PRIOR_RELATION"]:[]),"KNOCK","CLOSE_PLAY"] as const;
 sequence.forEach((type,index)=>{h=dispatchFirstBellAction(h,{type,actor,occurredAt:`2026-09-21T22:${String(index).padStart(2,"0")}:00.000Z`});});
 return h;
}
function foreign(ns:string,body:Record<string,unknown>){return {...body,receiptId:"sha256:"+createHash("sha256").update(ns+"\n"+canonicalize(body)).digest("hex")};}
function packet(offerRef:string){
 const admission=foreign("origin-live-admission-v01",{receiptType:"LiveDestinationAdmissionReceipt",sourceOfferRef:offerRef,sourceWorldRef:"static-field/worldseed-001",destinationWorldRef:"foreign-room-seed-001",bundleRef:"sha256:bundle",disposition:"ADMIT_SCOPED"});
 const confirmation=foreign("origin-live-confirmation-v01",{receiptType:"LivePartyConfirmationReceipt",explicitChoice:true,actorRef:actor.id,sourceOfferRef:offerRef,admissionRef:admission.receiptId,bundleRef:admission.bundleRef,destinationWorldRef:"foreign-room-seed-001",at:"2026-09-21T22:15:00.000Z"});
 return {admission,confirmation};
}
test("closed traced play emits one source-owned offer, without departure",()=>{
 const offered=dispatchSourceCrossing(play(),{kind:"OFFER",actor,at:"2026-09-21T22:13:00.000Z"});
 assert.equal(offered.at(-1)?.kind,"GATE_OPEN_OFFERED");
 assert.ok(sourceGateOfferReceipt(offered)?.receiptId.startsWith("receipt/"));
 assert.equal(sourceDepartureReceipt(offered),undefined);
 assert.equal(offered.at(-1)?.payload && (offered.at(-1)?.payload as Record<string,unknown>).authorizedDestination,false);
});
test("missed clue cannot be used to open gate",()=>assert.throws(()=>dispatchSourceCrossing(play(false),{kind:"OFFER",actor,at:"2026-09-21T22:13:00.000Z"}),/SOURCE_TRACED_CLOSED_PLAY_REQUIRED/));
test("duplicate source offer refused",()=>{const h=dispatchSourceCrossing(play(),{kind:"OFFER",actor,at:"2026-09-21T22:13:00.000Z"});assert.throws(()=>dispatchSourceCrossing(h,{kind:"OFFER",actor,at:"2026-09-21T22:14:00.000Z"}),/SOURCE_ALREADY_OFFERED/);});
test("source departure requires valid destination admission and human confirmation",()=>{
 const offered=dispatchSourceCrossing(play(),{kind:"OFFER",actor,at:"2026-09-21T22:13:00.000Z"});
 const p=packet(sourceGateOfferReceipt(offered)!.receiptId);
 const departed=dispatchSourceCrossing(offered,{kind:"DEPART",actor,at:"2026-09-21T22:16:00.000Z",...p});
 assert.equal(departed.at(-1)?.kind,"PORCH_DEPARTED");
 assert.ok(sourceDepartureReceipt(departed)?.receiptId.startsWith("receipt/"));
 assert.equal((departed.at(-1)!.payload as Record<string,unknown>).sourceDoesNotAssertArrival,true);
});
test("foreign receipt tampering and alternate actor confirmation refused",()=>{
 const offered=dispatchSourceCrossing(play(),{kind:"OFFER",actor,at:"2026-09-21T22:13:00.000Z"});
 const p=packet(sourceGateOfferReceipt(offered)!.receiptId);
 assert.throws(()=>dispatchSourceCrossing(offered,{kind:"DEPART",actor,at:"2026-09-21T22:16:00.000Z",admission:{...p.admission,bundleRef:"changed"},confirmation:p.confirmation}),/FOREIGN_RECEIPT_INTEGRITY/);
 const other=packet(sourceGateOfferReceipt(offered)!.receiptId);other.confirmation.actorRef="human/other";
 assert.throws(()=>dispatchSourceCrossing(offered,{kind:"DEPART",actor,at:"2026-09-21T22:16:00.000Z",...other}),/FOREIGN_RECEIPT_INTEGRITY/);
});
test("source departure is once-only",()=>{
 const offered=dispatchSourceCrossing(play(),{kind:"OFFER",actor,at:"2026-09-21T22:13:00.000Z"}),p=packet(sourceGateOfferReceipt(offered)!.receiptId);
 const departed=dispatchSourceCrossing(offered,{kind:"DEPART",actor,at:"2026-09-21T22:16:00.000Z",...p});
 assert.throws(()=>dispatchSourceCrossing(departed,{kind:"DEPART",actor,at:"2026-09-21T22:17:00.000Z",...p}),/SOURCE_ALREADY_DEPARTED/);
});
