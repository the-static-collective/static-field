import test from 'node:test';
import assert from 'node:assert/strict';
import {makeGame,step,offer,connected,shortestPlan,goals,exportRecord,LINKS,VERSION} from './game.mjs';
const doIt=(s,kind,id)=>step(s,{kind,id}).state;
test('new party is finite, entirely fictional and has no credit',()=>{
 const s=makeGame(4);assert.equal(s.version,VERSION);assert.equal(s.phase,'PLAYING');assert.equal(s.resources.firewood,0);
 assert.equal(s.claim.authority,'DISPUTED_NO_STOCK');assert.equal(Object.values(goals(s)).filter(Boolean).length,0);
});
test('rail cannot be built without fictional little yes',()=>{
 const s=makeGame();assert.throws(()=>doIt(s,'build','mb'),/Little Yes/);
 const a=doIt(s,'agree','mb');assert.throws(()=>doIt(a,'build','mb'),/rail tokens/);
});
test('committing two towns does not fabricate external rights',()=>{
 let s=makeGame();s=doIt(s,'agree','mb');s=doIt(s,'craft','rail');s=doIt(s,'build','mb');
 assert(s.built.includes('mb'));assert.equal(exportRecord(s).authority,'NO_REAL_WORLD_CLAIMS');assert.equal(s.relics[0].blockchainMint,false);
 assert.equal(s.resources.rail,1);
});
test('consumed resources cannot be spent twice',()=>{
 let s=makeGame();s=doIt(s,'craft','rail');assert.equal(s.resources.wood,1);assert.equal(s.resources.ore,1);
 s=doIt(s,'craft','rail');assert.equal(s.resources.wood,0);assert.equal(s.resources.ore,0);
 assert.throws(()=>doIt(s,'craft','rail'),/Missing materials/);
});
test('unbuilt routes do not carry food or firewood',()=>{
 let s=makeGame();s=doIt(s,'craft','firewood');assert.throws(()=>doIt(s,'ship','firewood'),/No built route/);
});
test('disputed 42 versus 39 WOOD never creates spendable wood',()=>{
 let s=makeGame();const before=s.resources.wood;s=doIt(s,'audit');assert.equal(s.resources.wood,before);
 assert.equal(s.claim.audited,true);assert.equal(s.relics.at(-1).details.spendableStockCredited,0);
});
test('pathfinding respects constructed railway and routes',()=>{
 let s=makeGame();assert(!connected(s,'millford','lantern'));assert(shortestPlan(s,'millford','lantern').via.length>0);
 s={...s,built:['mb','bo','ol']};assert(connected(s,'millford','lantern'));assert(!connected(s,'cedar','lantern'));
});
test('resource harvest is bounded to declared fictional tile stock',()=>{
 let s=makeGame(6);s.stock.millford=1;s=doIt(s,'gather','millford');
 assert.equal(s.stock.millford,0);assert.throws(()=>doIt(s,'gather','millford'),/no remaining/);
});
test('party seats rotate, bounded events and rounds',()=>{
 let s=makeGame(3);for(let i=0;i<3;i++)s=doIt(s,'gather','bridgeport');
 assert.equal(s.round,2);assert.equal(s.activeSeat,0);assert.equal(s.actionsLeft,3);assert(s.lastRoll>=2&&s.lastRoll<=12);
});
test('a party following the director can reach cooperative victory',()=>{
 let s=makeGame(4);
 for(let i=0;i<36&&s.phase==='PLAYING';i++){
   const choice=offer(s).suggested;
   assert(choice,`Missing a next move at action ${i}`);
   s=step(s,choice).state;
 }
 assert.equal(s.phase,'WON');
 assert.deepEqual(goals(s),{railway:true,warmth:true,food:true});
 assert.equal(s.relics.at(-1).type,'COMMONS_EDITION');
});
test('dispatcher offers concrete next proposed action',()=>{
 let s=makeGame();let p=offer(s);assert.equal(p.suggested?.kind,'agree');
 s=doIt(s,'agree',p.suggested.id);p=offer(s);assert.equal(p.suggested?.kind,'craft');
});
test('unsupported actions fail without mutating state',()=>{
 const s=makeGame();const before=JSON.stringify(s);
 assert.throws(()=>step(s,{kind:'burn_real_wood'}),/Unknown action/);
 assert.equal(JSON.stringify(s),before);
});
