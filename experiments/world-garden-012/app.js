// Offline, user-directed garden console. No network or remote writes.
(()=>{
const garden=GARDEN;
let state=null,busy=false;
const by=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signal=(msg,error=false)=>{const x=by('status');x.textContent=msg;x.dataset.error=error?'true':'false';};
const doDownload=(filename,content)=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type:'application/json'}));a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);};
function miniButton(cmd,text,extra='',disabled=false){return `<button class="btn ${extra}" data-command="${esc(cmd)}" ${disabled?'disabled':''}>${esc(text)}</button>`;}
async function repaint(){if(!state)return;const v=garden.inspect(state),tip=garden.suggested(state),g=v.grafts[0];
by('counter').textContent=`${v.seeds.length} planted · ${v.grafts.length} grafted · ${v.worlds} local worlds · ${v.events} recorded moves`;
by('seeds').innerHTML=v.seeds.length?v.seeds.map(s=>`<article class="seed"><div class="glyph">${s.kind==='DIGNITY'?'✦':s.kind==='WITNESS'?'◈':'✳'}</div><div class="kind">${esc(s.kind)} / ${esc(s.source)}</div><h3>${esc(s.title)}</h3><p>${esc(s.status)} · ${esc(s.vote)}</p><p class="trace">${esc(s.sourceDigest.slice(0,31))}…</p><div class="actions">${!s.care.includes('OBSERVE')?miniButton(`tend:${s.id}:OBSERVE`,'Observe'):''}${!s.care.includes('TEND')?miniButton(`tend:${s.id}:TEND`,'Tend'):''}${s.care.length===2&&s.vote==='HOLD'?miniButton(`vote:${s.id}:YES`,'Little Yes','good')+miniButton(`vote:${s.id}:REFUSE`,'Refuse','danger'):''}</div></article>`).join(''):'<p class="empty">No seeds yet. Plant a source-linked discovery to begin.</p>';
const a=v.seeds.find(s=>s.kind==='DIGNITY'),b=v.seeds.find(s=>s.kind==='WITNESS');
by('compat').innerHTML=a&&b?`<strong>${esc(garden.compatible(state,a.id,b.id).mechanic||garden.compatible(state,a.id,b.id).reason)}</strong><br>Two independent seed decisions required. The original worlds retain their resources and ancestry.`:'Plant two complementary seeds to inspect their proposed relationship.';
by('graft').innerHTML=!g?'<p class="empty">No child world has been born. The garden will not breed without two nurtured seeds and two Little Yes decisions.</p>':`<h3>${esc(g.title)}</h3><p>Source child: <code>${esc(g.childId)}</code></p><p>Status: <strong>${esc(g.status)}</strong></p><div class="steps">${(g.sourceNative.progress?.steps||[]).map(x=>`<span class="step ${x.done?'done':''}">${x.done?'✓':'○'} ${esc(x.id)}</span>`).join('')}<span class="step ${g.acknowledged?'done':''}">${g.acknowledged?'✓':'○'} DISPUTE ACK</span><span class="step ${g.shared?'done':''}">${g.shared?'✓':'○'} SHARE BLUEPRINT</span></div>`;
by('next').innerHTML=`<strong>Garden suggestion:</strong> ${esc(tip.title)}. <span class="muted">You decide whether to take it.</span>`;
by('btn-next').disabled=!tip.event;
by('btn-plant-dignity').disabled=!!a;by('btn-plant-witness').disabled=!!b;by('btn-plant-atlas').disabled=v.seeds.some(s=>s.kind==='ATLAS');
by('btn-graft').disabled=!!g||!a||!b||a.vote!=='YES'||b.vote!=='YES';
by('btn-export').disabled=!g||!g.shared;
by('inbox').innerHTML=v.inbox.length?v.inbox.map(x=>`<article class="message"><b>${esc(x.title)}</b><p>${esc(x.from)} · ${esc(x.status)}</p>${x.status==='HOLD'?miniButton(`mail:${x.id}:ADMIT_AS_FICTIONAL_REFERENCE`,'Admit as idea only','good')+miniButton(`mail:${x.id}:REFUSE`,'Refuse','danger'):''}</article>`).join(''):'<p class="empty">Empty mailbag. Importing a packet never grants physical authority.</p>';
by('journal').textContent=state.events.slice(-14).map((e,i)=>`${String(state.events.length-Math.min(14,state.events.length)+i+1).padStart(2,'0')} ${e.type} ${e.kind||e.method||e.choice||''}`).join('\n')||'The soil is quiet.';
const checked=await garden.verify(state);by('validation').textContent=checked.ok?`✓ Replayed ${checked.events} events through the original engines`:`✕ Held: ${checked.reason}`;
}
async function update(event){state=await garden.act(state,event);await repaint();signal(`Recorded: ${event.type}. Fictional garden state replay-verified.`);}
async function action(code){if(code==='reset'){state=await garden.create();await repaint();signal('New local garden; no resources or authority inherited.');return;}
 if(code==='demo'){const run=await garden.demo();state=run.garden;await repaint();signal('Demonstration complete. A fictional blueprint is ready for optional export.');return;}
 if(code==='newReceiver'){state=await garden.create('other-garden','Ash Orchard');await repaint();signal('Independent receiving garden created. Different fictional authority domain, fresh ledger.');return;}
 if(code==='next'){const e=garden.suggested(state).event;if(e)await update(e);return;}
 if(code==='graft'){const a=state.seeds.find(x=>x.kind==='DIGNITY'),b=state.seeds.find(x=>x.kind==='WITNESS');if(a&&b)await update({type:'GRAFT',a:a.id,b:b.id,label:'The Witnessed Station'});return;}
 if(code==='export'){const g=state.grafts[0];const packet=await garden.issuePacket(state,g.id);doDownload('world-garden-012-pollen.json',JSON.stringify(packet,null,2)+'\n');signal('Pollen cartridge saved locally; not sent.');return;}
 if(code==='save'){doDownload('world-garden-012-local-save.json',JSON.stringify(state,null,2)+'\n');signal('Local replayable state saved.');return;}
 const parts=code.split(':');if(parts[0]==='plant')await update({type:'PLANT',kind:parts[1]});
 else if(parts[0]==='tend')await update({type:'TEND',id:parts[1],method:parts[2]});
 else if(parts[0]==='vote')await update({type:'CHOOSE',id:parts[1],choice:parts[2]});
 else if(parts[0]==='mail')await update({type:'MAIL_CHOICE',id:parts[1],choice:parts[2]});
}
document.addEventListener('click',async e=>{const b=e.target.closest('button[data-command]');if(!b||busy)return;busy=true;try{b.disabled=true;await action(b.dataset.command);}catch(error){signal('HOLD / '+String(error.message),true);}finally{busy=false;await repaint();}});
by('mailfile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>10000)throw Error('MAIL_TOO_LARGE');const p=JSON.parse(await f.text());await update({type:'RECEIVE',packet:p});signal('Pollen held for independent receiving-garden decision.');}catch(error){signal('REFUSE / '+error.message,true);}finally{e.target.value='';}});
by('savefile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>280000)throw Error('SAVE_TOO_LARGE');const s=JSON.parse(await f.text());const proof=await garden.verify(s);if(!proof.ok)throw Error('SAVE_NOT_REPLAYABLE_'+proof.reason);state=s;await repaint();signal('Local state restored after full replay validation.');}catch(error){signal('REFUSE / '+error.message,true);}finally{e.target.value='';}});
(async()=>{try{state=await garden.create();await repaint();signal('The World Garden is open. Three native original worlds provide the soil; no seed is automatically selected.');}catch(error){signal(error.message,true);}})();
})();
