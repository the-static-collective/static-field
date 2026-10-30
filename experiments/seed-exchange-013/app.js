// Static Field 013 / seed-exchange offline table UI. Browsers never contact a server.
(()=>{
const E=EXCHANGE;
let state=null,busy=false;
const $=x=>document.getElementById(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=x=>String(x||'').slice(0,19)+'…';
const card=(k,v)=>`<div class="mini"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
const button=(act,label,cl='')=>`<button class="btn ${cl}" data-do="${esc(act)}">${esc(label)}</button>`;
function notice(msg,err=false){const o=$('status');o.textContent=msg;o.dataset.error=err?'true':'false';}
function download(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function updated(e){state=await E.act(state,e);await paint();notice(`${e.type} recorded. Synthetic game state independently replayed.`);}
async function paint(){if(!state)return;const i=E.inspect(state),tip=E.next(state);
$('stats').innerHTML=[['Garden stations',i.stations.length],['Seed parcels',i.lots.length],['New games',i.plans.length],['Recorded moves',i.events]].map(x=>card(...x)).join('');
$('nextlabel').textContent=tip.label;$('nextstep').disabled=!(tip.event||tip.kind==='OFFER');
const recipe=E.recipes();
$('stations').innerHTML=i.stations.map(t=>{
const sent=i.lots.filter(x=>x.origin===t.id);const inbox=t.inbox||[];
return `<article class="station"><div class="station-top"><span class="monogram">${esc(t.name.charAt(0))}</span><div><p class="kicker">${esc(t.role)}</p><h3>${esc(t.name)}</h3></div></div><p>${esc(t.theme)}</p><div class="chipline"><span class="chip">${esc(t.lens)}</span><span class="chip">${sent.length} source seed</span><span class="chip">${inbox.length} received</span></div>${sent.map(l=>`<div class="mail"><div><b>${esc(l.title)}</b><small>source-012 · ${esc(short(l.sourceDigest))}</small></div>${button(`lot-export|${l.id}`,'Export parcel')}</div>`).join('')||'<p class="quiet">A native World Garden seed can grow here.</p>'}
${t.id==='festival'?`<div class="receive-list">${inbox.map(m=>`<div class="mail"><div><b>${esc(m.title)}</b><small>${esc(m.from)} → ${esc(m.status)}</small></div><div class="row">${m.status==='HOLD'?button(`inbox|${t.id}|${m.lotId}|ADMIT_AS_FICTIONAL_REFERENCE`,'Admit idea','positive')+button(`inbox|${t.id}|${m.lotId}|REFUSE`,'Refuse','warn'):''}</div></div>`).join('')}</div>`:''}
<div class="row bottom">${!sent.length?button(`grow|${t.id}`,'Grow & offer seed','positive'):''}${t.id!=='festival'&&sent.length&&!i.stations.find(x=>x.id==='festival').inbox.some(x=>x.lotId===sent[0].id)?button(`deliver|${sent[0].id}`,'Mail to Festival Table'):''}</div></article>`;
}).join('');
$('postbox').innerHTML=i.lots.length?i.lots.map(l=>`<div class="parcel"><span class="chip">${esc(l.lens)}</span><strong>${esc(l.title)}</strong><small>${esc(l.origin)} · sha256 origin packet</small></div>`).join(''):'<p class="quiet">Nothing in the mailbag yet. Every parcel can be carried as a local JSON file.</p>';
$('plans').innerHTML=i.plans.length?i.plans.map(p=>`<article class="plan"><div class="plan-heading"><span class="chip">${esc(p.recipe)}</span><span class="chip">${esc(p.status)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.question)}</p><p class="quiet">Source parents: ${esc(p.votes.map(x=>x.owner).join(' + '))}. No real-world authority travels with this plan.</p><div class="votes">${p.votes.map(v=>`<div class="vote"><span>${esc(v.owner)} · ${esc(v.choice)}</span>${v.choice==='HOLD'&&p.status==='WAITING_FOR_SEPARATE_LITTLE_YES'?button(`vote|${p.id}|${v.owner}|YES`,'Little Yes','positive')+button(`vote|${p.id}|${v.owner}|REFUSE`,'Refuse','warn'):''}</div>`).join('')}<div class="vote"><span>Festival Table · ${esc(p.hostChoice)}</span>${p.hostChoice==='HOLD'&&p.status==='WAITING_FOR_SEPARATE_LITTLE_YES'?button(`host|${p.id}|ADMIT_LOCAL_GAME`,'Admit game','positive')+button(`host|${p.id}|REFUSE`,'Refuse','warn'):''}</div></div><div class="timeline">${p.steps.map(x=>`<span class="timelock ${x.done?'done':''}">${x.done?'✓':'○'} ${esc(x.step.replaceAll('_',' '))}</span>`).join('')}</div><div class="row">${['READY_FOR_LOCAL_GAME','IN_PLAY'].includes(p.status)?button(`play|${p.id}`,'Play next story move','positive'):''}${p.status==='COMPLETED_FICTIONAL_MISSION'?button(`child-export|${p.id}`,'Export new baby-world seed','positive')+button(`field-export|${p.id}`,'Print real-world question (proposal)'):''}</div></article>`).join(''):'<p class="quiet">To invent a new game, Festival Table must independently admit at least two different station seeds.</p>';
const admitted=i.stations.find(x=>x.id==='festival').inbox.filter(m=>m.status==='ADMIT_AS_FICTIONAL_REFERENCE').map(m=>m.lotId);
$('compose-list').innerHTML=admitted.map(id=>{const l=i.lots.find(x=>x.id===id);return `<label class="check"><input type="checkbox" class="recipe-choice" value="${esc(id)}" checked><span><strong>${esc(l?.title||id)}</strong><br><small>${esc(l?.origin||'?')} / ${esc(l?.lens||'?')}</small></span></label>`;}).join('')||'<p class="quiet">At least two independently admitted parcels needed.</p>';
$('compose').disabled=admitted.length<2;
$('returns').innerHTML=i.returns.length?i.returns.map(r=>`<div class="mail"><div><b>${esc(r.title)}</b><small>${esc(r.at)} · ${esc(r.choice)}</small></div>${r.choice==='HOLD'?button(`return|${r.at}|${r.id}|ADMIT_AS_IDEA_ONLY`,'Admit idea','positive')+button(`return|${r.at}|${r.id}|REFUSE`,'Refuse','warn'):''}</div>`).join(''):'<p class="quiet">Another table can receive a completed child seed and independently decide. A hash verifies only file integrity.</p>';
$('journal').textContent=state.events.slice(-15).map((e,index)=>`${String(i.events-Math.min(15,i.events)+index+1).padStart(2,'0')} ${e.type} ${e.owner||e.to||e.at||''}`).join('\n')||'The room is waiting for its first seed.';
const v=await E.verify(state);$('proof').textContent=v.ok?`✓ Source 012 receiving events independently replayed · ${v.events} game events · 0 real deeds`:`✕ ${v.reason}`;
}
async function go(code){const [cmd,...args]=code.split('|');if(cmd==='next'){const tip=E.next(state);if(tip.kind==='OFFER')await updated({type:'OFFER',lot:await E.exampleLot(tip.owner)});else if(tip.event)await updated(tip.event);return;}
if(cmd==='demo'){const d=await E.demo();state=d.exchange;await paint();notice('Fictional four-table festival complete: one table refused its baby-world mail; another admitted only an idea.');return;}
if(cmd==='reset'){state=await E.create();await paint();notice('Four new fictional independent tables; no inherited inventory.');return;}
if(cmd==='grow'){const id=args[0];await updated({type:'OFFER',lot:await E.exampleLot(id)});return;}
if(cmd==='deliver'){await updated({type:'DELIVER',id:args[0],to:'festival'});return;}
if(cmd==='inbox'){await updated({type:'RECEIVER_CHOICE',at:args[0],id:args[1],choice:args[2]});return;}
if(cmd==='vote'){await updated({type:'SOURCE_CHOICE',plan:args[0],owner:args[1],choice:args[2]});return;}
if(cmd==='host'){await updated({type:'HOST_CHOICE',plan:args[0],host:'festival',choice:args[1]});return;}
if(cmd==='play'){const p=state.plans.find(x=>x.id===args[0]);await updated({type:'PLAY',plan:p.id,move:p.steps[p.stage]});return;}
if(cmd==='compose'){const ids=[...document.querySelectorAll('.recipe-choice:checked')].map(x=>x.value);await updated({type:'PROPOSE',host:'festival',lots:ids});return;}
if(cmd==='save'){download('static-field-013-exchange-save.json',JSON.stringify(state,null,2)+'\n');notice('Replayable session saved. Not a real-world receipt.');return;}
if(cmd==='lot-export'){const p=state.lots.find(x=>x.id===args[0]);download('seed-'+p.origin+'.json',JSON.stringify(p,null,2)+'\n');return;}
if(cmd==='child-export'||cmd==='field-export'){const c=await E.issueChild(state,args[0]);if(cmd==='child-export'){download('seed-exchange-013-child.json',JSON.stringify(c,null,2)+'\n');notice('Portable child-game idea exported, not published.');return;}
const p=state.plans.find(x=>x.id===args[0]);const text=['SEED EXCHANGE 013 · REAL WORLD QUESTION CARD','',p.title,p.question,'','Possible first conversation: Who in our actual community would voluntarily want to investigate this?','','Source stations (fictional): '+p.votes.map(x=>x.owner).join(', '),'Evidence required: local consent, verified resources, safety and purpose.','Status: UNSENT DRAFT / ZERO PHYSICAL WORK','','Do not infer actual participants, materials, wages or commitments from game state.'].join('\n');download('field-question-013.txt',text,'text/plain');return;}
if(cmd==='return'){await updated({type:'RETURN_CHOICE',at:args[0],id:args[1],choice:args[2]});return;}
}
let busyFlag=false;document.addEventListener('click',async e=>{const b=e.target.closest('button[data-do]');if(!b||busyFlag)return;busyFlag=true;try{b.disabled=true;await go(b.dataset.do);}catch(err){notice('HOLD / '+String(err.message),true);}finally{busyFlag=false;if(state)await paint();}});
$('uploadLot').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>4000)throw Error('PARCEL_TOO_LARGE');const lot=JSON.parse(await f.text());await updated({type:'OFFER',lot});notice('Local source packet was checked and registered as a proposal. Sender identity is NOT authenticated.');}catch(err){notice('REFUSE / '+String(err.message),true);}finally{e.target.value='';}});
$('uploadChild').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>3500)throw Error('CHILD_TOO_LARGE');const child=JSON.parse(await f.text());const to=$('receiver').value;await updated({type:'RECEIVE_CHILD',at:to,child});notice('Child seed held pending independent local choice.');}catch(err){notice('REFUSE / '+String(err.message),true);}finally{e.target.value='';}});
$('uploadSave').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>450000)throw Error('SAVE_TOO_LARGE');const s=JSON.parse(await f.text());const proof=await E.verify(s);if(!proof.ok)throw Error('NOT_REPLAYABLE_'+proof.reason);state=s;await paint();notice('Session restored after complete source-owned replay.');}catch(err){notice('REFUSE / '+String(err.message),true);}finally{e.target.value='';}});
(async()=>{try{state=await E.create();await paint();notice('Four local fictional stations are open. No game decision counts as real participant consent.');}catch(e){notice('HOLD / '+e.message,true);}})();
})();
