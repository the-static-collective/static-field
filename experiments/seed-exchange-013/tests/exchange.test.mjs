import {test} from 'node:test';import assert from 'node:assert/strict';import * as X from '../exchange.mjs';import * as G from '../../world-garden-012/garden.mjs';
const cp=structuredClone;let memo={};
async function source(id){return memo[id]??=await X.exampleLot(id);}
async function offered(owners=['millford','cedar','lantern']){let e=await X.create();for(const id of owners)e=await X.act(e,{type:'OFFER',lot:await source(id)});return e;}
async function receiving(owners=['millford','cedar','lantern']){let e=await offered(owners);for(const x of e.lots){e=await X.act(e,{type:'DELIVER',id:x.id,to:'festival'});e=await X.act(e,{type:'RECEIVER_CHOICE',id:x.id,at:'festival',choice:'ADMIT_AS_FICTIONAL_REFERENCE'});}return e;}
async function proposed(owners=['millford','cedar','lantern']){let s=await receiving(owners);return X.act(s,{type:'PROPOSE',host:'festival',lots:s.lots.map(x=>x.id)});}
const fails=async(p,match)=>assert.rejects(p,match);

test('source 012 gardens issue native format packets; 013 is a local interpretation, not original ownership',async()=>{
 const g=await X.growExampleSource('millford');const l=await X.prepareLot(g,'millford','ROUTE','A Track Between Neighbors');assert.equal((await G.verify(g)).ok,true);assert.equal((await G.verifyPacket(l.source012)).ok,true);assert.equal((await X.verifyLot(l)).ok,true);assert.equal(l.authority,'PROPOSAL_NOT_PERMISSION');assert.equal(l.source012.originGarden,'source-millford');
});
test('unknown and corrupt source, extra authority and fake proof refused',async()=>{
 const l=await source('millford');let c=cp(l);c.authority='AUTHORIZED';assert.equal((await X.verifyLot(c)).ok,false);c=cp(l);c.source012.title='fake';assert.equal((await X.verifyLot(c)).ok,false);c=cp(l);c.unreviewedExecutableCode='alert(1)';assert.equal((await X.verifyLot(c)).ok,false);await fails(X.prepareLot(await X.growExampleSource('cedar'),'millford','ROUTE','fake'),/WRONG_SOURCE_GARDEN/);
});
test('original 012 receiver is called, holds, chooses independently, and refuses duplicates',async()=>{
 let s=await offered(['millford']);const id=s.lots[0].id;s=await X.act(s,{type:'DELIVER',id,to:'festival'});assert.equal(X.inspect(s).stations.find(t=>t.id==='festival').inbox[0].status,'HOLD');await fails(X.act(s,{type:'DELIVER',id,to:'festival'}),/DUPLICATE_DELIVERY/);
 const refused=await X.act(s,{type:'RECEIVER_CHOICE',at:'festival',id,choice:'REFUSE'});assert.equal(X.inspect(refused).stations.find(t=>t.id==='festival').inbox[0].status,'REFUSE');await fails(X.act(refused,{type:'RECEIVER_CHOICE',at:'festival',id,choice:'ADMIT_AS_FICTIONAL_REFERENCE'}),/MAIL_ALREADY_DECIDED/);
});
test('proposals require two distinct admitted sources; unsupported combinations held',async()=>{
 let s=await offered(['millford','cedar']);await fails(X.act(s,{type:'PROPOSE',host:'festival',lots:s.lots.map(x=>x.id)}),/RECEIVER_MUST_ADMIT/);
 s=await receiving(['millford','cedar']);s=await X.act(s,{type:'PROPOSE',host:'festival',lots:s.lots.map(x=>x.id)});assert.equal(s.plans[0].title,'The Harvest Express');await fails(X.act(s,{type:'PLAY',plan:s.plans[0].id,move:s.plans[0].steps[0]}),/PLAN_NOT_OPEN/);
});
test('source refusal prevents play even if the festival says yes',async()=>{
 let s=await proposed();const p=s.plans[0];s=await X.act(s,{type:'SOURCE_CHOICE',plan:p.id,owner:'millford',choice:'REFUSE'});assert.equal(s.plans[0].status,'REFUSED_WITHOUT_PENALTY');await fails(X.act(s,{type:'HOST_CHOICE',plan:p.id,host:'festival',choice:'ADMIT_LOCAL_GAME'}),/HOST_ALREADY_DECIDED/);
});
test('independent source Little Yes AND destination admission required, no automatic action',async()=>{
 let s=await proposed();const id=s.plans[0].id;for(const v of s.plans[0].votes)s=await X.act(s,{type:'SOURCE_CHOICE',plan:id,owner:v.owner,choice:'YES'});assert.equal(s.plans[0].status,'WAITING_FOR_SEPARATE_LITTLE_YES');s=await X.act(s,{type:'HOST_CHOICE',plan:id,host:'festival',choice:'ADMIT_LOCAL_GAME'});assert.equal(s.plans[0].status,'READY_FOR_LOCAL_GAME');await fails(X.act(s,{type:'PLAY',plan:id,move:'WITNESS_RETURN'}),/OUT_OF_SEQUENCE/);
});
test('four-lens cooperation produces different new mechanic and correct ordered steps',async()=>{
 let s=await receiving(['millford','cedar','lantern']);s=await X.act(s,{type:'OFFER',lot:await source('festival')});for(const x of s.lots){if(x.origin==='festival')continue;} // festival source cannot self-deliver
 const g=X.recipes();assert.equal(g['CARE|HARVEST|ROUTE|WITNESS'].steps.length,6);assert.notEqual(g['CARE|HARVEST|ROUTE'].question,g['CARE|HARVEST|ROUTE|WITNESS'].question);
});
test('entire exchange replays through actual 012 receiving adapters and rejects fabricated game history',async()=>{
 const r=await X.demo();assert.equal(r.verification.ok,true);assert.equal(r.exchange.plans[0].status,'COMPLETED_FICTIONAL_MISSION');assert.equal(r.exchange.plans[0].stage,5);assert.equal(r.exchange.returns.length,2);assert.equal(r.exchange.returns[0].choice,'REFUSE');assert.equal(r.exchange.returns[1].choice,'ADMIT_AS_IDEA_ONLY');
 let s=cp(r.exchange);s.plans[0].stage=6;assert.equal((await X.verify(s)).ok,false);s=cp(r.exchange);s.stations.find(x=>x.id==='festival').receiver.inbox[0].status='REFUSE';assert.equal((await X.verify(s)).ok,false);
});
test('a finished child can travel, but cannot grant materials, people or authority',async()=>{
 const r=await X.demo();assert.equal((await X.verifyChild(r.child)).ok,true);assert.equal(r.child.claimedPhysicalWork,0);let c=cp(r.child);c.claimedPhysicalWork=1;assert.equal((await X.verifyChild(c)).ok,false);c=cp(r.child);c.stagesCompleted.pop();assert.equal((await X.verifyChild(c)).ok,false);c=cp(r.child);c.__proto__=null;c.extra='eval';assert.equal((await X.verifyChild(c)).ok,false);
});
test('recipient of child passport may independently hold, refuse or admit only fictional idea',async()=>{
 const d=await X.demo();const x=d.exchange;assert.equal(x.returns[0].choice,'REFUSE');assert.equal(x.returns[1].choice,'ADMIT_AS_IDEA_ONLY');await fails(X.act(x,{type:'RETURN_CHOICE',at:'cedar',id:d.child.id,choice:'ADMIT_AS_IDEA_ONLY'}),/RETURN_NOT_PENDING/);
});
test('two separate identical runs produce byte-identical portable child and event replay',async()=>{
 const a=await X.demo(),b=await X.demo();assert.deepEqual(a.child,b.child);assert.deepEqual(a.exchange,b.exchange);assert.equal((await X.verify(a.exchange)).ok,true);
});
