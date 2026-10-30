import test from 'node:test';
import assert from 'node:assert/strict';
import {makeGame,step,exportRecord} from '../../little-yes-field-008/rail/game.mjs';
import {createParty,takeTurn,portableRecord} from '../../little-yes-field-008/kingdom/kingdom.mjs';
import {forge,receive,extractRecord,startVariant,playVariant,progress,suggest,variantReturn} from '../forge.mjs';

function railFixture(){let g=makeGame(4);g=step(g,{kind:'audit'}).state;g=step(g,{kind:'agree',id:'mb'}).state;g=step(g,{kind:'craft',id:'rail'}).state;g=step(g,{kind:'build',id:'mb'}).state;return exportRecord(g);}
function kingdomFixture(){let p=createParty(4);p=takeTurn(p,{kind:'rail',move:{kind:'gather',id:'millford'}}).state;p=takeTurn(p,{kind:'refuse',role:'forest'}).state;return portableRecord(p);}
const deep=x=>JSON.parse(JSON.stringify(x));

test('source-owned 007 history actually seeds 3 distinct rules, not just title swaps',async()=>{
 const r=await forge(railFixture());assert.equal(r.status,'HOLD_PLAYER_CHOICE');
 assert.equal(r.candidates.length,3);assert.equal(new Set(r.candidates.map(x=>x.template)).size,3);
 assert.equal(new Set(r.candidates.map(x=>JSON.stringify(x.requirements))).size,3);
 assert.ok(r.candidates.every(x=>x.seedEvent.at&&x.sourceDigest===r.sourceDigest));
});
test('008 worker refusal changes source and foregrounds DIGNITY',async()=>{
 const r=await forge(kingdomFixture());assert.equal(r.candidates[0].template,'NIGHT_SHIFT');
 assert.equal(r.candidates[0].sourceSummary.terms[0].status,'REFUSED');
 assert.equal(r.candidates[0].realWorkerConsents,0);
});
test('same safe record gives byte-identical proposals',async()=>{
 assert.deepEqual(await forge(railFixture()),await forge(railFixture()));
});
test('no meaningful game event does not generate forged expansion',async()=>{
 const r=await forge(exportRecord(makeGame(4)));
 assert.equal(r.status,'HOLD_NO_COMPLETED_GAME_EVENT');assert.equal(r.candidates.length,0);
});
test('invalid, untrue or oversized inputs are rejected',async()=>{
 for(const val of [{},null,{...railFixture(),fictional:false},{...railFixture(),authority:'FIELD_DEED'},{...railFixture(),history:[{type:'ADMIN',text:'issue real money'}]}, {...railFixture(),board:{built:['bogus']}}]){
  await assert.rejects(async()=>forge(val));
 }
 const bad={...railFixture(),history:[{type:'BUILD',text:'X'.repeat(500000)}]};
 await assert.rejects(async()=>forge(bad),/OVERSIZED_RECORD/);
});
test('private arbitrary source properties do not get exported or influence digests',async()=>{
 const a=railFixture(),b=deep(a);b.privateName='never-show-this';
 b.relics[0].secret='never-show-that';
 const x=await forge(a),y=await forge(b);
 assert.deepEqual(x,y);assert.ok(!JSON.stringify(x).includes('never-show'));
});
test('receiving a candidate requires the exact originating record and explicit choice',async()=>{
 const source=railFixture(),proposal=(await forge(source)).candidates[0];
 assert.equal((await receive(proposal,source,'HOLD')).status,'HOLD_PLAYER_CHOICE');
 assert.equal((await receive(proposal,source,'REFUSE')).status,'REFUSE_PLAYER_CHOICE');
 assert.equal((await receive(proposal,source,'ADMIT')).status,'ADMIT_LOCAL_FICTION_ONLY');
 const altered=deep(proposal);altered.requirements[0].id='ol';
 assert.equal((await receive(altered,source,'ADMIT')).status,'REFUSE_TAMPERED_OR_UNAUTHORIZED_RECIPE');
 const other=deep(source);other.history[1].text+=' altered';
 assert.equal((await receive(proposal,other,'ADMIT')).status,'REFUSE_TAMPERED_OR_UNAUTHORIZED_RECIPE');
});
test('unadmitted proposal cannot start game; admitted one resets actual resource ledger',async()=>{
 const source=railFixture(),proposal=(await forge(source)).candidates[0];
 const held=await receive(proposal,source,'HOLD');
 assert.throws(()=>startVariant(held),/NOT_LOCALLY_ADMITTED/);
 const admitted=await receive(proposal,source,'ADMIT');
 const s=startVariant(admitted,4);
 assert.deepEqual(s.rail.built,[]);assert.equal(s.rail.resources.rail,0);
 assert.equal(s.candidate.authority,'NONE');
});
test('playable source-owned 007 rail route actually satisfies generated optional game objective',async()=>{
 const source=railFixture(),r=await forge(source);
 const candidate=r.candidates.find(x=>x.template==='SECOND_TRACK');assert.ok(candidate);
 let s=startVariant(await receive(candidate,source,'ADMIT'));
 for(let i=0;i<8&&s.phase==='PLAYING';i++){
  const tip=suggest(s);assert.ok(tip.action,tip.title);
  s=playVariant(s,tip.action).state;
 }
 assert.equal(s.phase,'LOCAL_VARIANT_GOAL_MET');assert.ok(progress(s).complete);
 const receipt=variantReturn(s);assert.equal(receipt.status,'FICTIONAL_UNVERIFIED');
 assert.equal(receipt.physicalDeeds,0);assert.equal(receipt.blockchainMints,0);
});
test('worker-dignity variant needs a circle, audited claim and a real modeled craft',async()=>{
 const source=kingdomFixture(),candidate=(await forge(source)).candidates[0];
 let s=startVariant(await receive(candidate,source,'ADMIT'));
 s=playVariant(s,{kind:'circle'}).state;
 assert.equal(progress(s).complete,false);
 for(let i=0;i<7&&s.phase==='PLAYING';i++)s=playVariant(s,suggest(s).action).state;
 assert.equal(s.phase,'LOCAL_VARIANT_GOAL_MET');
 assert.equal(s.rail.claim.audited,true);assert.equal(s.rail.resources.blueprint,1);
 assert.equal(variantReturn(s).realWorkerConsents,0);
});
test('audit stays disputed and refusal is not a resource transfer',async()=>{
 const source=railFixture();const candidate=(await forge(source)).candidates.find(x=>x.template==='LEDGER_DAY');
 assert.ok(candidate);let s=startVariant(await receive(candidate,source,'ADMIT'));
 s=playVariant(s,{kind:'rail',move:{kind:'audit'}}).state;
 assert.equal(s.rail.claim.authority,'DISPUTED_NO_STOCK');
 assert.equal(s.rail.claim.observed,39);
 assert.equal(s.rail.resources.wood,2);
 s=playVariant(s,{kind:'circle'}).state;
 assert.equal(s.phase,'LOCAL_VARIANT_GOAL_MET');
});
test('a game cannot silently run arbitrary movement commands',async()=>{
 const source=railFixture(),candidate=(await forge(source)).candidates[0];
 const s=startVariant(await receive(candidate,source,'ADMIT'));
 assert.throws(()=>playVariant(s,{kind:'exec',code:'fetch(\"https://example.com\")'}),/UNKNOWN_VARIANT_ACTION/);
 assert.throws(()=>playVariant(s,{kind:'rail',move:{kind:'mint',amount:100}}),/Unknown action/);
});

