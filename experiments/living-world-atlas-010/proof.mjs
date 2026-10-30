import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {makeTable,demoPartyRecord,sendOffer,receiveOffer,decide,fork,act,returnFromWorld,composeWorlds,inspect,validateTable} from './atlas.mjs';
import {suggest,progress} from '../expansion-forge-009/forge.mjs';
export async function prove(){
 let a=makeTable('A','Porch Station'),b=makeTable('B','Moon Lantern'),c=makeTable('C','Ash Orchard');
 const sent=await sendOffer(a,demoPartyRecord(),0);a=sent.table;
 b=(await receiveOffer(b,sent.offer)).table;c=(await receiveOffer(c,sent.offer)).table;
 const accepted=await decide(b,b.inbox[0].id,'ADMIT','Lamplight Line');b=accepted.table;
 c=(await decide(c,c.inbox[0].id,'REFUSE')).table;
 b=(await fork(b,accepted.world.id,'Alternative Tomorrow')).table;
 const world=b.worlds[0];
 for(let i=0;i<20&&b.worlds[0].play.phase==='PLAYING';i++)b=act(b,world.id,suggest(b.worlds[0].play).action).table;
 const returned=await returnFromWorld(b,world.id);b=returned.table;
 a=(await receiveOffer(a,returned.offer)).table;
 a=(await decide(a,a.inbox[0].id,'ADMIT','Returned Railway')).table;
 const joined=await composeWorlds(b,b.worlds.map(w=>w.id),'Two Independent Futures');b=joined.table;
 const statuses=await Promise.all([a,b,c].map(validateTable));if(!statuses.every(s=>s.ok))throw Error('ATLAS_VALIDATION_FAILED');
 return {schema:'static-field.atlas-proof/010',fixture:'FICTION_ONLY',proofs:{
  samePacketTwoReceivers:sent.offer.digest,
  bDecision:b.inbox[0].status,cDecision:c.inbox[0].status,
  aReturnedWorlds:a.worlds.length,bForkedWorlds:b.worlds.length,cWorlds:c.worlds.length,
  firstGameCompleted:progress(b.worlds[0].play).complete,
  forkIndependentInventory:b.worlds[1].play.rail.resources.rail===0,
  twoWorldOverlayCreated:b.compositions.length===1,
  tablesValid:statuses.every(s=>s.ok)},
  views:{A:inspect(a),B:inspect(b),C:inspect(c)},packet:sent.offer,returnPacket:returned.offer};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+resolve(process.argv[1])).href){const dir=resolve(dirname(fileURLToPath(import.meta.url)),'examples');mkdirSync(dir,{recursive:true});const data=await prove();writeFileSync(resolve(dir,'three-table-proof.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data.proofs,null,2));}
