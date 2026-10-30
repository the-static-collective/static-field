// STATIC FIELD 012 — The World Garden, a bounded fiction-only source-linked garden.
// Real 011 birth and 010/009/007 play are executed; nothing here claims external assent.
import * as A from '../living-world-atlas-010/atlas.mjs';
import * as B from '../world-breeder-011/breeder.mjs';
export const SCHEMA='static-field.world-garden/012';
export const MAIL_SCHEMA='static-field.garden-pollen/012';
const cp=structuredClone;
const insist=(b,c)=>{if(!b)throw Error(c);};
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const digest=async o=>'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(o)))),b=>b.toString(16).padStart(2,'0')).join('');
const label=x=>typeof x==='string'&&x.length>0&&x.length<=65&&/^[a-zA-Z0-9 _.,:!?'-]+$/.test(x);
const CONDITIONS=['OBSERVE','TEND'];
const KINDS=['DIGNITY','WITNESS','ATLAS'];
const sourceFor=(h,kind)=>kind==='DIGNITY'?[h.table.worlds[1].id,h.table.worlds[2].id]:[h.table.worlds[1].id,h.table.worlds[0].id];
const seed=(s,id)=>{const v=s.seeds.find(x=>x.id===id);insist(v,'UNKNOWN_SEED');return v;};
const graftOf=(s,id)=>{const g=s.grafts.find(x=>x.id===id);insist(g,'UNKNOWN_GRAFT');return g;};
async function initial(id,name){insist(label(id)&&label(name),'INVALID_GARDEN_LABEL');let table=A.makeTable(id,name);const record=A.demoPartyRecord();
 for(const [i,title] of [[0,'The Ledger'],[1,'The Railway'],[2,'The Workers']]){
  const offer=await A.propose(record,i);const incoming=await A.receiveOffer(table,offer);const admitted=await A.decide(incoming.table,incoming.entry.id,'ADMIT',title);table=admitted.table;
 }
 return B.makeHabitat(table);
}
export async function create(id='garden-a',name='The Porch Nursery'){
 return {schema:SCHEMA,id,name,authority:'LOCAL_FICTION_ONLY',habitat:await initial(id,name),seeds:[],grafts:[],inbox:[],events:[],limits:{seedSlots:8,simultaneousGrafts:1}};
}
export async function sourceProposal(s,kind){insist(KINDS.includes(kind),'UNKNOWN_SEED_KIND');if(kind==='ATLAS')return A.propose(A.demoPartyRecord(),0);const [a,b]=sourceFor(s.habitat,kind);return B.propose(s.habitat,a,b);}
function pairing(s,a,b){insist(a!==b,'SELF_POLLINATION_HELD');const x=seed(s,a),y=seed(s,b);const types=[x.kind,y.kind].sort().join('|');
 if(types==='DIGNITY|WITNESS')return {ok:true,mechanic:'THE WITNESSED NAME ON THE TICKET',rule:'After AUDIT, record a separate dispute acknowledgment before the original 011 BUILD; after original RELAY, choose whether to share the fictional blueprint.',sourceIds:[x.id,y.id].sort()};
 return {ok:false,reason:types==='ATLAS|DIGNITY'||types==='ATLAS|WITNESS'?'HOLD_SOURCE_ADAPTER_NOT_PROVEN':'HOLD_NO_SUPPORTED_CROSS_RULE'};
}
export function inspect(s){insist(s?.schema===SCHEMA,'INVALID_GARDEN');return {title:s.name,worlds:s.habitat.table.worlds.length,seeds:s.seeds.map(x=>({id:x.id,kind:x.kind,title:x.title,status:x.status,care:x.care,vote:x.vote,sourceDigest:x.proposal.digest,source:x.kind==='ATLAS'?'ATLAS_010':'BREEDER_011'})),grafts:s.grafts.map(g=>({id:g.id,title:g.title,status:g.status,childId:g.childId,acknowledged:g.acknowledged,shared:g.shared,parentSeeds:g.parentSeeds,sourceNative:B.inspect(s.habitat,g.crossingDigest)})),inbox:s.inbox.map(m=>({id:m.id,from:m.packet.originGarden,status:m.status,title:m.packet.title})),events:s.events.length,authority:'LOCAL_FICTION_ONLY'};}
async function apply(raw,event){insist(raw?.schema===SCHEMA&&raw.authority==='LOCAL_FICTION_ONLY','INVALID_GARDEN');insist(Array.isArray(raw.events)&&raw.events.length<160,'EVENT_LIMIT');const s=cp(raw);const type=event?.type;
 if(type==='PLANT'){
  insist(KINDS.includes(event.kind),'UNKNOWN_SEED_KIND');insist(s.seeds.length<8,'GARDEN_FULL');insist(!s.seeds.some(x=>x.kind===event.kind),'DUPLICATE_SEED_KIND');
  const proposal=await sourceProposal(s,event.kind);const id=`seed-${(await digest({garden:s.id,kind:event.kind,d:proposal.digest})).slice(7,19)}`;
  s.seeds.push({id,kind:event.kind,proposal,title:event.kind==='DIGNITY'?'Names in the Station':event.kind==='WITNESS'?'The Open Ledger':'A Seed from the Atlas',status:'DORMANT',care:[],vote:'HOLD'});
 }else if(type==='TEND'){
  const v=seed(s,event.id);insist(CONDITIONS.includes(event.method),'BAD_GARDEN_CARE');insist(v.vote!=='REFUSE','REFUSED_SEED_STAYS_DORMANT');insist(!v.care.includes(event.method),'CARE_ALREADY_RECORDED');v.care.push(event.method);v.status=v.care.length===2?'READY_FOR_PLAYER_CHOICE':'GERMINATING';
 }else if(type==='CHOOSE'){
  const v=seed(s,event.id);insist(v.care.length===2,'SEED_NOT_NURTURED');insist(['YES','REFUSE'].includes(event.choice),'BAD_SEED_CHOICE');insist(v.vote==='HOLD','SEED_ALREADY_DECIDED');v.vote=event.choice;v.status=event.choice==='YES'?'LITTLE_YES_RECORDED':'REFUSED_WITHOUT_PENALTY';
 }else if(type==='GRAFT'){
  insist(label(event.label),'INVALID_GRAFT_NAME');insist(s.grafts.length<1,'ONE_GRAFT_PER_EXPERIMENT');const a=seed(s,event.a),b=seed(s,event.b);const compatible=pairing(s,a.id,b.id);insist(compatible.ok,compatible.reason);insist(a.vote==='YES'&&b.vote==='YES','HOLD_TWO_SEPARATE_LITTLE_YES');insist(a.care.length===2&&b.care.length===2,'HOLD_MISSING_CARE');
  const dignity=s.seeds.find(x=>x.kind==='DIGNITY');const ids=sourceFor(s.habitat,'DIGNITY');
  let out=await B.nominate(s.habitat,ids[0],ids[1]);s.habitat=out.habitat;const p=out.crossing.proposal;
  for(const ref of p.parents)s.habitat=B.respond(s.habitat,p.digest,ref.worldId,'YES').habitat;
  const born=await B.birth(s.habitat,p.digest,event.label);s.habitat=born.habitat;
  s.grafts.push({id:'graft-'+p.digest.slice(7,19),title:event.label,parentSeeds:[a.id,b.id].sort(),crossingDigest:p.digest,childId:born.world.id,acknowledged:false,shared:false,status:'CHILD_PLAYING'});
  a.status='GRAFT_PARENT';b.status='GRAFT_PARENT';insist(dignity,'MISSING_SOURCE_SEED');
 }else if(type==='ACKNOWLEDGE'){
  const g=graftOf(s,event.id);insist(!g.acknowledged,'DISPUTE_ALREADY_ACKNOWLEDGED');const progress=B.inspect(s.habitat,g.crossingDigest).progress;
  insist(progress?.audit,'AUDIT_FIRST');g.acknowledged=true;
 }else if(type==='MOVE'){
  const g=graftOf(s,event.id);insist(!g.shared,'ALREADY_SHARED');const tip=B.next(s.habitat,g.crossingDigest);insist(tip.action,'NO_NEXT_MOVE');
  insist(canonical(event.action)===canonical(tip.action),'UNEXPECTED_NATIVE_MOVE');if(tip.action.kind==='rail'&&tip.action.move?.kind==='build')insist(g.acknowledged,'HOLD_WITNESS_ACK_BEFORE_BUILD');
  s.habitat=B.move(s.habitat,g.crossingDigest,tip.action).habitat;
  const r=B.inspect(s.habitat,g.crossingDigest);if(r.progress?.complete)g.status='READY_FOR_BLUEPRINT_CHOICE';
 }else if(type==='SHARE'){
  const g=graftOf(s,event.id);insist(!g.shared&&g.status==='READY_FOR_BLUEPRINT_CHOICE','GAME_NOT_COMPLETE');insist(g.acknowledged,'MISSING_DISPUTE_ACK');g.shared=true;g.status='FICTIONAL_BLUEPRINT_READY';
 }else if(type==='RECEIVE'){
  const p=event.packet;const valid=await verifyPacket(p);insist(valid.ok,valid.reason);insist(s.inbox.length<16,'INBOX_FULL');insist(!s.inbox.some(x=>x.packet.digest===p.digest),'DUPLICATE_MAIL');
  s.inbox.push({id:'mail-'+p.digest.slice(7,19),packet:p,status:'HOLD'});
 }else if(type==='MAIL_CHOICE'){
  const m=s.inbox.find(m=>m.id===event.id);insist(m,'UNKNOWN_MAIL');insist(m.status==='HOLD','MAIL_ALREADY_DECIDED');insist(['REFUSE','ADMIT_AS_FICTIONAL_REFERENCE'].includes(event.choice),'INVALID_MAIL_DECISION');m.status=event.choice;
 }else throw Error('UNSUPPORTED_GARDEN_EVENT');
 s.events.push(cp(event));return s;
}
export async function act(raw,event){const proof=await verify(raw);insist(proof.ok,'GARDEN_REPLAY_FAILED_'+proof.reason);return apply(raw,event);}
export function compatible(s,a,b){return pairing(s,a,b);}
export function suggested(s){if(!s.seeds.some(x=>x.kind==='DIGNITY'))return {title:'Plant Names in the Station',event:{type:'PLANT',kind:'DIGNITY'}};
 if(!s.seeds.some(x=>x.kind==='WITNESS'))return {title:'Plant The Open Ledger',event:{type:'PLANT',kind:'WITNESS'}};
 for(const v of s.seeds.filter(x=>x.kind!=='ATLAS')){for(const method of CONDITIONS)if(!v.care.includes(method))return {title:`${method==='OBSERVE'?'Observe':'Tend'} ${v.title}`,event:{type:'TEND',id:v.id,method}};if(v.vote==='HOLD')return {title:`Ask for a Little Yes from ${v.title}`,event:{type:'CHOOSE',id:v.id,choice:'YES'}};}
 if(!s.grafts.length){const a=s.seeds.find(x=>x.kind==='DIGNITY'),b=s.seeds.find(x=>x.kind==='WITNESS');if(a.vote==='YES'&&b.vote==='YES')return {title:'Graft the two independently selected seeds',event:{type:'GRAFT',a:a.id,b:b.id,label:'The Witnessed Station'}};return {title:'Respect a refusal or unresolved Little Yes',event:null};}
 const g=s.grafts[0];if(g.shared)return {title:'The fictional blueprint is ready for voluntary mail',event:null};
 const state=B.inspect(s.habitat,g.crossingDigest);if(state.progress?.audit&&!g.acknowledged)return {title:'Acknowledge that 42 WOOD was claimed but only 39 observed',event:{type:'ACKNOWLEDGE',id:g.id}};
 if(state.progress?.complete)return {title:'Choose to share the completed fictional blueprint',event:{type:'SHARE',id:g.id}};
 return {title:B.next(s.habitat,g.crossingDigest).title,event:{type:'MOVE',id:g.id,action:B.next(s.habitat,g.crossingDigest).action}};
}
export async function verify(raw){try{
 insist(raw?.schema===SCHEMA&&raw.authority==='LOCAL_FICTION_ONLY'&&label(raw.id)&&label(raw.name),'BAD_GARDEN');
 insist(raw.limits?.seedSlots===8&&raw.limits?.simultaneousGrafts===1,'FORGED_LIMITS');
 insist(Array.isArray(raw.events)&&raw.events.length<=160&&JSON.stringify(raw).length<280000,'GARDEN_TOO_LARGE');
 const fresh=await create(raw.id,raw.name);let r=fresh;
 for(const e of raw.events)r=await apply(r,e);
 insist(canonical(r)===canonical(raw),'GARDEN_MUTATION_OR_MISSING_EVENT');
 insist((await B.verify(raw.habitat)).ok,'NATIVE_011_VALIDATION_FAILED');
 return {ok:true,events:raw.events.length,fictionOnly:true};
 }catch(e){return {ok:false,reason:String(e.message)};}}
export async function issuePacket(s,graftId){insist((await verify(s)).ok,'GARDEN_NOT_VERIFIED');const g=graftOf(s,graftId);insist(g.shared,'BLUEPRINT_NOT_SHARED');
 const b={schema:MAIL_SCHEMA,originGarden:s.id,title:g.title,originSeedDigests:g.parentSeeds.map(id=>seed(s,id).proposal.digest),native011CrossingDigest:g.crossingDigest,
  gameOnly:true,localClaims:{physicalResources:0,verifiedLaborConsent:false,authenticatedSender:false,externalAuthority:'NONE'},destinationRule:'HOLD_UNTIL_LOCAL_RECEIVER_CHOICE'};
 return {...b,digest:await digest(b)};
}
export async function verifyPacket(p){try{insist(p&&typeof p==='object'&&JSON.stringify(p).length<6000,'BAD_PACKET_SIZE');const {digest:d,...core}=p;insist(Object.keys(core).sort().join('|')==='destinationRule|gameOnly|localClaims|native011CrossingDigest|originGarden|originSeedDigests|schema|title','UNEXPECTED_PACKET_FIELDS');insist(p.schema===MAIL_SCHEMA&&p.gameOnly===true&&label(p.originGarden)&&label(p.title)&&p.destinationRule==='HOLD_UNTIL_LOCAL_RECEIVER_CHOICE','BAD_PACKET_SCHEMA');
 insist(Array.isArray(p.originSeedDigests)&&p.originSeedDigests.length===2&&p.originSeedDigests.every(s=>/^sha256:[a-f0-9]{64}$/.test(s)),'BAD_SEED_REFERENCES');
 insist(p.localClaims?.physicalResources===0&&p.localClaims?.verifiedLaborConsent===false&&p.localClaims?.authenticatedSender===false&&p.localClaims?.externalAuthority==='NONE','FORGED_AUTHORITY');insist(await digest(core)===d,'PACKET_TAMPERED');return {ok:true};}catch(e){return {ok:false,reason:String(e.message)};}}
export async function demo(){let s=await create();for(let i=0;i<50;i++){const t=suggested(s);if(!t.event)break;s=await act(s,t.event);}const v=await verify(s);insist(v.ok,'DEMO_INVALID');return {garden:s,inspection:inspect(s),tip:suggested(s),verification:v};}
