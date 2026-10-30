// STATIC FIELD: EXPANSION FORGE 009 — source-bound cooperative expansion candidates.
// A synthetic party-record is UNVERIFIED data, not a source signature, human event or real authorization.
import {makeGame,step as railwayStep,offer as railwayOffer,LINKS,exportRecord as railwayExport} from '../little-yes-field-008/rail/game.mjs';

export const FORGE_VERSION='static-field.expansion-forge/009';
export const RECORD_SCHEMA='static-field.expansion-proposal/009';
const copy=x=>JSON.parse(JSON.stringify(x));
const err=(code)=>{throw Error(code)};
const ensure=(p,c)=>{if(!p)err(c)};
const string=(x,max=160)=>typeof x==='string'&&x.length>0&&x.length<=max;
const allowedTypes=new Set(['START','ROUND','GATHER','AGREE','BUILD','CRAFT','SHIP','AUDIT']);
const relicTypes=new Set(['RAIL_TICKET','CRAFT_TOKEN','ARRIVAL_CARD','QUESTION_CARD','COMMONS_EDITION']);
const schemas=['reality2-party-record-v1','THE-EARTH-REMEMBERS-008/party-record'];
const validRoute=id=>LINKS.some(r=>r.id===id);
function sortedCanonical(value){if(Array.isArray(value))return '['+value.map(sortedCanonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+sortedCanonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
function toHex(bytes){return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');}
async function hash(value){
 const data=new TextEncoder().encode(sortedCanonical(value));
 const digest=await globalThis.crypto.subtle.digest('SHA-256',data);
 return 'sha256:'+toHex(new Uint8Array(digest));
}
export function extractRecord(raw){
 ensure(raw&&typeof raw==='object'&&!Array.isArray(raw),'INVALID_RECORD');
 ensure(JSON.stringify(raw).length<180000,'OVERSIZED_RECORD');
 ensure(schemas.includes(raw.schema||raw.format),'UNKNOWN_RECORD_SCHEMA');
 const kingdom=raw.format===schemas[1];
 const rail=kingdom?raw.rail:raw;
 ensure(rail&&rail.schema===schemas[0]&&rail.fictional===true&&rail.authority==='NO_REAL_WORLD_CLAIMS','NOT_FICTIONAL_RAIL_PROOF');
 ensure(Array.isArray(rail.history)&&rail.history.length>=1&&rail.history.length<=140,'INVALID_HISTORY');
 ensure(Array.isArray(rail.relics)&&rail.relics.length<=140,'INVALID_RELICS');
 ensure(rail.board&&Array.isArray(rail.board.built)&&rail.board.built.length<=9,'INVALID_BOARD');
 ensure(rail.board.built.every(validRoute),'INVALID_ROUTE');
 const history=rail.history.map((h,i)=>{
   ensure(h&&allowedTypes.has(h.type)&&string(h.text,500),'INVALID_HISTORY_EVENT');
   return {index:i,type:h.type,text:h.text.slice(0,170)};
 });
 const relics=rail.relics.map((r,i)=>{
   ensure(r&&relicTypes.has(r.type)&&string(r.title,160)&&string(r.id,70),'INVALID_RELIC');
   return {index:i,type:r.type,title:r.title};
 });
 const worker=kingdom?raw.terms:[];
 ensure(!kingdom||Array.isArray(worker)&&worker.length<=10,'INVALID_LABOR_TERMS');
 const terms=(worker||[]).map((w,i)=>{
  ensure(w&&['forest','quarry','fields','workshop','builders','drivers','cleaners'].includes(w.role)&&['NEEDS_TERMS','SCRIPTED_YES','REFUSED'].includes(w.status),'INVALID_LABOR_TERM');
  return {index:i,role:w.role,status:w.status};
 });
 return {format:kingdom?'008':'007',history,relics,terms,built:[...new Set(rail.board.built)].sort(),
  // A ref copied from a browser file is not authenticated evidence, even when the digest matches.
  claim:'SYNTHETIC_PARTY_RECORD_UNVERIFIED',externalAuthority:'NONE'};
}
export function minimizeRecord(raw){
 const summary=extractRecord(raw);
 const rail={schema:'reality2-party-record-v1',fictional:true,authority:'NO_REAL_WORLD_CLAIMS',
  history:summary.history.map(x=>({type:x.type,text:x.text})),
  relics:summary.relics.map(x=>({id:`SYNTHETIC-${x.index+1}`,type:x.type,title:x.title})),
  board:{built:summary.built}};
 return summary.format==='008'?{format:'THE-EARTH-REMEMBERS-008/party-record',rail,
   terms:summary.terms.map(x=>({role:x.role,status:x.status}))}:rail;
}
function eventsOf(summary){
 const events=[];
 for(const h of summary.history){if(['BUILD','CRAFT','SHIP','AUDIT'].includes(h.type))events.push({type:h.type,label:h.text,at:`history:${h.index}`});}
 for(const r of summary.relics){if(['RAIL_TICKET','ARRIVAL_CARD','QUESTION_CARD'].includes(r.type))events.push({type:r.type,label:r.title,at:`relic:${r.index}`});}
 for(const t of summary.terms)events.push({type:t.status==='REFUSED'?'REFUSAL':'LABOR',label:`${t.role}: ${t.status}`,at:`term:${t.index}`});
 return events;
}
const TEMPLATES={
 'SECOND_TRACK':{title:'THE SECOND TRACK',lens:'CONNECTION',subtitle:'Build one link the originating table never built.',goal:'Construct the indicated route on a NEW fictional board.',kind:'route'},
 'HEARTH_CIRCLE':{title:'THE HEARTH CIRCLE',lens:'CARE',subtitle:'Warmth needs both resources and a circle of care.',goal:'Make two firewood tokens and explicitly hold a game-only care circle.',kind:'firewood'},
 'NIGHT_SHIFT':{title:'THE NIGHT SHIFT HAS A VOICE',lens:'DIGNITY',subtitle:'Maintenance becomes a visible dependency, not an invisible person-token.',goal:'Audit the disputed claim, create a blueprint, and hold a game-only listening circle.',kind:'dignity'},
 'LEDGER_DAY':{title:'THE LEDGER DOES NOT LIE',lens:'WITNESS',subtitle:'A disputed count must stay disputed even after reflection.',goal:'Audit 42/39 WOOD, then hold a listening circle that credits zero real stock.',kind:'witness'},
 'GARDEN_ROUTE':{title:'THE GARDEN TAKES THE TRAIN',lens:'NOURISH',subtitle:'Connect the garden to the hearth and keep food available.',goal:'Build Cedar–Hearthside and gather two fictional food tokens.',kind:'garden'},
 'COMMONS_BLUEPRINT':{title:'THE COMMONS BLUEPRINT',lens:'INVENTION',subtitle:'An idea becomes useful only when it names a supported next step.',goal:'Craft a blueprint and build a voluntary game rail connection.',kind:'blueprint'}
};
function newRoute(built){return LINKS.find(x=>!built.includes(x.id) && (x.a==='millford'||x.b==='millford'))?.id||LINKS.find(x=>!built.includes(x.id))?.id||'mb';}
function recipeFor(template,summary){
 if(template==='SECOND_TRACK')return [{type:'RAIL',id:newRoute(summary.built)}];
 if(template==='HEARTH_CIRCLE')return [{type:'RESOURCE',id:'firewood',n:2},{type:'CIRCLE'}];
 if(template==='NIGHT_SHIFT')return [{type:'AUDIT'},{type:'RESOURCE',id:'blueprint',n:1},{type:'CIRCLE'}];
 if(template==='LEDGER_DAY')return [{type:'AUDIT'},{type:'CIRCLE'}];
 if(template==='GARDEN_ROUTE')return [{type:'RAIL',id:'ch'},{type:'RESOURCE',id:'food',n:2}];
 return [{type:'RESOURCE',id:'blueprint',n:1},{type:'RAIL',id:newRoute(summary.built)}];
}
function chooseRecipes(events){
 const map={RAIL_TICKET:'SECOND_TRACK',BUILD:'SECOND_TRACK',CRAFT:'COMMONS_BLUEPRINT',SHIP:'HEARTH_CIRCLE',ARRIVAL_CARD:'GARDEN_ROUTE',AUDIT:'LEDGER_DAY',QUESTION_CARD:'LEDGER_DAY',LABOR:'NIGHT_SHIFT',REFUSAL:'NIGHT_SHIFT'};
 const uniques=[];
 // Newest event is most relevant to the group's last decision; preserve distinct mechanics.
 for(const ev of [...events].reverse()){const template=map[ev.type];if(template&&!uniques.some(x=>x.template===template))uniques.push({template,event:ev});}
 const options=['SECOND_TRACK','NIGHT_SHIFT','COMMONS_BLUEPRINT','LEDGER_DAY','GARDEN_ROUTE','HEARTH_CIRCLE'];
 for(const template of options){if(uniques.length>=3)break;if(!uniques.some(x=>x.template===template))uniques.push({template,event:events.at(-1)});}
 return uniques.slice(0,3);
}
export async function forge(raw){
 const source=extractRecord(raw),events=eventsOf(source);
 if(!events.length)return {status:'HOLD_NO_COMPLETED_GAME_EVENT',needed:'Play a construction, crafting, arrival, audit, or worker-voice event before minting a fictional candidate.',authority:'NONE',candidates:[]};
 const sourceDigest=await hash(source);
 const chosen=chooseRecipes(events);
 const candidates=[];
 for(const {template,event} of chosen){
  const t=TEMPLATES[template];const result={schema:RECORD_SCHEMA,version:FORGE_VERSION,kind:'HELD_GAME_VARIANT',
   template,sourceDigest,sourceSummary:source,seedEvent:event,
   title:t.title,subtitle:t.subtitle,goal:t.goal,lens:t.lens,
   requirements:recipeFor(template,source),
   authority:'NONE',realWorldActionsAuthorized:0,physicalDeeds:0,realWorkerConsents:0,
   acceptance:'REQUIRES_EXPLICIT_LOCAL_PLAYER_SELECTION',
   warnings:['Fictional party record is not authenticated evidence','No automatic import into Static Field canon','No real labor assent or token mint','Digest proves only file integrity, not truth']};
  result.digest=await hash(result);candidates.push(result);
 }
 return {status:'HOLD_PLAYER_CHOICE',sourceDigest,source,candidates,authority:'NONE'};
}
export async function receive(rawCandidate,record,decision='HOLD'){
 if(!['HOLD','ADMIT','REFUSE'].includes(decision))err('INVALID_DECISION');
 if(!rawCandidate||rawCandidate.schema!==RECORD_SCHEMA)return {status:'REFUSE_UNSUPPORTED_PACKET'};
 try{
  const regenerated=await forge(record);
  if(regenerated.status!=='HOLD_PLAYER_CHOICE')return {status:'REFUSE_NO_SOURCE_EVENTS'};
  const exact=regenerated.candidates.find(x=>x.digest===rawCandidate.digest);
  if(!exact||sortedCanonical(exact)!==sortedCanonical(rawCandidate))return {status:'REFUSE_TAMPERED_OR_UNAUTHORIZED_RECIPE'};
  return {status:decision==='ADMIT'?'ADMIT_LOCAL_FICTION_ONLY':decision==='REFUSE'?'REFUSE_PLAYER_CHOICE':'HOLD_PLAYER_CHOICE',candidate:exact,
   localPlayAllowed:decision==='ADMIT',externalAuthority:'NONE',realWorldActionsAuthorized:0};
 }catch{return {status:'REFUSE_INVALID_SOURCE_RECORD'};}
}
export function startVariant(received,size=4){
 ensure(received?.status==='ADMIT_LOCAL_FICTION_ONLY'&&received.candidate?.schema===RECORD_SCHEMA,'NOT_LOCALLY_ADMITTED');
 ensure(Number.isSafeInteger(size)&&size>=2&&size<=6,'BAD_PARTY_SIZE');
 const seed=(parseInt(received.candidate.digest.slice(7,15),16)%2147483645)+1;
 return {format:'static-field.expansion-variant-play/009',candidate:copy(received.candidate),rail:makeGame(size,seed),circleHeld:false,
  localHistory:[{type:'START',text:'A NEW fictional board begins. Prior inventory and authority were not copied.'}],phase:'PLAYING'};
}
export function progress(s){
 const steps=s.candidate.requirements.map(r=>{
  if(r.type==='RAIL')return {...r,done:s.rail.built.includes(r.id)};
  if(r.type==='RESOURCE')return {...r,done:s.rail.resources[r.id]>=r.n};
  if(r.type==='AUDIT')return {...r,done:s.rail.claim.audited};
  if(r.type==='CIRCLE')return {...r,done:s.circleHeld};
  err('UNKNOWN_RECIPE_OPERATION');
 });
 return {steps,complete:steps.every(x=>x.done),sourceEvent:s.candidate.seedEvent,phase:s.rail.phase};
}
export function suggest(s){
 const missing=progress(s).steps.find(x=>!x.done);
 if(!missing)return {title:'Expansion objective complete',reason:'Export a game-only return ticket. No physical achievement is credited.',action:null};
 if(missing.type==='CIRCLE')return {title:'Hold the circle',reason:'Make room for voices at the table; this does not represent outside consent.',action:{kind:'circle'}};
 if(missing.type==='AUDIT')return {title:'Inspect the disputed 42 / 39 WOOD claim',reason:'The difference is never credited as stock.',action:{kind:'rail',move:{kind:'audit'}}};
 if(missing.type==='RAIL'){
  if(!s.rail.consents.includes(missing.id))return {title:'Invite the Little Yes for '+LINKS.find(e=>e.id===missing.id).name,action:{kind:'rail',move:{kind:'agree',id:missing.id}},reason:'Fictional counterparties must agree before a new route is built.'};
  const cost=LINKS.find(e=>e.id===missing.id).cost;
  if(s.rail.resources.rail<cost){
   if(s.rail.resources.wood<1)return {title:'Gather wood',action:{kind:'rail',move:{kind:'gather',id:'millford'}},reason:'Rail crafting needs one wood token.'};
   if(s.rail.resources.ore<1)return {title:'Gather ore',action:{kind:'rail',move:{kind:'gather',id:'bridgeport'}},reason:'Rail crafting needs one ore token.'};
   return {title:'Forge rail',action:{kind:'rail',move:{kind:'craft',id:'rail'}},reason:'Craft source-owned rail tokens.'};
  }
  return {title:'Build the proposed line',action:{kind:'rail',move:{kind:'build',id:missing.id}},reason:'It is now possible inside the fictional model.'};
 }
 if(missing.type==='RESOURCE'){
  if(missing.id==='food')return {title:'Gather from Cedar Junction',action:{kind:'rail',move:{kind:'gather',id:'cedar'}},reason:'Only fictional food tokens.'};
  if(missing.id==='firewood')return s.rail.resources.wood>=1?{title:'Craft firewood',action:{kind:'rail',move:{kind:'craft',id:'firewood'}},reason:'Not physical fuel.'}:{title:'Gather fictional wood',action:{kind:'rail',move:{kind:'gather',id:'millford'}},reason:'No disputed stock is spendable.'};
  if(missing.id==='blueprint'){
   if(s.rail.resources.ore<1)return {title:'Gather ore',action:{kind:'rail',move:{kind:'gather',id:'bridgeport'}},reason:'Blueprint resource cost.'};
   if(s.rail.resources.idea<1)return {title:'Gather an idea',action:{kind:'rail',move:{kind:'gather',id:'ovenham'}},reason:'Model creativity.'};
   return {title:'Craft the blueprint',action:{kind:'rail',move:{kind:'craft',id:'blueprint'}},reason:'A game token, not validated engineering.'};
  }
 }
 return railwayOffer(s.rail);
}
export function playVariant(raw,action){
 ensure(raw&&raw.format==='static-field.expansion-variant-play/009','INVALID_VARIANT');
 ensure(raw.phase==='PLAYING','VARIANT_FINISHED');
 const s=copy(raw);
 if(action?.kind==='circle'){
   ensure(!s.circleHeld,'CIRCLE_ALREADY_HELD');
   s.circleHeld=true;
   s.localHistory.push({type:'CIRCLE',text:'Fictional table listens. No real-world worker was consulted or committed.'});
 } else if(action?.kind==='rail'){
   const outcome=railwayStep(s.rail,action.move);
   s.rail=outcome.state;
   s.localHistory.push({type:'RAIL',text:outcome.message});
 } else err('UNKNOWN_VARIANT_ACTION');
 if(progress(s).complete){s.phase='LOCAL_VARIANT_GOAL_MET';s.localHistory.push({type:'END',text:'Optional game objective completed. No real-world claim.'});}
 else if(s.rail.phase!=='PLAYING')s.phase='LOCAL_VARIANT_CLOSED_WITH_UNMET_GOAL';
 return {state:s,status:s.phase,progress:progress(s)};
}
export function variantReturn(s){ensure(s?.format==='static-field.expansion-variant-play/009','INVALID_VARIANT');
 return {schema:'static-field.expansion-return-unsent/009',authority:'NONE',status:'FICTIONAL_UNVERIFIED',
  sourceDigest:s.candidate.sourceDigest,candidateDigest:s.candidate.digest,template:s.candidate.template,goal:s.candidate.goal,
  result:s.phase,progress:progress(s),originalGame:railwayExport(s.rail),history:s.localHistory,
  realWorldActionsAuthorized:0,realWorkerConsents:0,physicalDeeds:0,blockchainMints:0,
  nextQuestion:'Which specific, permissioned and independently verifiable real-world question is worth investigating?'};
}
