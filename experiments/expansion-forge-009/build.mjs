import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const grab=p=>readFileSync(join(root,p),'utf8');
function replaceExports(content){return content.replace(/\bexport (?=(const|function|class|async function)\b)/g,'');}
const rail=replaceExports(grab('../little-yes-field-008/rail/game.mjs'));
let kingdom=grab('../little-yes-field-008/kingdom/kingdom.mjs');
kingdom=kingdom.replace(/^import .*? from .*?;\s*\n/m,`const {makeGame,step:railStep,goals:railGoals,offer:railOffer,exportRecord,VERSION:RAIL_VERSION,TOWNS,LINKS,RECIPES}=RAIL;\n`);
kingdom=replaceExports(kingdom);
let forge=grab('./forge.mjs');
forge=forge.replace(/^import .*? from .*?;\s*\n/m,`const {makeGame,step:railwayStep,offer:railwayOffer,LINKS,exportRecord:railwayExport}=RAIL;\n`);
forge=replaceExports(forge);
const railBlock=`const RAIL=(()=>{\n${rail}\nreturn {makeGame,step,offer,exportRecord,connected,goals,LINKS,TOWNS,RECIPES};\n})();`;
const kingdomBlock=`const KINGDOM=(()=>{\n${kingdom}\nreturn {createParty,takeTurn,portableRecord};\n})();`;
const forgeBlock=`const FORGE=(()=>{\n${forge}\nreturn {forge,receive,minimizeRecord,startVariant,playVariant,progress,suggest,variantReturn};\n})();`;
let html=grab('./ui-template.html');
for(const [key,value] of Object.entries({'/*__INLINE_GAME__*/':railBlock,'/*__INLINE_KINGDOM__*/':kingdomBlock,'/*__INLINE_FORGE__*/':forgeBlock,'/*__APP__*/':grab('./app.js')})){
 if(!html.includes(key))throw Error('Missing inline target '+key);
 html=html.replace(key,value);
}
writeFileSync(join(root,'index.html'),html);
console.log('Built offline expansion forge',Buffer.byteLength(html),'bytes');
