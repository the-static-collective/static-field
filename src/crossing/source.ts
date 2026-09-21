import { createHash } from "node:crypto";
import { canonicalize } from "../kernel/canonical.js";
import { makeEvent, appendEvent } from "../kernel/events.js";
import { firstBellPlayReceipt } from "../first-bell/receipts.js";
import { deriveFirstBellStory } from "../first-bell/story.js";
import { deriveDetectableGates } from "../world/gates.js";
import type { WorldEvent, ParticipantRef } from "../kernel/types.js";
import { stableId } from "../kernel/canonical.js";

export const FOREIGN_ROOM = "foreign-room-seed-001";
export const SOURCE_WORLD = "static-field/worldseed-001";
export type SourceCrossingAction =
  | {readonly kind:"OFFER"; readonly actor:ParticipantRef; readonly at:string}
  | {readonly kind:"DEPART"; readonly actor:ParticipantRef; readonly at:string; readonly admission:ForeignReceipt;readonly confirmation:ForeignReceipt};
export interface ForeignReceipt { readonly receiptId:string; readonly [key:string]:unknown }

const requireValid = (condition:unknown,code:string):void=>{if(!condition)throw new Error(code);};
const hashForeign=(ns:string,record:unknown)=>`sha256:${createHash("sha256").update(`${ns}\n${canonicalize(record)}`).digest("hex")}`;
const nativeReceipt=(receiptType:string,event:WorldEvent)=>{const body={receiptType,eventId:event.eventId,sourceStatus:event.sourceStatus};return {...body,receiptId:stableId("receipt",body)};};
function validateForeign(receipt:ForeignReceipt,namespace:string):void{
 requireValid(receipt&&typeof receipt==="object"&&typeof receipt.receiptId==="string","FOREIGN_RECEIPT_REQUIRED");
 const {receiptId,...body}=receipt;
 requireValid(hashForeign(namespace,body)===receiptId,"FOREIGN_RECEIPT_INTEGRITY");
}
function sourceActor(history:readonly WorldEvent[],actor:ParticipantRef):void{
 const arrival=history.find(e=>e.kind==="PORCH_ARRIVAL");
 requireValid(actor.kind==="human"&&arrival?.actor.kind==="human"&&actor.id===arrival.actor.id,"SOURCE_HUMAN_REQUIRED");
}
function lastParent(history:readonly WorldEvent[]):readonly string[]{return history.length?[history[history.length-1]!.eventId]:[];}
function sourceOffer(history:readonly WorldEvent[]):WorldEvent|undefined{return history.find(e=>e.kind==="GATE_OPEN_OFFERED");}
export function sourceGateOfferReceipt(history:readonly WorldEvent[]){
 const offered=sourceOffer(history);return offered?nativeReceipt("SourceGateOfferReceipt",offered):undefined;
}
export function sourceDepartureReceipt(history:readonly WorldEvent[]){
 const departed=history.find(e=>e.kind==="PORCH_DEPARTED");
 return departed?nativeReceipt("SourceDepartureReceipt",departed):undefined;
}
export function dispatchSourceCrossing(history:readonly WorldEvent[],action:SourceCrossingAction):readonly WorldEvent[]{
 sourceActor(history,action.actor);
 requireValid(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(action.at)&&Number.isFinite(Date.parse(action.at)),"SOURCE_TIME_INVALID");
 requireValid(!history.length||action.at>=history[history.length-1]!.occurredAt,"SOURCE_TIME_REVERSAL");
 const story=deriveFirstBellStory(history),play=firstBellPlayReceipt(history);
 requireValid(story.status==="closed"&&story.relationTraced&&play?.relationTraced===true,"SOURCE_TRACED_CLOSED_PLAY_REQUIRED");
 requireValid(!history.some(e=>e.kind==="PORCH_DEPARTED"),"SOURCE_ALREADY_DEPARTED");
 if(action.kind==="OFFER"){
  requireValid(!sourceOffer(history),"SOURCE_ALREADY_OFFERED");
  const gate=deriveDetectableGates(history)[0];
  requireValid(gate?.status==="detected"&&!gate.authorized,"SOURCE_GATE_NOT_DETECTED");
  const event=makeEvent({
   kind:"GATE_OPEN_OFFERED",actor:action.actor,occurredAt:action.at,
   evidenceClass:"observed",sourceStatus:"unresolved",parentEventIds:lastParent(history),
   payload:{gateId:gate!.gateId,sourcePlayReceiptRef:play!.receiptId,sourceWorldRef:SOURCE_WORLD,
    destinationWorldRef:FOREIGN_ROOM,scope:"fictional-local-crossing",authorizedDestination:false},
  });
  return appendEvent(history,event);
 }
 const offer=sourceOffer(history),offerReceipt=sourceGateOfferReceipt(history);
 requireValid(offer&&offerReceipt,"SOURCE_OFFER_REQUIRED");
 const admission=action.admission,confirmation=action.confirmation;
 validateForeign(admission,"origin-live-admission-v01");
 validateForeign(confirmation,"origin-live-confirmation-v01");
 requireValid(admission.receiptType==="LiveDestinationAdmissionReceipt"&&admission.sourceOfferRef===offerReceipt!.receiptId
  &&admission.sourceWorldRef===SOURCE_WORLD&&admission.destinationWorldRef===FOREIGN_ROOM
  &&typeof admission.bundleRef==="string"&&admission.disposition==="ADMIT_SCOPED","DESTINATION_ADMISSION_REQUIRED");
 requireValid(confirmation.receiptType==="LivePartyConfirmationReceipt"&&confirmation.explicitChoice===true
  &&confirmation.actorRef===action.actor.id&&confirmation.sourceOfferRef===offerReceipt!.receiptId
  &&confirmation.admissionRef===admission.receiptId&&confirmation.bundleRef===admission.bundleRef
  &&confirmation.destinationWorldRef===FOREIGN_ROOM,"HUMAN_CONFIRMATION_REQUIRED");
 requireValid(typeof confirmation.at==="string"&&action.at>=(confirmation.at as string),"DEPARTURE_PRECEDES_CONFIRMATION");
 const event=makeEvent({
  kind:"PORCH_DEPARTED",actor:action.actor,occurredAt:action.at,
  evidenceClass:"observed",sourceStatus:"unresolved",parentEventIds:lastParent(history),
  payload:{sourceOfferRef:offerReceipt!.receiptId,sourcePlayReceiptRef:play!.receiptId,
   admissionRef:admission.receiptId,confirmationRef:confirmation.receiptId,
   bundleRef:admission.bundleRef as string,destinationWorldRef:FOREIGN_ROOM,
   bellSourceStatus:"unresolved",sourceDoesNotAssertArrival:true},
 });
 return appendEvent(history,event);
}
