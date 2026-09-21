import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {canonicalize} from "../kernel/canonical.js";
import {makeEvent} from "../kernel/events.js";
import type {WorldEvent} from "../kernel/types.js";
import {dispatchSourceCrossing,sourceGateOfferReceipt,sourceDepartureReceipt} from "../crossing/source.js";

function option(name:string):string|undefined{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:undefined;}
const phase=option("--phase"),from=option("--from"),out=option("--out"),packetPath=option("--packet");
if(!from||!out||!["offer","depart"].includes(phase??""))throw new Error("usage: --phase offer|depart --from <native export dir> --out <new output dir> [--packet destination-packet.json] [--at ISO]");
if(resolve(from)===resolve(out))throw new Error("source output directory must differ from input");
const raw=await readFile(resolve(from,"history.jsonl"),"utf8");
const history=(raw.trim().split("\n").map(line=>JSON.parse(line))) as WorldEvent[];
if(history.length<1||history.length>256)throw new Error("SOURCE_HISTORY_COUNT");
let previous:string|undefined;
for(const event of history){
 const validated=makeEvent({kind:event.kind,occurredAt:event.occurredAt,actor:event.actor,evidenceClass:event.evidenceClass,sourceStatus:event.sourceStatus,payload:event.payload,parentEventIds:event.parentEventIds});
 if(validated.eventId!==event.eventId)throw new Error("SOURCE_EVENT_ID_INVALID");
 if(canonicalize(event.parentEventIds)!==canonicalize(previous?[previous]:[]))throw new Error("SOURCE_PARENT_CHAIN_INVALID");
 previous=event.eventId;
}
const player=history.find(event=>event.kind==="PORCH_ARRIVAL")?.actor;
if(!player||player.kind!=="human")throw new Error("SOURCE_PLAYER_REQUIRED");
const at=option("--at")??new Date().toISOString();
let next:readonly WorldEvent[];
if(phase==="offer"){
 next=dispatchSourceCrossing(history,{kind:"OFFER",actor:player,at});
}else{
 if(!packetPath)throw new Error("DESTINATION_PACKET_REQUIRED");
 const packet=JSON.parse(await readFile(resolve(packetPath),"utf8")) as {admission:Record<string,unknown>;confirmation:Record<string,unknown>};
 next=dispatchSourceCrossing(history,{kind:"DEPART",actor:player,at,admission:packet.admission as never,confirmation:packet.confirmation as never});
}
await mkdir(resolve(out),{recursive:true});
const names=["first-bell-play-receipt.json","porch-arrival-receipt.json","bell-1-receipt.json","bell-2-receipt.json","resonance-relation-receipt.json"];
for(const name of names){try{const bytes=await readFile(resolve(from,name));await writeFile(resolve(out,name),bytes);}catch(error){if(name!=="resonance-relation-receipt.json")throw error;}}
await writeFile(resolve(out,"history.jsonl"),next.map(event=>canonicalize(event)).join("\n")+"\n","utf8");
const offer=sourceGateOfferReceipt(next),departure=sourceDepartureReceipt(next);
if(!offer)throw new Error("SOURCE_OFFER_MISSING");
await writeFile(resolve(out,"source-offer.json"),canonicalize(offer)+"\n","utf8");
if(departure)await writeFile(resolve(out,"source-departure.json"),canonicalize(departure)+"\n","utf8");
process.stdout.write(`${phase}: ${next.at(-1)?.eventId} -> ${out}\n`);
