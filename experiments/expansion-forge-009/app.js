const q=id=>document.getElementById(id);
let source=null, forged=null, active=null, lineage=[],chosen=null;
function say(msg,error=false){q('toast').textContent=msg;q('toast').style.color=error?'#eea58d':'#c4e1d0'}
function downloadJSON(name,value){const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function node(tag,text,className){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(className)x.className=className;return x;}
function demoRail(){let g=RAIL.makeGame(4);for(const a of [{kind:'audit'},{kind:'agree',id:'mb'},{kind:'craft',id:'rail'},{kind:'build',id:'mb'}])g=RAIL.step(g,a).state;return RAIL.exportRecord(g);}
function demoKingdom(){let s=KINGDOM.createParty(4);s=KINGDOM.takeTurn(s,{kind:'rail',move:{kind:'gather',id:'millford'}}).state;s=KINGDOM.takeTurn(s,{kind:'refuse',role:'forest'}).state;return KINGDOM.portableRecord(s);}
async function loadSource(record,label){
 source=record;active=null;chosen=null;q('playPanel').hidden=true;
 try{forged=await FORGE.forge(record);}catch(err){forged=null;q('candidates').replaceChildren(node('p','Source held: '+err.message,'muted'));q('sourceStatus').textContent='REFUSE / INVALID SOURCE';q('sourceStatus').className='status fail';return;}
 const status=forged.status==='HOLD_PLAYER_CHOICE'?'3 candidate expansion rules offered':'No completed source event yet';
 q('sourceStatus').textContent=label+' · '+status;
 q('sourceStatus').className='status '+(forged.candidates.length?'':'hold');
 q('sourceDigest').textContent='Source: '+(forged.sourceDigest||'not established');
 showCandidates();say(forged.candidates.length?'The mail carrier delivered three proposals. None has been admitted.':'Play a game action before composing a successor.',!forged.candidates.length);
}
function showCandidates(){
 const holder=q('candidates');holder.replaceChildren();
 if(!forged||!forged.candidates.length){holder.append(node('p','No admissible game history to build on yet.','muted'));return;}
 forged.candidates.forEach((c,i)=>{
  const card=node('article',undefined,'card');
  card.append(node('div','0'+(i+1)+' / '+c.lens,'tag'),node('h3',c.title),node('p',c.subtitle),node('div','SOURCE EVENT · '+c.seedEvent.at+'\n'+c.seedEvent.label,'seed'));
  const requirements=c.requirements.map(r=>r.type==='RAIL'?'Build route '+r.id:r.type==='RESOURCE'?'Collect '+r.n+' '+r.id:r.type==='AUDIT'?'Audit disputed wood':'Hold a fictional listening circle').join(' · ');
  card.append(node('p',requirements,'muted'));
  const btn=node('button','Choose this future ↗','btn');btn.addEventListener('click',()=>admit(i));card.append(btn);
  holder.append(card);
 });
}
async function admit(index){
 const c=forged?.candidates[index];if(!c)return;
 const rx=await FORGE.receive(c,source,'ADMIT');
 if(!rx.localPlayAllowed){say('Receiver refused: '+rx.status,true);return;}
 chosen=c;active=FORGE.startVariant(rx,4);
 lineage.push({sourceDigest:c.sourceDigest,candidateDigest:c.digest,title:c.title});
 q('playPanel').hidden=false;
 q('chosenName').textContent=c.title;q('chosenGoal').textContent=c.goal;
 say('One local game was accepted by an explicit player click. The source history is unchanged.');renderPlay();
 q('playPanel').scrollIntoView({block:'start',behavior:'smooth'});
}
function labelRequirement(r){if(r.type==='RAIL'){const e=RAIL.LINKS.find(x=>x.id===r.id);return 'Build '+(e?e.name:r.id);}
 if(r.type==='RESOURCE')return 'Hold '+r.n+' fictional '+r.id+' token'+(r.n===1?'':'s');
 if(r.type==='AUDIT')return 'Audit 42 claimed / 39 observed WOOD (no stock credited)';
 if(r.type==='CIRCLE')return 'Hold a voluntary, fictional table listening circle';
 return 'Unrecognized rule';}
function allMoves(){const moves=[{kind:'circle'}];const g=active.rail;
 for(const t of RAIL.TOWNS){if(g.stock[t.id]>0)moves.push({kind:'rail',move:{kind:'gather',id:t.id}});}
 if(!g.claim.audited)moves.push({kind:'rail',move:{kind:'audit'}});
 for(const edge of RAIL.LINKS){if(!g.consents.includes(edge.id)&&!g.built.includes(edge.id))moves.push({kind:'rail',move:{kind:'agree',id:edge.id}});
 if(g.consents.includes(edge.id)&&!g.built.includes(edge.id)&&g.resources.rail>=edge.cost)moves.push({kind:'rail',move:{kind:'build',id:edge.id}});}
 for(const recipe of RAIL.RECIPES)if(Object.entries(recipe.inputs).every(([name,amount])=>g.resources[name]>=amount))moves.push({kind:'rail',move:{kind:'craft',id:recipe.id}});
 for(const id of ['firewood','food'])if(g.resources[id]>=2&&g.delivered[id]<2)moves.push({kind:'rail',move:{kind:'ship',id}});
 return moves;
}
function renderPlay(){if(!active)return;
 const p=FORGE.progress(active),g=active.rail;
 const status=p.complete?'✓ Expansion win recorded':active.phase==='PLAYING'?'Episode in progress · round '+g.round+' · '+g.actionsLeft+' shared turns left':'Episode ended; optional goal remains unresolved';
 q('inventory').replaceChildren(...Object.entries(g.resources).map(([k,n])=>node('span',k.toUpperCase()+' '+n,'chip')),node('span','ROUND '+g.round+' / '+g.maxRounds,'chip'),node('span',status,'chip'));
 const list=node('ul',undefined,'checks');for(const r of p.steps){const li=node('li',(r.done?'✓ ':'○ ')+labelRequirement(r),r.done?'done':'pending');list.append(li)}q('progress').replaceChildren(list);
 const tip=FORGE.suggest(active);q('suggestionTitle').textContent=tip.title;q('suggestionReason').textContent=tip.reason||'';
 q('suggestionAction').disabled=active.phase!=='PLAYING'||!tip.action;
 q('suggestionAction').textContent=tip.action?.kind==='circle'?'Hold the fictional circle':'Try suggested game move';
 q('skip').disabled=active.phase!=='PLAYING';
 q('manualAction').disabled=active.phase!=='PLAYING';
 const sel=q('manualMove');sel.replaceChildren();for(const m of allMoves()){
  const label=m.kind==='circle'?'Hold listening circle':m.move.kind+' · '+(RAIL.TOWNS.find(x=>x.id===m.move.id)?.name||RAIL.LINKS.find(x=>x.id===m.move.id)?.name||m.move.id||'disputed 42/39');
  const op=node('option',label);op.value=JSON.stringify(m);sel.append(op);
 }
 const log=q('playLog');log.replaceChildren(...active.localHistory.slice(-11).map(x=>node('p',x.type+' · '+x.text)));
 q('lineage').textContent='Source → '+active.candidate.sourceDigest+'\nChosen future → '+active.candidate.digest+'\nGenerations at this table → '+lineage.length;
}
function play(action){if(!active)return;
 if(active.phase!=='PLAYING'){say('This branch is finished; export it or forge a new one.',true);return;}
 try{const r=FORGE.playVariant(active,action);active=r.state;renderPlay();say(r.status==='LOCAL_VARIANT_GOAL_MET'?'A new fictional game reached its optional goal. Try forging its next generation.':'One fictional game move recorded. The conductor is offering the next step.');}
 catch(err){say('HOLD / '+err.message,true);}
}
q('demoRail').addEventListener('click',()=>loadSource(demoRail(),'007 synthetic rail episode'));
q('demoKingdom').addEventListener('click',()=>loadSource(demoKingdom(),'008 synthetic worker refusal'));
q('suggestionAction').addEventListener('click',()=>play(FORGE.suggest(active).action));
q('manualAction').addEventListener('click',()=>{try{play(JSON.parse(q('manualMove').value))}catch(err){say('Invalid game action',true)}});
q('skip').addEventListener('click',()=>say('No action was taken. Not now is a valid choice.'));
q('print').addEventListener('click',()=>window.print());
q('exportReturn').addEventListener('click',()=>{if(!active)return;downloadJSON('static-field-unsent-expansion-return.json',FORGE.variantReturn(active));say('Exported a fictional return. Nothing was submitted or credited.')});
q('recurse').addEventListener('click',async()=>{
 if(!active)return;const record=FORGE.variantReturn(active).originalGame;
 await loadSource(record,'009 successor · from the actual previous game state');
 say('The next generation is derived from an actual fictional game history. Source history and authority are not inherited.');
});
q('exportCandidate').addEventListener('click',()=>{if(!active||!source)return;
 const packet={format:'static-field.expansion-cartridge/009',status:'HELD_UNVERIFIED',version:1,
  sourceRecord:FORGE.minimizeRecord(source),candidate:active.candidate,realWorldAuthority:'NONE',
  warning:'The receiver must independently regenerate and compare this proposal. This is a game-only file.'};
 downloadJSON('static-field-expansion-cartridge-009.json',packet);say('Exported a minimized, unverified cartridge. It contains no private extra fields.');
});
async function readFile(file){if(!file)return null;if(file.size>180000)throw Error('Maximum file is 180 KB');return JSON.parse(await file.text());}
q('sourceFile').addEventListener('change',async e=>{try{const data=await readFile(e.target.files[0]);if(data)await loadSource(data,'Imported local party record')}catch(err){say('REFUSE: '+err.message,true)}finally{e.target.value=''}});
q('packetFile').addEventListener('change',async e=>{try{const packet=await readFile(e.target.files[0]);if(!packet||packet.format!=='static-field.expansion-cartridge/009')throw Error('Unknown cartridge format');
 const rx=await FORGE.receive(packet.candidate,packet.sourceRecord,'HOLD');if(rx.status!=='HOLD_PLAYER_CHOICE')throw Error(rx.status);
 await loadSource(packet.sourceRecord,'Verified content-consistency of imported fictional cartridge');
 if(!forged.candidates.some(c=>c.digest===packet.candidate.digest))throw Error('Source/candidate mismatch');
 say('Source and proposal match; player approval still required. Select the corresponding card.');
 }catch(err){say('REFUSE / '+err.message,true)}finally{e.target.value=''}});
loadSource(demoRail(),'007 synthetic rail episode');
