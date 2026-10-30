import {readFileSync,writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {dirname,join} from 'node:path';
const dir=dirname(fileURLToPath(import.meta.url)),read=p=>readFileSync(join(dir,p),'utf8');
const unexport=t=>t.replace(/\bexport (?=(?:const|function|class|async function)\b)/g,'');
const rail=unexport(read('../little-yes-field-008/rail/game.mjs'));
let forge=unexport(read('../expansion-forge-009/forge.mjs'));
forge=forge.replace(/^import .*?;\s*\n/m,'const {makeGame,step:railwayStep,offer:railwayOffer,LINKS,exportRecord:railwayExport}=RAIL;\n');
let atlas=unexport(read('../living-world-atlas-010/atlas.mjs'));atlas=atlas.replace(/^import .*?;\s*\n/gm,'');
atlas="const {forge,receive,minimizeRecord,startVariant,playVariant,progress,suggest,variantReturn}=FORGE;\nconst {makeGame,step:railwayStep,exportRecord}=RAIL;\n"+atlas;
let breeder=unexport(read('../world-breeder-011/breeder.mjs'));breeder=breeder.replace(/^import .*?;\s*\n/gm,'');
breeder="const ATLAS=ATLAS_WORLD;\nconst {suggest:forgeSuggest}=FORGE;\n"+breeder;
let garden=unexport(read('./garden.mjs'));garden=garden.replace(/^import .*?;\s*\n/gm,'');garden='const A=ATLAS_WORLD,B=BREEDER;\n'+garden;
const parts={
 '/*__RAIL__*/':`const RAIL=(()=>{\n${rail}\nreturn {makeGame,step,offer,exportRecord,LINKS};\n})();`,
 '/*__FORGE__*/':`const FORGE=(()=>{\n${forge}\nreturn {forge,receive,minimizeRecord,startVariant,playVariant,progress,suggest,variantReturn};\n})();`,
 '/*__ATLAS__*/':`const ATLAS_WORLD=(()=>{\n${atlas}\nreturn {ATLAS_SCHEMA,makeTable,demoPartyRecord,propose,verifyOffer,sendOffer,receiveOffer,decide,fork,act,returnFromWorld,composeWorlds,inspect,validateTable};\n})();`,
 '/*__BREEDER__*/':`const BREEDER=(()=>{\n${breeder}\nreturn {SCHEMA,CROSS_SCHEMA,makeHabitat,propose,nominate,respond,birth,inspect,move,next,verify,demo};\n})();`,
 '/*__GARDEN__*/':`const GARDEN=(()=>{\n${garden}\nreturn {SCHEMA,MAIL_SCHEMA,create,sourceProposal,inspect,act,compatible,suggested,verify,issuePacket,verifyPacket,demo};\n})();`,
 '/*__APP__*/':read('./app.js')};
let html=read('./ui-template.html');for(const [marker,s] of Object.entries(parts)){if(!html.includes(marker))throw Error('MISSING_BUILD_MARKER_'+marker);html=html.replace(marker,s);}html=html.trimEnd()+'\n';writeFileSync(join(dir,'index.html'),html);console.log('Static Field 012 offline HTML:',Buffer.byteLength(html),'bytes');
