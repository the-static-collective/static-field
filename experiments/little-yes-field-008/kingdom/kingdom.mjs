import {makeGame,step as railStep,goals as railGoals,offer as railOffer,exportRecord,VERSION as RAIL_VERSION,TOWNS,LINKS,RECIPES} from '../rail/game.mjs';
// THE EARTH REMEMBERS / WHO BUILT YOUR KINGDOM? — scenario extension for Little Yes Express 007
// Original 007 rules remain source-owned; this wrapper never creates real people, rights, wages or proof.
const VERSION='WHO-BUILT-YOUR-KINGDOM-008/experimental-v1';
const WORK = Object.freeze({
  forest:{title:'Forest stewards',text:'Consent to land use; equipment and weather safety; time to rest; a named or anonymous credit choice.',line:'The hands in the dust.'},
  quarry:{title:'Quarry workers',text:'Protective equipment; a safe schedule; clear compensation terms; independent refusal.',line:'Who carried your stone?'},
  fields:{title:'Field workers',text:'Recorded compensation; safe hours; food and water; public credit only with permission.',line:'Who fed your children?'},
  workshop:{title:'Inventors & craft workers',text:'Credit for contributions; safety; voluntary terms for labor and reuse of designs.',line:'Measuring tomorrow with cracked fingers.'},
  builders:{title:'Rail builders',text:'No build before safe working terms, transparent pay, rest, and workers’ own voice.',line:'Who built your kingdom?'},
  drivers:{title:'Carriers',text:'Reasonable route, rest, safe transport, agreed compensation and freedom to decline.',line:'Every border wearing a different uniform.'},
  cleaners:{title:'Night cleaners',text:'Invisible maintenance made visible: safe hours, credited work if chosen, and fair terms.',line:'They disappear before the guests awaken.'}
});
const clone=x=>JSON.parse(JSON.stringify(x));
const roleFor=(s,a)=>{
 if(a.kind==='gather'){
  const town=TOWNS.find(t=>t.id===a.id);
  if(!town)return null;
  return town.resource==='wood'?'forest':town.resource==='ore'?'quarry':town.resource==='food'?'fields':'workshop';
 }
 if(a.kind==='craft')return 'workshop';
 if(a.kind==='build')return 'builders';
 if(a.kind==='ship')return 'drivers';
 return null;
};
function createParty(size=4,seed=317){
 const game=makeGame(size,seed);
 return {version:VERSION,fictional:true,rail:game,treasury:7,careReserve:0,
  agreements:{},cases:[],laborHistory:[],shadowLedger:[],decisionCount:0,
  scene:'INTRO',note:'The stones remember. Before we build, ask whose work makes building possible.'};
}
function caseFor(s,role){return s.cases.find(c=>c.role===role);}
function awaken(s,role){let c=caseFor(s,role);if(c)return c;
 c={role,terms:WORK[role].text,status:'NEEDS_TERMS',source:'SCRIPTED_FICTIONAL_CHARACTER',refusalAllowed:true};
 s.cases.push(c);s.shadowLedger.push({type:'UNSEEN_WORK_REVEALED',role,claim:'A modeled task relies on labor not represented by material tokens.',realWorkers:0});
 s.laborHistory.push(`${WORK[role].title} become visible; their conditions are not optional decorations.`);
 return c;
}
function status(s){
 const g=railGoals(s.rail),complete=Object.values(g).every(Boolean);
 const unresolved=s.cases.filter(x=>x.status!=='SCRIPTED_YES');
 return {rail:g,railPhase:s.rail.phase,unresolved:unresolved.map(c=>({role:c.role,status:c.status})),
  ready:complete&&unresolved.length===0&&s.rail.phase==='WON',
  declaration:complete&&unresolved.length?'HOLD_UNSETTLED_WORK':s.rail.phase==='WON'&&unresolved.length===0?'FICTIONAL_COMMONS_SUCCESS':s.rail.phase==='LOST'?'TRY_DIFFERENT_PATH':'IN_PROGRESS',
  claim:'This game cannot determine a fair wage, validate real safety, or grant anyone consent.'};
}
function director(s){
 const pending=s.cases.find(x=>x.status==='NEEDS_TERMS');
 if(pending)return {title:`Listen to ${WORK[pending.role].title}`,reason:`Before using this capability: ${pending.terms}`,action:{kind:'honor',role:pending.role}};
 if(s.cases.find(x=>x.status==='REFUSED'))return {title:'A worker has refused',reason:'Respect the refusal. Select a different fictional plan; nobody is spent or coerced.'};
 const core=railOffer(s.rail);
 return {title:core.title,reason:core.reason,action:core.suggested?{kind:'rail',move:core.suggested}:null};
}
function takeTurn(raw,action){
 if(!raw||raw.version!==VERSION)throw Error('Unknown expansion state');
 if(!action||typeof action.kind!=='string')throw Error('Invalid action');
 const s=clone(raw);let message='';
 if(action.kind==='honor'){
  const c=caseFor(s,action.role);
  if(!c||c.status!=='NEEDS_TERMS')throw Error('There is no open labor-terms conversation for this role');
  if(s.treasury<1)throw Error('No proposed funding remaining. HOLD; not permission to demand unpaid work.');
  s.treasury-=1;s.careReserve+=1;c.status='SCRIPTED_YES';
  s.laborHistory.push(`The table reserves one fictional funding unit and records the scripted ${WORK[c.role].title} agreement. This is NOT actual assent.`);
  message=`${WORK[c.role].title}: fictional terms now honored. The reserve is a prerequisite, not the value of a person.`;
 }else if(action.kind==='refuse'){
  const c=caseFor(s,action.role);
  if(!c||c.status!=='NEEDS_TERMS')throw Error('No current fictional invitation can be refused');
  c.status='REFUSED';s.laborHistory.push(`${WORK[c.role].title} refused. No work or penalty follows.`);
  message=`${WORK[c.role].title} refused. This branch stays closed.`;
 }else if(action.kind==='rail'){
  const move=action.move;
  if(!move||typeof move.kind!=='string')throw Error('Rail move missing');
  const role=roleFor(s,move);
  if(role){const c=awaken(s,role);
   if(c.status!=='SCRIPTED_YES'){
    message=c.status==='REFUSED'?'REFUSE: the relevant worker role declined. No action taken.':`HOLD: ask ${WORK[role].title} for scripted terms before ${move.kind}.`;
    s.scene='THE SCALES';s.note=message;s.decisionCount++;return {state:s,message,blocked:true};
   }}
  const {state:next,message:railMessage}=railStep(s.rail,move);
  s.rail=next;message=railMessage;
  s.laborHistory.push(`Fictional ${move.kind} completed under scripted ${role||'table'} conditions.`);
  // Make an often-hidden occupation visible after the first delivery; it cannot be erased by completing the rail goals.
  if(move.kind==='ship'&&!caseFor(s,'cleaners')){
    awaken(s,'cleaners');message+=' Maintenance workers appear in the ledger: the hidden nighttime shift still needs terms.';
  }
 }else throw Error('Unknown expansion action');
 s.decisionCount++;
 const state=status(s);
 s.scene=state.declaration==='FICTIONAL_COMMONS_SUCCESS'?'EARTH REMEMBERS':s.cases.length>=4?'BRING OUT THE SCALES':s.cases.length>=2?'WHO BUILT YOUR KINGDOM?':'HANDS IN THE DUST';
 s.note=message;
 return {state:s,message,blocked:false};
}
function portableRecord(s){
 const original=exportRecord(s.rail);
 return {format:'THE-EARTH-REMEMBERS-008/party-record',fictional:true,sourceGame:RAIL_VERSION,rightsClaim:'NONE',physicalDeeds:0,realWorkerConsents:0,workerIdentities:[],
  rail:original,terms:s.cases.map(c=>({role:c.role,status:c.status,terms:c.terms,source:c.source})),
  repairs:s.laborHistory,treasury:{unallocated:s.treasury,designated:s.careReserve},outcome:status(s),
  warnings:['Fictional worker YES is not actual consent','Funding units do not measure human dignity','No real wage, safe job, receipt, claim, NFT or labor right is created']};
}
export {VERSION,WORK,createParty,takeTurn,status,director,portableRecord};