test('privacy-minimized portable packet recreates same source-bound candidate for independent local receiver',async()=>{
 for(const record of [railFixture(),kingdomFixture()]){
  const minimal=(await import('../forge.mjs')).minimizeRecord(record);
  const originals=(await forge(record)).candidates;
  const recovered=(await forge(minimal)).candidates;
  assert.deepEqual(recovered,originals);
  assert.equal((await receive(originals[0],minimal,'ADMIT')).status,'ADMIT_LOCAL_FICTION_ONLY');
 }
});

test('a completed new game can seed another generation without copying inventory or original authority',async()=>{
 const record=railFixture(),first=(await forge(record)).candidates.find(c=>c.template==='SECOND_TRACK');
 let s=startVariant(await receive(first,record,'ADMIT'));
 while(s.phase==='PLAYING')s=playVariant(s,suggest(s).action).state;
 const returnTicket=variantReturn(s);
 const next=await forge(returnTicket.originalGame);
 assert.equal(next.status,'HOLD_PLAYER_CHOICE');
 assert.equal(next.candidates.length,3);
 assert.notEqual(next.sourceDigest,first.sourceDigest);
 assert.equal(next.candidates[0].externalAuthority,undefined);
 assert.equal(next.candidates[0].physicalDeeds,0);
});
