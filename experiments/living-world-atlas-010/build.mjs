import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const dir=dirname(fileURLToPath(import.meta.url));const read=p=>readFileSync(join(dir,p),'utf8');
const unexport=t=>t.replace(/\bexport (?=(?:const|function|class|async function)\b)/g,'');
const rail=unexport(read('../little-yes-field-008/rail/game.mjs'));
let forge=unexport(read('../expansion-forge-009/forge.mjs'));
forge=forge.replace(/^import .*?;\s*\n/m,"const {makeGame,step:railwayStep,offer:railwayOffer,LINKS,exportRecord:railwayExport}=RAIL;\n");
let atlas=unexport(read('./atlas.mjs'));
atlas=atlas.replace(/^import .*?;\s*\n/gm,'');
atlas="const {forge,receive,minimizeRecord,startVariant,playVariant,progress,suggest,variantReturn}=FORGE;\nconst {makeGame,step:railwayStep,exportRecord}=RAIL;\n"+atlas;
const inserts={
 '/*__RAIL__*/':`const RAIL=(()=>{\n${rail}\nreturn {makeGame,step,offer,exportRecord,LINKS};\n})();`,
 '/*__FORGE__*/':`const FORGE=(()=>{\n${forge}\nreturn {forge,receive,minimizeRecord,startVariant,playVariant,progress,suggest,variantReturn};\n})();`,
 '/*__ATLAS__*/':`const ATLAS=(()=>{\n${atlas}\nreturn {ATLAS_SCHEMA,makeTable,demoPartyRecord,propose,verifyOffer,sendOffer,receiveOffer,decide,fork,act,returnFromWorld,composeWorlds,inspect,validateTable};\n})();`,
 '/*__APP__*/':read('./app.js')
};let html=read('./ui-template.html');for(const [token,part]of Object.entries(inserts)){if(!html.includes(token))throw Error('Missing '+token);html=html.replace(token,part);}
writeFileSync(join(dir,'index.html'),html,'utf8');console.log('Built single-file offline atlas:',Buffer.byteLength(html),'bytes');
