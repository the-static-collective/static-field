// Offline-only browser adapter. Local example tables share one screen; export/import
// enables a physical file handoff. No server, auth, network, or shared canonical state.
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const short=s=>String(s).replace(/^sha256:/,'').slice(0,12);
let tables={},active='A';
const save=()=>{try{localStorage.setItem('static-field.atlas-010.local-demos',JSON.stringify({tables,active}));}catch{}};
const button=(label,action,extra='',clazz='')=>`<button class="${clazz}" data-action="${action}" ${extra}>${esc(label)}</button>`;
const setStatus=(s)=>{$('status').textContent=s;};
async function reset(){
 let a=ATLAS.makeTable('A','Porch Station'),b=ATLAS.makeTable('B','Moon Lantern'),c=ATLAS.makeTable('C','Ash Orchard');
 const outgoing=await ATLAS.sendOffer(a,ATLAS.demoPartyRecord(),0);a=outgoing.table;
 b=(await ATLAS.receiveOffer(b,outgoing.offer)).table;
 c=(await ATLAS.receiveOffer(c,outgoing.offer)).table;
 const bFirst=await ATLAS.decide(b,b.inbox[0].id,'ADMIT','Lamplight Line');b=bFirst.table;
 b=(await ATLAS.fork(b,bFirst.world.id,'Alternative Tomorrow')).table;
 c=(await ATLAS.decide(c,c.inbox[0].id,'REFUSE')).table;
 tables={A:a,B:b,C:c};active='B';save();setStatus('Synthetic demonstration: two worlds in Moon Lantern, Ash Orchard independently refused. The post office never overrides the receiver.');render();
}
function exportJson(name,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function getSelected(){return tables[active];}
function render(){const t=getSelected();if(!t)return;
 $('tabs').innerHTML=Object.values(tables).map(x=>button(x.label,x.id===active?'none':'tab',`data-id="${esc(x.id)}"`,x.id===active?'selected':'' )).join('');
 const v=ATLAS.inspect(t);
 $('tableName').textContent=t.label;
 $('count').textContent=`${t.worlds.length} world${t.worlds.length===1?'':'s'} · ${t.inbox.filter(m=>m.status==='HOLD').length} pending letters · ${t.compositions.length} constellations`;
 $('worlds').innerHTML=v.worlds.length?v.worlds.map(w=>{
  const p=w.progress;const pct=p.steps.filter(x=>x.done).length+'/'+p.steps.length;
  return `<article class="world"><div class="worldhead"><div class="marker">WORLD / ${esc(w.id.slice(-6).toUpperCase())}</div><h3>${esc(w.label)}</h3><span class="badge">${esc(w.template.replaceAll('_',' '))}</span></div>
  <p class="small">${esc(w.ancestors.length?w.ancestors.join(' ← '):'Root world · no inherited work or inventory')}</p>
  <p class="vital">${esc(p.sourceEvent?.label||'A new idea travels')}</p>
  <div class="checklist">${p.steps.map(s=>`<span class="${s.done?'done':'waiting'}">${s.done?'✓':'○'} ${esc(s.type==='RESOURCE'?`${s.n} ${s.id}`:s.type==='RAIL'?`Route ${s.id}`:s.type)}</span>`).join('')}</div>
  <p class="small">${esc(w.phase)} · ${pct} objectives · fictional only</p>
  ${w.suggestion?`<p class="tip"><b>Conductor suggests:</b> ${esc(w.suggestion.title)}<br><span>${esc(w.suggestion.reason)}</span></p>`:'<p class="tip">This local expansion goal is complete or closed. You can still return a proposed story.</p>'}
  <div class="row">${w.suggestion?.action?button('Try suggested move','move',`data-world="${esc(w.id)}"`,'primary'):''}${button('Fork this world','fork',`data-world="${esc(w.id)}"`)}${button('Prepare new expansion','return',`data-world="${esc(w.id)}"`)}</div></article>`;
 }).join(''):'<p class="empty">No world admitted here. A received envelope needs this table’s explicit Little Yes first.</p>';
 $('mail').innerHTML=t.inbox.length?t.inbox.map(m=>`<article class="letter"><span class="tag ${m.status==='REFUSE'?'rejected':''}">${esc(m.status)}</span><div><b>${esc(m.offer.candidate.title)}</b><p class="small">From: ${esc(m.offer.sourceWorld?.tableId||'Unverified example')} · ${esc(short(m.offer.digest))}</p></div><div class="row">${m.status==='HOLD'?button('Admit game-only','admit',`data-mail="${esc(m.id)}"`,'primary')+button('Refuse','refuse',`data-mail="${esc(m.id)}"`):'<span class="small">Locally decided · no remote override</span>'}</div></article>`).join(''):'<p class="empty">Your postbox is empty.</p>';
 $('outbox').innerHTML=t.outbox.length?t.outbox.map((offer,i)=>`<article class="letter"><div><b>${esc(offer.candidate.title)}</b><p class="small">${esc(short(offer.digest))} · draft only</p></div><div class="row">${button('Download letter','download',`data-index="${i}"`)}${Object.values(tables).filter(x=>x.id!==active).map(x=>button('Offer to '+x.id,'deliver',`data-index="${i}" data-target="${x.id}"`)).join('')}</div></article>`).join(''):'<p class="empty">No proposed exports from this table yet.</p>';
 $('compositions').innerHTML=v.compositions.length?v.compositions.map(c=>`<article class="constellation"><strong>${esc(c.label)}</strong> <span class="badge">${c.complete?'Both goals met':'Two independent goals open'}</span><p class="small">${esc(c.worlds.join(' + '))}</p><p>Not a merged inventory or a transfer of authority. Each world remains free to develop differently.</p></article>`).join(''):'<p class="empty">Two independently admitted worlds can form a shared challenge without surrendering their individual game histories.</p>';
 $('compose').disabled=t.worlds.length<2;
 $('compose').textContent=t.worlds.length<2?'Need two local worlds':'Compose first two worlds';
 $('log').textContent=t.events.slice(-5).map(e=>e.type.replaceAll('_',' ')+' '+(e.worldId||'')).join(' · ');
 save();
}
async function handle(e){const b=e.target.closest('button[data-action]');if(!b||b.disabled||b.dataset.action==='none')return;
 try{
  const act=b.dataset.action;let t=getSelected();const w=b.dataset.world;
  if(act==='tab'){active=b.dataset.id;render();return;}
  if(act==='reset'){if(!confirm('Reset the three fictional example tables? Your browser-local demonstration state will be replaced.'))return;await reset();return;}
  if(act==='admit'){const name=prompt('Name this new local world','A New Little Yes');if(name===null)return;const r=await ATLAS.decide(t,b.dataset.mail,'ADMIT',name,4);tables[active]=r.table;setStatus('New independent fictional world admitted by '+t.label+'.');}
  if(act==='refuse'){tables[active]=(await ATLAS.decide(t,b.dataset.mail,'REFUSE')).table;setStatus('Refusal retained. Other tables remain unaffected.');}
  if(act==='fork'){const name=prompt('Name the independent fork','A Different Tomorrow');if(name===null)return;tables[active]=(await ATLAS.fork(t,w,name)).table;setStatus('Fork created with a fresh game ledger; parent ancestry retained.');}
  if(act==='move'){const world=t.worlds.find(x=>x.id===w);const tip=FORGE.suggest(world.play);if(!tip.action)throw Error('No supported action');tables[active]=ATLAS.act(t,w,tip.action).table;setStatus(tip.title+' — recorded in this local world only.');}
  if(act==='return'){const r=await ATLAS.returnFromWorld(t,w,0);tables[active]=r.table;setStatus('Prepared a new source-derived, held expansion offer from this world. Download it or hand it to another table.');}
  if(act==='download'){const p=t.outbox[Number(b.dataset.index)];exportJson(`little-yes-${active}-${short(p.digest)}.json`,p);setStatus('Envelope downloaded. File content alone cannot prove sender identity.');}
  if(act==='deliver'){const target=b.dataset.target;const packet=t.outbox[Number(b.dataset.index)];const r=await ATLAS.receiveOffer(tables[target],packet);tables[target]=r.table;setStatus(target+' received a proposal; it must independently decide. '+r.status);}
  if(act==='compose'){const ids=t.worlds.slice(0,2).map(x=>x.id);const name=prompt('Name the combined two-world challenge','The Twin Stations');if(name===null)return;tables[active]=(await ATLAS.composeWorlds(t,ids,name)).table;setStatus('An optional shared challenge was composed. Two sovereign worlds, no shared spending.');}
  if(act==='exportTable'){exportJson('little-yes-table-'+active+'.json',t);setStatus('Exported local simulated atlas snapshot, not authenticated identity.');}
  if(act==='import'){const raw=$('importText').value.trim();if(raw.length>190000)throw Error('Import exceeds 190 KB');const packet=JSON.parse(raw);const r=await ATLAS.receiveOffer(t,packet);tables[active]=r.table;setStatus('Receive result: '+r.status);$('importText').value='';}
  render();
 }catch(err){setStatus('HOLD / REFUSE: '+err.message);}
}
document.addEventListener('click',handle);
$('fileImport').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>190000)throw Error('File too large');$('importText').value=await f.text();setStatus('Envelope loaded for review. Click Inspect & receive to validate.');}catch(err){setStatus('HOLD: '+err.message);}e.target.value='';});
(async()=>{try{const saved=JSON.parse(localStorage.getItem('static-field.atlas-010.local-demos')||'null');if(saved&&saved.tables&&['A','B','C'].every(x=>saved.tables[x]?.schema===ATLAS.ATLAS_SCHEMA)){const checks=await Promise.all(Object.values(saved.tables).map(ATLAS.validateTable));if(checks.every(x=>x.ok)){tables=saved.tables;active=saved.active in tables?saved.active:'A';setStatus('Local fictional session restored. No outside synchronization.');render();return;}}}catch{}await reset();})();
