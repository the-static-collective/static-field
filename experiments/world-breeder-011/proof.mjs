import {writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {demo} from './breeder.mjs';
const result=await demo();
if(!result.validation.ok || !result.inspection.progress.complete)throw Error('NOT_A_VERIFIED_LOCAL_DEMO');
const document={schema:'static-field.world-breeder-proof/011',synthetic:true,authority:'NONE',
  title:result.inspection.title,sourceParents:result.inspection.parents,recipe:result.inspection.recipe,
  decisions:result.inspection.choices,childId:result.inspection.childId,
  addedMechanic:'LISTEN + AUDIT before BUILD, followed by an explicit RELAY',
  originalNativeOwnerSteps:result.moves,progress:result.inspection.progress,
  checks:{nativeAtlasReplay:true,sourceCandidateReconstruction:true,localIndependentVotes:true,realWorldEffects:0},
  caveat:'Local fictional worlds only; digest checks do not authenticate human consent or actual construction.'};
const out=join(dirname(fileURLToPath(import.meta.url)),'examples','third-world-proof.json');
writeFileSync(out,JSON.stringify(document,null,2)+'\n');console.log('Saved',out);
