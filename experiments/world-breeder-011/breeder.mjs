// STATIC FIELD 011 — new mechanics bred from independently admitted 010 worlds.
// This is an offline fictional grammar, never a biological, labor, economic or real-world proof.
import * as ATLAS from '../living-world-atlas-010/atlas.mjs';
import {progress as forgeProgress,suggest as forgeSuggest} from '../expansion-forge-009/forge.mjs';
export const SCHEMA='static-field.world-breeder/011';
export const CROSS_SCHEMA='static-field.crossworld-new-mechanic/011';
const copy=x=>structuredClone(x);
const ok=(condition,code)=>{if(!condition)throw Error(code);};
const safeLabel=x=>typeof x==='string'&&x.length>0&&x.length<=65&&/^[a-zA-Z0-9 _.,:!?'-]+$/.test(x);
const canon=x=>Array.isArray(x)?'['+x.map(canon).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}':JSON.stringify(x);
const sha=async x=>'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canon(x)))),v=>v.toString(16).padStart(2,'0')).join('');
const PAIRS={
  'CONNECTION|DIGNITY':{id:'WORKER_VOICE_PASSAGE',title:'THE NAME ON THE TICKET',purpose:'A rail journey needs a witnessed care conversation before the route is opened.',novel:'A newly bred station charter: LISTEN + AUDIT before BUILD, followed by a distinct RELAY publication choice.'},
  'CONNECTION|WITNESS':{id:'OPEN_LEDGER_ROUTE',title:'THE OPEN LEDGER LINE',purpose:'A contested supply claim must remain contested when the railroad gains a new station.',novel:'A new bridge rule: AUDIT + LISTEN before BUILD, then an explicitly chosen RELAY recording.'}
};
const pairKey=(a,b)=>[a,b].sort().join('|');
function getParents(table,a,b){ok(a!==b,'DISTINCT_PARENT_WORLDS_REQUIRED');const x=table.worlds.find(w=>w.id===a),y=table.worlds.find(w=>w.id===b);ok(x&&y,'UNKNOWN_SOURCE_WORLD');ok(x.tableId===table.id&&y.tableId===table.id,'SOURCE_WORLD_NOT_LOCAL');return [x,y];}
export function makeHabitat(table){ok(table?.schema===ATLAS.ATLAS_SCHEMA,'ATLAS_REQUIRED');return {schema:SCHEMA,authority:'LOCAL_FICTION_ONLY',table:copy(table),crossings:[],events:[]};}
function assertHabitat(s){ok(s?.schema===SCHEMA&&s.authority==='LOCAL_FICTION_ONLY'&&Array.isArray(s.crossings)&&Array.isArray(s.events)&&s.table?.schema===ATLAS.ATLAS_SCHEMA,'INVALID_BREEDER_STATE');ok(s.crossings.length<=20&&s.events.length<=300,'STATE_LIMIT');}
function pairing(table,a,b){const [x,y]=getParents(table,a,b);const rule=PAIRS[pairKey(x.play.candidate.lens,y.play.candidate.lens)];ok(rule,'HOLD_UNSUPPORTED_COMPOSITION');const routeParent=[x,y].find(w=>w.play.candidate.lens==='CONNECTION');ok(routeParent,'HOLD_NO_RAIL_PARENT');const other=[x,y].find(w=>w.id!==routeParent.id);return {parents:[x,y],routeParent,other,rule};}
export async function propose(s,a,b){assertHabitat(s);ok((await ATLAS.validateTable(s.table)).ok,'UNVERIFIED_ATLAS_REPLAY');const {parents,routeParent,other,rule}=pairing(s.table,a,b);
 const basis={schema:CROSS_SCHEMA,tableId:s.table.id,parents:parents.map(w=>({worldId:w.id,candidateDigest:w.play.candidate.digest,template:w.play.candidate.template,lens:w.play.candidate.lens,sourceOfferDigest:w.sourceOffer.digest})),
  routeParentId:routeParent.id,otherParentId:other.id,recipe:rule.id,title:rule.title,purpose:rule.purpose,novel:rule.novel,
  conditions:['SEPARATE_LITTLE_YES_PER_PARENT','CHILD_INDEPENDENT_INVENTORY','CHILD_AUDIT_42_VS_39','CHILD_LISTEN_CIRCLE','CHILD_CONSTRUCT_SOURCE_ROUTE','EXPLICIT_CHILD_RELAY'],
  claims:{originAuthenticated:false,workerConsentVerified:false,realResourcesCredited:0,externalAuthority:'NONE'},status:'HELD_NOT_ADMITTED'};
 return {...basis,digest:await sha(basis)};
}
export async function nominate(raw,a,b){assertHabitat(raw);ok(raw.crossings.length<20,'CROSSING_LIMIT');const proposal=await propose(raw,a,b);ok(!raw.crossings.some(c=>c.proposal.digest===proposal.digest),'DUPLICATE_CROSSING');const h=copy(raw);const crossing={proposal,decisions:proposal.parents.map(p=>({worldId:p.worldId,choice:'HOLD'})),childId:null,relay:false,status:'HOLD_TWO_INDEPENDENT_LITTLE_YES'};h.crossings.push(crossing);h.events.push({type:'CROSSING_PROPOSED',digest:proposal.digest});return {habitat:h,crossing};}
function locate(h,d){const c=h.crossings.find(x=>x.proposal.digest===d);ok(c,'UNKNOWN_CROSSING');return c;}
export function respond(raw,digest,worldId,choice){assertHabitat(raw);ok(['YES','HOLD','REFUSE'].includes(choice),'INVALID_CHOICE');const h=copy(raw),c=locate(h,digest);ok(!c.childId,'CHILD_ALREADY_BORN');const v=c.decisions.find(x=>x.worldId===worldId);ok(v,'NOT_ONE_OF_TWO_PARENTS');ok(v.choice==='HOLD','CHOICE_ALREADY_RECORDED');v.choice=choice;c.status=c.decisions.some(x=>x.choice==='REFUSE')?'REFUSED_BY_PARENT':c.decisions.every(x=>x.choice==='YES')?'READY_FOR_LOCAL_BIRTH':'HOLD_TWO_INDEPENDENT_LITTLE_YES';h.events.push({type:'PARENT_CHOICE',worldId,choice,digest});return {habitat:h,status:c.status};}
export async function birth(raw,digest,label='The Third Station'){assertHabitat(raw);ok(safeLabel(label),'BAD_CHILD_NAME');ok((await ATLAS.validateTable(raw.table)).ok,'UNVERIFIED_ATLAS_REPLAY');const h=copy(raw),c=locate(h,digest);
 ok(c.status==='READY_FOR_LOCAL_BIRTH'&&c.decisions.every(v=>v.choice==='YES'),'HOLD_MISSING_SEPARATE_LITTLE_YES');
 const regenerated=await propose(h,c.proposal.parents[0].worldId,c.proposal.parents[1].worldId);
 ok(canon(regenerated)===canon(c.proposal),'ALTERED_PARENT_PROPOSAL');
 const out=await ATLAS.fork(h.table,c.proposal.routeParentId,label);h.table=out.table;c.childId=out.world.id;c.status='CHILD_PLAYING';h.events.push({type:'CHILD_BORN',childId:c.childId,digest});return {habitat:h,world:out.world};}
