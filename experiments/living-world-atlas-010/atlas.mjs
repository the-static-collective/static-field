// STATIC FIELD 010 — independent-table Living World Atlas.
// Source-owned 009 forge verifies finite local play mechanics. SHA-256 = file
// integrity only, never identity, permission, labor consent, or real-world proof.
import {forge, receive, minimizeRecord, startVariant, playVariant, progress, suggest, variantReturn} from '../expansion-forge-009/forge.mjs';
import {makeGame,step as railwayStep,exportRecord} from '../little-yes-field-008/rail/game.mjs';

export const ATLAS_SCHEMA='static-field.living-world-atlas/010';
export const OFFER_SCHEMA='static-field.world-offer/010';
const cp=x=>structuredClone(x);
const insist=(x,code)=>{if(!x)throw Error(code);};
const legalLabel=x=>typeof x==='string'&&x.trim().length>0&&x.length<=65&&/^[a-zA-Z0-9 _.,:!?'-]+$/.test(x);
const uniq=a=>[...new Set(a)];
const sortJson=x=>Array.isArray(x)?'['+x.map(sortJson).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+sortJson(x[k])).join(',')+'}':JSON.stringify(x);
async function digest(x){const b=new TextEncoder().encode(sortJson(x));const h=await crypto.subtle.digest('SHA-256',b);return 'sha256:'+Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');}
export function makeTable(id,label){insist(legalLabel(id)&&legalLabel(label),'BAD_TABLE_NAME');return {schema:ATLAS_SCHEMA,id,label,authority:'FICTION_ONLY',worlds:[],inbox:[],outbox:[],compositions:[],events:[]};}
const assertTable=t=>insist(t?.schema===ATLAS_SCHEMA&&t.authority==='FICTION_ONLY'&&Array.isArray(t.worlds)&&Array.isArray(t.inbox)&&Array.isArray(t.outbox),'INVALID_ATLAS');
export function demoPartyRecord(){let x=makeGame(4,317);x=railwayStep(x,{kind:'audit'}).state;x=railwayStep(x,{kind:'agree',id:'mb'}).state;return exportRecord(x);}
export async function propose(record,candidateIndex=0,fromWorld=null){
 insist(Number.isSafeInteger(candidateIndex)&&candidateIndex>=0&&candidateIndex<=2,'BAD_PROPOSAL_INDEX');
 const safe=minimizeRecord(record);const result=await forge(safe);
 insist(result.status==='HOLD_PLAYER_CHOICE','NO_SOURCE_EVENT');
 const candidate=result.candidates[candidateIndex];insist(candidate,'CANDIDATE_NOT_FOUND');
 const sourceWorld=fromWorld?{id:fromWorld.id,tableId:fromWorld.tableId,ancestors:uniq(fromWorld.ancestors||[]).slice(0,12)}:null;
 const core={schema:OFFER_SCHEMA,fictional:true,authority:'NONE',sourceWorld,record:safe,candidate,
  claims:{authenticatedOrigin:false,physicalDeeds:0,workerConsents:0,realWorldRights:0},destination:'ANY_TABLE_MAY_HOLD_REFUSE_OR_ADMIT'};
 return {...core,digest:await digest(core)};
}
export async function verifyOffer(packet){
 try{
  insist(packet&&typeof packet==='object'&&JSON.stringify(packet).length<=190000,'OVERSIZED_OR_BAD_PACKET');
  const {schema,fictional,authority,sourceWorld,record,candidate,claims,destination,digest:packetDigest}=packet;
  insist(schema===OFFER_SCHEMA&&fictional===true&&authority==='NONE'&&destination==='ANY_TABLE_MAY_HOLD_REFUSE_OR_ADMIT','BAD_OFFER_SCHEMA');
  insist(claims&&claims.authenticatedOrigin===false&&claims.physicalDeeds===0&&claims.workerConsents===0&&claims.realWorldRights===0,'FORGED_AUTHORITY');
  insist(sourceWorld===null||(sourceWorld&&legalLabel(sourceWorld.id)&&legalLabel(sourceWorld.tableId)&&Array.isArray(sourceWorld.ancestors)&&sourceWorld.ancestors.length<=12&&sourceWorld.ancestors.every(legalLabel)),'BAD_ANCESTRY');
  const core={schema,fictional,authority,sourceWorld,record,candidate,claims,destination};
  insist(Object.keys(packet).sort().join('|')===[...Object.keys(core),'digest'].sort().join('|'),'EXTRA_OFFER_FIELDS');
  insist(await digest(core)===packetDigest,'ALTERED_ENVELOPE');
  insist(JSON.stringify(minimizeRecord(record))===JSON.stringify(record),'NONMINIMAL_PRIVATE_INPUT');
  const disposition=await receive(candidate,record,'HOLD');
  insist(disposition.status==='HOLD_PLAYER_CHOICE','INVALID_SOURCE_CANDIDATE');
  return {ok:true,digest:packetDigest,candidate};
 }catch(e){return {ok:false,status:'REFUSE_'+String(e.message).replace(/[^A-Z0-9_]/gi,'_').slice(0,65)}}
}
export async function sendOffer(table,record,candidateIndex=0,worldId=null){
 assertTable(table);insist(table.outbox.length<40,'OUTBOX_LIMIT');
 const w=worldId?table.worlds.find(x=>x.id===worldId):null;
 insist(!worldId||!!w,'UNKNOWN_SOURCE_WORLD');
 const offer=await propose(record,candidateIndex,w);
 const t=cp(table);if(!t.outbox.some(x=>x.digest===offer.digest))t.outbox.push(offer);
 t.events.push({type:'OFFER_PREPARED',digest:offer.digest,notSent:true});return {table:t,offer};
}
export async function receiveOffer(table,offer){
 assertTable(table);insist(table.inbox.length<60,'INBOX_LIMIT');
 const checked=await verifyOffer(offer);if(!checked.ok)return {table:cp(table),status:checked.status};
 const t=cp(table);let entry=t.inbox.find(x=>x.offer.digest===offer.digest);
 if(entry)return {table:t,status:'ALREADY_IN_INBOX',entry};
 entry={id:'mail-'+offer.digest.slice(7,23),offer:cp(offer),status:'HOLD',decidedWorldId:null};
 t.inbox.push(entry);t.events.push({type:'RECEIVED_UNVERIFIED_FICTION',offer:offer.digest});
 return {table:t,status:'HOLD_REQUIRES_DESTINATION_CHOICE',entry};
}
async function spawn(t,offer,label,partySize,source){
 insist(legalLabel(label),'BAD_WORLD_NAME');
 insist(Number.isSafeInteger(partySize)&&partySize>=2&&partySize<=6,'BAD_PARTY_SIZE');
 insist(t.worlds.length<30,'WORLD_LIMIT');
 const admitted=await receive(offer.candidate,offer.record,'ADMIT');
 insist(admitted.status==='ADMIT_LOCAL_FICTION_ONLY','CANNOT_ADMIT_CANDIDATE');
 const ordinal=t.worlds.length+1;
 const id=`world-${(await digest({table:t.id,ordinal,offer:offer.digest,label})).slice(7,22)}`;
 const parent=source===null?offer.sourceWorld?.id||null:source;
 const ancestors=uniq([...(offer.sourceWorld?.ancestors||[]),...(parent?[parent]:[])]).slice(-12);
 const world={id,label,tableId:t.id,sourceOffer:offer,ancestors,play:startVariant(admitted,partySize),decisions:[{type:'LOCAL_PLAYER_ADMIT',sourceOffer:offer.digest}],status:'LOCAL_FICTION_ONLY'};
 t.worlds.push(world);t.events.push({type:'WORLD_BORN',worldId:id,sourceOffer:offer.digest});return world;
}
export async function decide(table,mailId,decision,label='New World',partySize=4){
 assertTable(table);insist(['HOLD','REFUSE','ADMIT'].includes(decision),'INVALID_DECISION');
 const t=cp(table);const item=t.inbox.find(x=>x.id===mailId);insist(item,'UNKNOWN_MAIL');
 insist(item.status==='HOLD','ALREADY_DECIDED');
 if(decision==='HOLD')return {table:t,status:'HOLD'};
 if(decision==='REFUSE'){item.status='REFUSE';t.events.push({type:'REFUSED',mailId});return {table:t,status:'REFUSE'};}
 const check=await verifyOffer(item.offer);insist(check.ok,'SOURCE_CHANGED_SINCE_RECEIPT');
 const world=await spawn(t,item.offer,label,partySize,null);
 item.status='ADMIT';item.decidedWorldId=world.id;
 return {table:t,status:'ADMIT_LOCAL_FICTION_ONLY',world};
}
export async function fork(table,worldId,label){
 assertTable(table);const t=cp(table);const origin=t.worlds.find(x=>x.id===worldId);insist(origin,'UNKNOWN_WORLD');
 const check=await verifyOffer(origin.sourceOffer);insist(check.ok,'SOURCE_CHANGED');
 const world=await spawn(t,origin.sourceOffer,label,origin.play.rail.size,origin.id);
 return {table:t,world};
}
export function act(table,worldId,action){
 assertTable(table);const t=cp(table);const w=t.worlds.find(x=>x.id===worldId);insist(w,'UNKNOWN_WORLD');
 const outcome=playVariant(w.play,action);w.play=outcome.state;w.decisions.push({type:'LOCAL_GAME_MOVE',action:cp(action),status:outcome.status});
 t.events.push({type:'PLAYED',worldId,status:outcome.status});return {table:t,world:w,progress:outcome.progress};
}
export async function returnFromWorld(table,worldId,candidateIndex=0){
 assertTable(table);const w=table.worlds.find(x=>x.id===worldId);insist(w,'UNKNOWN_WORLD');
 const record=variantReturn(w.play).originalGame;
 return sendOffer(table,record,candidateIndex,worldId);
}
export async function composeWorlds(table,ids,label){
 assertTable(table);insist(Array.isArray(ids)&&ids.length===2&&ids[0]!==ids[1],'TWO_DISTINCT_WORLDS_REQUIRED');
 insist(legalLabel(label),'BAD_COMPOSITION_NAME');const t=cp(table);
 const worlds=ids.map(id=>t.worlds.find(x=>x.id===id));insist(worlds.every(Boolean),'UNKNOWN_WORLD');
 const id='constellation-'+(await digest({table:t.id,ids:ids.slice().sort(),label})).slice(7,22);
 const comp={schema:'static-field.constellation/010',id,label,worlds:ids.slice(),status:'LOCAL_OVERLAY_ONLY',
  requirements:worlds.map(w=>({worldId:w.id,candidateDigest:w.play.candidate.digest,goal:w.play.candidate.goal})),
  authority:'NONE',sharedInventory:false,sourceOwnerApprovals:false,realWorldActionsAuthorized:0};
 if(!t.compositions.some(x=>x.id===id))t.compositions.push(comp);
 return {table:t,composition:comp};
}
export function inspect(table){assertTable(table);
 return {schema:'static-field.atlas-inspection/010',tableId:table.id,worlds:table.worlds.map(w=>({id:w.id,label:w.label,ancestors:w.ancestors,template:w.play.candidate.template,progress:progress(w.play),phase:w.play.phase,suggestion:w.play.phase==='PLAYING'?suggest(w.play):null})),
  inbox:table.inbox.map(x=>({id:x.id,origin:x.offer.sourceWorld?.tableId||'unspecified',title:x.offer.candidate.title,status:x.status})),
  compositions:table.compositions.map(c=>({...c,complete:c.worlds.every(id=>{const w=table.worlds.find(x=>x.id===id);return !!w&&progress(w.play).complete;})})),
  caveat:'Independent local fictional worlds; SHA-256 is not an identity proof. No execution or physical credit.'};
}
export async function validateTable(raw){
 try{
  assertTable(raw);insist(legalLabel(raw.id)&&legalLabel(raw.label),'BAD_TABLE_NAME');
  insist(raw.worlds.length<=30&&raw.inbox.length<=60&&raw.outbox.length<=40&&raw.compositions.length<=30,'LIMIT');
  const ids=new Set();for(const [index,w] of raw.worlds.entries()){
   insist(legalLabel(w.id)&&!ids.has(w.id),'DUPLICATE_WORLD');ids.add(w.id);
   insist(w.tableId===raw.id&&legalLabel(w.label)&&Array.isArray(w.decisions)&&w.decisions.length<=200&&Array.isArray(w.ancestors)&&w.ancestors.length<=12,'BAD_WORLD_RECORD');
   const c=await verifyOffer(w.sourceOffer);insist(c.ok,'BAD_WORLD_SOURCE');
   const expectedId=`world-${(await digest({table:raw.id,ordinal:index+1,offer:w.sourceOffer.digest,label:w.label})).slice(7,22)}`;
   insist(w.id===expectedId,'ALTERED_WORLD_ID');
   insist(w.decisions[0]?.type==='LOCAL_PLAYER_ADMIT'&&w.decisions[0]?.sourceOffer===w.sourceOffer.digest,'MISSING_PLAYER_ADMISSION');
   const verified=await receive(w.sourceOffer.candidate,w.sourceOffer.record,'ADMIT');
   let reconstructed=startVariant(verified,w.play?.rail?.size);
   for(const move of w.decisions.slice(1)){
    insist(move.type==='LOCAL_GAME_MOVE','UNKNOWN_WORLD_EVENT');
    const replay=playVariant(reconstructed,move.action);insist(move.status===replay.status,'ALTERED_MOVE_RESULT');reconstructed=replay.state;
   }
   insist(sortJson(reconstructed)===sortJson(w.play),'ALTERED_WORLD_HISTORY');
  }
  for(const i of raw.inbox){insist((await verifyOffer(i.offer)).ok,'BAD_MAIL');insist(['HOLD','REFUSE','ADMIT'].includes(i.status),'BAD_MAIL_STATUS');}
  for(const o of raw.outbox)insist((await verifyOffer(o)).ok,'BAD_OUTBOUND');
  return {ok:true};
 }catch(e){return {ok:false,reason:String(e.message)}}
}