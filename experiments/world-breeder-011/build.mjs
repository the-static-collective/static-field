import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const dir=dirname(fileURLToPath(import.meta.url));const read=p=>readFileSync(join(dir,p),'utf8');
const unexport=t=>t.replace(/\bexport (?=(?:const|function|class|async function)\b)/g,'');
const rail=unexport(read('../little-yes-field-008/rail/game.mjs'));
let forge=unexport(read('../expansion-forge-009/forge.mjs'));
forge=forge.replace(/^import .*?;\s*\n/m,"const {makeGame,step:railwayStep,offer:railwayOffer,LINKS,exportRecord:railwayExport}=RAIL;\n");
let atlas=unexport(read('../living-world-atlas-010/atlas.mjs'));
atlas=atlas.replace(/^import .*?;\s*\n/gm,'');
atlas="const {forge,receive,minimizeRecord,startVariant,playVariant,progress,suggest,variantReturn}=FORGE;\nconst {makeGame,step:railwayStep,exportRecord}=RAIL;\n"+atlas;
let breeder=unexport(read('./breeder.mjs'));
breeder=breeder.replace(/^import .*?;\s*\n/gm,'');
breeder="const ATLAS=ATLAS_WORLD;\nconst {suggest:forgeSuggest}=FORGE;\n"+breeder;
const insert={
 '/*__RAIL__*/':`const RAIL=(()=>{\n${rail}\nreturn {makeGame,step,offer,exportRecord,LINKS};\n})();`,
 '/*__FORGE__*/':`const FORGE=(()=>{\n${forge}\nreturn {forge,receive,minimizeRecord,startVariant,playVariant,progress,suggest,variantReturn};\n})();`,
 '/*__ATLAS__*/':`const ATLAS_WORLD=(()=>{\n${atlas}\nreturn {ATLAS_SCHEMA,makeTable,demoPartyRecord,propose,verifyOffer,sendOffer,receiveOffer,decide,fork,act,returnFromWorld,composeWorlds,inspect,validateTable};\n})();`,
 '/*__BREEDER__*/':`const BREEDER=(()=>{\n${breeder}\nreturn {SCHEMA,CROSS_SCHEMA,makeHabitat,propose,nominate,respond,birth,inspect,move,next,verify,demo};\n})();`,
 '/*__APP__*/':read('./app.js')};
let html=read('./ui-template.html');for(const [key,value]of Object.entries(insert)){if(!html.includes(key))throw Error('Missing '+key);html=html.replace(key,value);}
html=html.trimEnd()+'\n';writeFileSync(join(dir,'index.html'),html,'utf8');console.log('011 offline HTML:',Buffer.byteLength(html));