function childState(h,c){ok(c.childId,'NO_CHILD_BORN');const child=h.table.worlds.find(w=>w.id===c.childId);ok(child,'MISSING_CHILD_WORLD');ok(child.play.candidate.digest===h.table.worlds.find(w=>w.id===c.proposal.routeParentId)?.play.candidate.digest,'CHILD_SOURCE_CHANGED');return child;}
export function inspect(raw,digest){assertHabitat(raw);const c=locate(raw,digest);let progress=null;
 if(c.childId){const w=childState(raw,c),route=w.play.candidate.requirements.find(r=>r.type==='RAIL');const routeDone=route? w.play.rail.built.includes(route.id):false;
 const audit=!!w.play.rail.claim.audited,circle=!!w.play.circleHeld;
 progress={audit,circle,route:routeDone,relay:c.relay,complete:audit&&circle&&routeDone&&c.relay,
  steps:[{id:'AUDIT',done:audit},{id:'LISTEN',done:circle},{id:'BUILD',done:routeDone},{id:'RELAY',done:c.relay}],
  charter:'The derived combination requires listening and an integrity audit before a physical game route may be built.'};}
 return {title:c.proposal.title,recipe:c.proposal.recipe,parents:c.proposal.parents,choices:copy(c.decisions),status:c.status,childId:c.childId,progress,authority:'LOCAL_FICTION_ONLY',externalRights:0};}
export function move(raw,digest,action){assertHabitat(raw);const h=copy(raw),c=locate(h,digest);ok(c.status==='CHILD_PLAYING','CHILD_NOT_OPEN');const child=childState(h,c);
 const before=inspect(h,digest).progress;
 if(action?.kind==='relay'){ok(before.audit&&before.circle&&before.route,'HOLD_NOT_READY_FOR_RELAY');ok(!c.relay,'RELAY_ALREADY_RECORDED');c.relay=true;c.status='FICTIONAL_CROSSWORLD_GOAL_MET';h.events.push({type:'CHILD_RELAY_RELEASED',childId:c.childId,digest});return {habitat:h,inspection:inspect(h,digest)};}
 ok(action?.kind==='circle'||action?.kind==='rail','UNRECOGNIZED_CHILD_ACTION');
 if(action.kind==='rail'&&action.move?.kind==='build')ok(before.audit&&before.circle,'HOLD_LISTEN_AND_AUDIT_BEFORE_BUILD');
 const out=ATLAS.act(h.table,c.childId,action);h.table=out.table;h.events.push({type:'CHILD_PLAYED_NATIVE_009',childId:c.childId,action:copy(action)});return {habitat:h,inspection:inspect(h,digest)};}
