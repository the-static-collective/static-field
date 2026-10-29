import test from 'node:test';
import assert from 'node:assert/strict';
import {proposePartyDoors,previewFreshParty} from '../field-bridge.mjs';
test('original Living Deck ECHO source compiles an 008 → 007 held invitation',()=>{
 const r=proposePartyDoors({firstId:'cicada',secondId:'radio',stickerId:'echo'},['INSPECT']);
 assert.equal(r.status,'HOLD_PLAYER_CHOICE');assert.equal(r.source.sourceVerification,'unavailable');
 assert.deepEqual(r.doors.map(x=>x.id),['008','007']);
 assert.equal(r.physicalDeeds,0);assert.equal(r.externalActions,0);
 assert.equal(r.source.receipt.acceptedIntoSharedWorld,false);
});
test('original Living Deck composer refuses reversed ECHO before party doors',()=>{
 const r=proposePartyDoors({firstId:'radio',secondId:'cicada',stickerId:'echo'});
 assert.equal(r.status,'REFUSE_UNSUPPORTED_COMPOSITION');assert.equal(r.playAllowed,false);
 assert.equal(r.code,'missing-signal-adapter');
});
test('GROW opens both alternate games without field authority',()=>{
 const r=proposePartyDoors({firstId:'cup',secondId:'door',stickerId:'grow'});
 assert.deepEqual(r.doors.map(x=>x.id),['007','008']);
 assert.equal(r.authority,'NONE');assert.equal(r.pending.length,4);
});
test('fresh party previews use both real game engines; no real deeds',()=>{
 for(const id of ['007','008']){
  const p=previewFreshParty(id,2);assert.equal(p.physicalDeeds,0);
  assert.equal(p.realPersonConsentCount,0);
  assert(p.version.includes(id));
 }
 assert.throws(()=>previewFreshParty('009'),/Unsupported/);
 assert.throws(()=>previewFreshParty('008',0),/Unsupported/);
});
