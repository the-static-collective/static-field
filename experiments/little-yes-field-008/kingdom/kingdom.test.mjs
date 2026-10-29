import test from 'node:test';
import assert from 'node:assert/strict';
import {createParty,takeTurn,status,portableRecord,VERSION} from './kingdom.mjs';
import {goals as railGoals} from '../rail/game.mjs';
const rail=move=>({kind:'rail',move});
test('008 uses source-owned 007 state',()=>{const p=createParty();assert.equal(p.version,VERSION);assert(railGoals(p.rail));});
test('worker roles gate physical game moves without spending them',()=>{
 const s=createParty();const x=takeTurn(s,rail({kind:'gather',id:'millford'}));
 assert.equal(x.blocked,true);assert.equal(x.state.rail.stock.millford,s.rail.stock.millford);
});
test('scripted agreement permits original 007 action, not real consent',()=>{
 let s=takeTurn(createParty(),rail({kind:'gather',id:'millford'})).state;
 s=takeTurn(s,{kind:'honor',role:'forest'}).state;
 s=takeTurn(s,rail({kind:'gather',id:'millford'})).state;
 assert.equal(s.rail.resources.wood,3);assert.equal(portableRecord(s).realWorkerConsents,0);
});
test('refusal persists and blocks work',()=>{
 let s=takeTurn(createParty(),rail({kind:'gather',id:'millford'})).state;
 s=takeTurn(s,{kind:'refuse',role:'forest'}).state;
 assert.equal(takeTurn(s,rail({kind:'gather',id:'millford'})).blocked,true);
 assert.throws(()=>takeTurn(s,{kind:'honor',role:'forest'}));
});
test('fictional labor remains unresolved even when railway goals are complete',()=>{
 let s=createParty();s.rail.built=['mc','ch','hl'];s.rail.resources.firewood=2;
 s=takeTurn(s,rail({kind:'ship',id:'firewood'})).state;
 s=takeTurn(s,{kind:'honor',role:'drivers'}).state;
 s=takeTurn(s,rail({kind:'ship',id:'firewood'})).state;
 assert.equal(status(s).ready,false);assert(s.cases.some(c=>c.role==='cleaners'));
});
test('no worker identity, real deed or economic claim is minted',()=>{
 const r=portableRecord(createParty());assert.equal(r.physicalDeeds,0);
 assert.deepEqual(r.workerIdentities,[]);assert.equal(r.realWorkerConsents,0);
});