export function next(raw,digest){const state=inspect(raw,digest);if(!state.childId)return {title:'Ask each parent world for a separate Little Yes',action:null};const p=state.progress;if(p.complete)return {title:'A newly bred game-only mechanic was completed',action:null};if(!p.audit)return {title:'Inspect the disputed 42 / 39 WOOD claim',action:{kind:'rail',move:{kind:'audit'}}};if(!p.circle)return {title:'Hold a fictional listening circle',action:{kind:'circle'}};if(!p.route){const c=locate(raw,digest),w=childState(raw,c);return forgeSuggest(w.play);}return {title:'Record the separate cross-world relay choice',action:{kind:'relay'}};}
export async function verify(raw){try{assertHabitat(raw);ok((await ATLAS.validateTable(raw.table)).ok,'INVALID_NATIVE_010_TABLE');for(const c of raw.crossings){ok(Object.keys(c).sort().join('|')==='childId|decisions|proposal|relay|status','FORGED_CROSSING_KEYS');const original=await propose(raw,c.proposal.parents[0].worldId,c.proposal.parents[1].worldId);ok(canon(original)===canon(c.proposal),'ALTERED_RECIPE');ok(c.decisions.length===2&&c.decisions.every((d,i)=>d.worldId===c.proposal.parents[i].worldId&&['HOLD','YES','REFUSE'].includes(d.choice)),'INVALID_CONSENT_RECORD');// Replay 011 actions independently of mutable current status. A digest is never a signature.
 const traces=raw.events.filter(e=>e.digest===c.proposal.digest || (e.childId&&e.childId===c.childId));
 ok(traces[0]?.type==='CROSSING_PROPOSED','MISSING_NOMINATION_EVENT');
 const votes=traces.filter(e=>e.type==='PARENT_CHOICE');
 ok(votes.length===c.decisions.filter(x=>x.choice!=='HOLD').length,'MISSING_VOTE_EVENT');
 const seen=new Set();for(const v of votes){ok(['YES','REFUSE'].includes(v.choice)&&c.decisions.some(x=>x.worldId===v.worldId&&x.choice===v.choice)&&!seen.has(v.worldId),'ALTERED_VOTE_EVENT');seen.add(v.worldId);}
 if(c.childId){ok(traces.filter(e=>e.type==='CHILD_BORN').length===1&&traces.filter(e=>e.type==='CHILD_BORN')[0].childId===c.childId,'MISSING_BIRTH_EVENT');
 ok(traces.filter(e=>e.type==='CHILD_PLAYED_NATIVE_009').length===childState(raw,c).decisions.length-1,'MISSING_NATIVE_ACTION_EVENT');
 ok(traces.filter(e=>e.type==='CHILD_RELAY_RELEASED').length===(c.relay?1:0),'MISSING_RELAY_EVENT');}
 else ok(!traces.some(e=>e.type==='CHILD_BORN'||e.type==='CHILD_RELAY_RELEASED'),'UNBORN_HISTORY_FRAUD');
 if(c.childId){ok(c.decisions.every(x=>x.choice==='YES'),'BIRTH_WITHOUT_YES');const w=childState(raw,c);ok(w.decisions[0]?.type==='LOCAL_PLAYER_ADMIT','NO_NATIVE_CHILD_ADMISSION');ok(w.ancestors.includes(c.proposal.routeParentId),'MISSING_NATIVE_PARENT');ok(c.status=== (c.relay?'FICTIONAL_CROSSWORLD_GOAL_MET':'CHILD_PLAYING'),'ALTERED_CROSSING_STATUS');if(c.relay){const progress=inspect(raw,c.proposal.digest).progress;ok(progress.audit&&progress.circle&&progress.route,'FORGED_RELAY');}}else{ok(c.relay===false&&['REFUSED_BY_PARENT','READY_FOR_LOCAL_BIRTH','HOLD_TWO_INDEPENDENT_LITTLE_YES'].includes(c.status),'ILLEGAL_UNBORN_STATUS');}}
 return {ok:true,fictional:true};}catch(e){return {ok:false,reason:String(e.message)};}}
export async function demo(){let table=ATLAS.makeTable('W','Moon Lantern');const r=ATLAS.demoPartyRecord();for(const i of [1,2]){const packet=await ATLAS.propose(r,i);const reception=await ATLAS.receiveOffer(table,packet);table=reception.table;table=(await ATLAS.decide(table,reception.entry.id,'ADMIT',i===1?'First Railway':'Worker Voice')).table;}
 let h=makeHabitat(table);const proposed=await nominate(h,table.worlds[0].id,table.worlds[1].id);h=proposed.habitat;for(const p of proposed.crossing.proposal.parents){h=respond(h,proposed.crossing.proposal.digest,p.worldId,'YES').habitat;}h=(await birth(h,proposed.crossing.proposal.digest,'The Named Station')).habitat;
 const digest=proposed.crossing.proposal.digest;let moves=[];for(let i=0;i<24&&inspect(h,digest).status==='CHILD_PLAYING';i++){const tip=next(h,digest);ok(tip.action,'NO_NEXT_ACTION');moves.push(tip.title);h=move(h,digest,tip.action).habitat;}return {habitat:h,inspection:inspect(h,digest),moves,validation:await verify(h)};}
