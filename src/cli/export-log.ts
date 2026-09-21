// Export a played local browser Porch without rewriting its event log.
// Run after closing First Bell and stopping the source server.
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {FileEventLog} from "../persistence/event-log.js";
import {canonicalize} from "../kernel/canonical.js";
import {firstBellPlayReceipt,porchArrivalReceipt,bellReceipt,resonanceRelationReceipt} from "../first-bell/receipts.js";
import {deriveFirstBellStory} from "../first-bell/story.js";

function option(name:string):string|undefined{const at=process.argv.indexOf(name);return at>=0?process.argv[at+1]:undefined;}
const logPath=option("--log")??"var/static-field/history.jsonl",out=option("--out");
if(!out)throw new Error("usage: --log <local Porch event-log JSONL> --out <new export dir>");
const history=await new FileEventLog(resolve(logPath)).loadHistory();
if(!history.length||history.length>256)throw new Error("EXPORT_HISTORY_SIZE_INVALID");
let prev:string|undefined,at="";
for(const event of history){
 if(canonicalize(event.parentEventIds)!==canonicalize(prev?[prev]:[]))throw new Error("EXPORT_PARENT_CHAIN_INVALID");
 if(event.occurredAt<at)throw new Error("EXPORT_TIME_REVERSAL");
 prev=event.eventId;at=event.occurredAt;
}
const story=deriveFirstBellStory(history);
if(story.status!=="closed"||history.at(-1)?.kind!=="FIRST_BELL_PLAY_CLOSED")throw new Error("FINISH_FIRST_BELL_BEFORE_EXPORT");
const play=firstBellPlayReceipt(history),arrival=porchArrivalReceipt(history),first=bellReceipt(history,1),second=bellReceipt(history,2);
if(!play||!arrival||!first||!second)throw new Error("SOURCE_PLAY_INCOMPLETE");
const artifacts:Record<string,unknown>={
 "first-bell-play-receipt.json":play,"porch-arrival-receipt.json":arrival,
 "bell-1-receipt.json":first,"bell-2-receipt.json":second,
};
const relation=resonanceRelationReceipt(history);
if(relation)artifacts["resonance-relation-receipt.json"]=relation;
await mkdir(resolve(out),{recursive:true});
await writeFile(resolve(out,"history.jsonl"),history.map(event=>canonicalize(event)).join("\n")+"\n","utf8");
for(const [name,value] of Object.entries(artifacts))await writeFile(resolve(out,name),canonicalize(value)+"\n","utf8");
process.stdout.write(`exported native local Porch ${play.receiptId} -> ${out}\n`);
