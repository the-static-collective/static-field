import {
  SEEDS,composeSeedplate,createRun,replayRun,appendRunEvent,exportRun,importRun,exportCompositionRecipe,
} from "./seedplate.mjs";
import {hotspotActions,projectListeningRoom} from "./room-projection.mjs";
import {createListeningRoom} from "./listening-room.mjs";

const STORE="static-play.seedplate-001.local-run.v1";
const $=(selector)=>document.querySelector(selector);
const node=(tag,cls="",text="")=>{
  const element=document.createElement(tag);
  if(cls)element.className=cls;
  if(text)element.textContent=text;
  return element;
};
const button=(label,cls,handler)=>{
  const element=node("button",cls,label);
  element.type="button";
  element.addEventListener("click",handler);
  return element;
};
const addText=(container,tag,cls,text)=>container.append(node(tag,cls,text));
const selectedSeeds=new Set(["grace","toaster"]);
let visualLead="grace",run=null,chosenAction=null,focusedCandidate=null,noteDraft="";
let roomEnabled=false,roomRenderer=null,roomStartToken=0,roomInfo="";
try{
  const stored=window.localStorage.getItem(STORE);
  if(stored){
    const parsed=importRun(stored);
    run=parsed;
    selectedSeeds.clear();
    parsed.composition.seedIds.forEach(id=>selectedSeeds.add(id));
    visualLead=parsed.composition.visualLead;
  }
}catch(error){
  console.warn("A local seedplate save was not usable; beginning with fresh seeds.",error);
}

function renderDonors(){
  const parent=$("#donor-cards");parent.replaceChildren();
  for(const seed of SEEDS){
    const label=node("label","donor-card");
    const input=node("input");input.type="checkbox";input.checked=selectedSeeds.has(seed.id);
    input.setAttribute("aria-label",`Include ${seed.title}`);
    input.addEventListener("change",()=>{
      if(input.checked)selectedSeeds.add(seed.id);else selectedSeeds.delete(seed.id);
      if(!selectedSeeds.has(visualLead))visualLead=[...selectedSeeds][0]??"grace";
      renderDonors();renderLead();
    });
    const desc=node("div");
    addText(desc,"b","",seed.title);
    addText(desc,"span","",seed.mechanic);
    label.append(input,desc);parent.append(label);
  }
  $("#compose-button").disabled=selectedSeeds.size<2||selectedSeeds.size>4;
}
function renderLead(){
  const select=$("#visual-lead");select.replaceChildren();
  for(const seed of SEEDS.filter(seed=>selectedSeeds.has(seed.id))){
    const option=node("option","",`${seed.title} · ${seed.skin}`);
    option.value=seed.id;
    option.selected=visualLead===seed.id;
    select.append(option);
  }
  select.value=selectedSeeds.has(visualLead)?visualLead:select.options[0]?.value??"";
}
$("#visual-lead").addEventListener("change",event=>{visualLead=event.target.value;});
function error(message){
  const element=$("#stage-error");
  element.textContent=message;element.hidden=!message;
}
function commit(event){
  try {
    const next=appendRunEvent(run,event);
    run=next;
    window.localStorage.setItem(STORE,exportRun(next));
    chosenAction=null;focusedCandidate=null;noteDraft="";
    render();
  }catch(failure){error(failure instanceof Error?failure.message:String(failure));}
}
$("#compose-button").addEventListener("click",()=>{
  try {
    if(run?.events.length&&!window.confirm("Start a new local room? Your current local play trail will be replaced."))return;
    closeSpatial();
    const composition=composeSeedplate([...selectedSeeds],{visualLead});
    run=createRun(composition);
    window.localStorage.setItem(STORE,exportRun(run));
    chosenAction=null;focusedCandidate=null;noteDraft="";
    $("#composer").open=false;
    render();
    $("#stage").scrollIntoView({block:"start",behavior:"smooth"});
  }catch(failure){error(failure instanceof Error?failure.message:String(failure));}
});
$("#recipe-button").addEventListener("click",async()=>{
  const status=$("#recipe-status");
  if(!run){status.textContent="Compose a room first.";return;}
  const recipe=exportCompositionRecipe(run.composition);
  try{
    await navigator.clipboard.writeText(recipe);
    status.textContent="Recipe copied. This carries UX ideas, not donor code or world authority.";
  }catch{
    window.prompt("Copy this seed recipe to carry it elsewhere:",recipe);
    status.textContent="The copyable recipe was opened. No donor runtime was connected.";
  }
});
$("#reset-button").addEventListener("click",()=>{
  if(run?.events.length&&!window.confirm("Clear your local play trail and start another composition?"))return;
  closeSpatial();
  run=null;chosenAction=null;focusedCandidate=null;noteDraft="";
  window.localStorage.removeItem(STORE);
  $("#composer").open=true;render();
});

function closeSpatial(){
  roomStartToken+=1;
  roomEnabled=false;
  if(roomRenderer){roomRenderer.dispose();roomRenderer=null;}
}
function inspectRoomObject(id){
  if(!run || !roomEnabled || !roomRenderer)return;
  const view=replayRun(run);
  if(view.stage!=="room")return;
  const actions=hotspotActions(view,id);
  if(!actions.length)return;
  chosenAction=actions[0].id;
  renderStage();
  $("#stage-actions").scrollIntoView({block:"nearest",behavior:
    window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
for(const button of document.querySelectorAll("[data-hotspot]")){
  button.addEventListener("click",()=>inspectRoomObject(button.dataset.hotspot));
}
$("#room-toggle").addEventListener("click",async()=>{
  if(roomEnabled){closeSpatial();roomInfo="";chosenAction=null;render();return;}
  if(!run || !["toaster","groove"].every(seed=>run.composition.seedIds.includes(seed)))return;
  roomEnabled=true;roomInfo="Preparing the room…";
  const token=++roomStartToken;
  render();
  try{
    const instance=await createListeningRoom({
      mount:$("#room-view"),
      onInspect:inspectRoomObject,
      onFallback:message=>{
        if(roomEnabled){closeSpatial();roomInfo=message;render();}
      },
    });
    if(!roomEnabled || token!==roomStartToken){instance.dispose();return;}
    roomRenderer=instance;
    roomInfo="";
    chosenAction=null;
    render();
  }catch(failure){
    if(token!==roomStartToken)return;
    closeSpatial();
    roomInfo="3D is unavailable here. The simple game remains fully playable.";
    console.warn("Optional listening-room renderer was unavailable",failure);
    render();
  }
});
function syncSpatial(view){
  const eligible=!!view&&["toaster","groove"].every(seed=>view.composition.seedIds.includes(seed));
  const sw=$("#room-switch"),toggle=$("#room-toggle");
  sw.hidden=!eligible;
  toggle.textContent=roomEnabled?"Back to simple view":"Visit the listening room";
  toggle.setAttribute("aria-pressed",String(roomEnabled));
  $("#room-switch-status").textContent=eligible?roomInfo:"";
  const active=eligible&&roomEnabled&&!!roomRenderer;
  $("#room-surface").hidden=!active;
  $("#stage").classList.toggle("is-spatial",active);
  if(active){
    const projection=projectListeningRoom(view);
    roomRenderer.update(projection);
    for(const element of document.querySelectorAll("[data-hotspot]")){
      element.disabled=!hotspotActions(view,element.dataset.hotspot).length;
    }
  }
}

function decorateStage(view){
  const stage=$("#stage");const palette=view?.composition.palette??
    composeSeedplate(["grace","toaster"]).palette;
  for(const [name,value] of Object.entries(palette)){
    stage.style.setProperty(`--${name}`,value);
  }
  stage.dataset.lead=view?.composition.visualLead??"grace";
}
function makeActionCard(action,active,onSelect){
  const element=button("","action-card"+(active?" active":""),onSelect);
  element.setAttribute("aria-expanded",String(active));
  const top=node("span","action-top");
  top.append(node("span","seed-dot",SEEDS.find(seed=>seed.id===action.seedId)?.short[0]??"?"));
  top.append(node("span","action-name",action.label));
  element.append(top,node("span","action-description",action.detail));
  return element;
}
function showRoom(view){
  $("#stage-eyebrow").textContent=`${view.composition.title} · ${view.beats} OF 4 BEATS REMAIN`;
  const last=view.memory.at(-1);
  $("#stage-title").textContent=roomEnabled&&roomRenderer?"The listening room":
    last?"The room is different now.":"An ordinary room. Several possibilities.";
  $("#stage-body").textContent=roomEnabled&&roomRenderer?
    "The picture machine shows what might be. The listening chair holds what you have noticed. Choose one to look closer.":
    last?`${last.text}. You are here again with the next move still yours.`:
    "The chair is empty, a light is on, and no one has decided what this gathering will become. What will you put into the room?";
  $("#stage-status").textContent=`${view.composition.donorRoles.length} donor voices · one local encounter`;
  const actions=$("#stage-actions"),preview=$("#stage-preview");
  actions.replaceChildren();preview.replaceChildren();
  const shown=roomEnabled&&roomRenderer?
    view.choices.filter(action=>action.id===chosenAction):view.choices;
  for(const action of shown){
    actions.append(makeActionCard(action,chosenAction===action.id,()=>{
      chosenAction=chosenAction===action.id?null:action.id;
      renderStage();
    }));
  }
  const selected=view.choices.find(action=>action.id===chosenAction);
  if(!selected)return;
  const box=node("div","preview-box");
  addText(box,"p","eyebrow","BEFORE YOU COMMIT");
  addText(box,"h3","",selected.label);
  addText(box,"p","",selected.detail);
  addText(box,"p","",selected.id==="toaster:propose"?
    "Looking costs no beat. Only an exact KEEP admits one of the pictures.":
    "This action uses one of the four available beats. No other need vanishes because you chose it.");
  if(selected.id==="groove:note"){
    const label=node("label","","Write one note (kept in this browser only)");
    label.htmlFor="note-draft";
    const textarea=node("textarea");textarea.id="note-draft";textarea.maxLength=120;
    textarea.placeholder="What should this room remember about your visit?";
    textarea.value=noteDraft;textarea.addEventListener("input",()=>noteDraft=textarea.value);
    box.append(label,textarea);
  }
  const row=node("div","action-buttons");
  row.append(button("Do it","primary-button",()=>commit({
    type:"act",actionId:selected.id,
    ...(selected.id==="groove:note"?{note:noteDraft}:{}),
  })));
  row.append(button("Not now","button-quiet",()=>{chosenAction=null;renderStage();}));
  box.append(row);preview.append(box);
}
function showCandidates(view){
  $("#stage-eyebrow").textContent=`${view.composition.title} · POSSIBILITIES ONLY`;
  $("#stage-title").textContent="Three pictures. No promises.";
  $("#stage-body").textContent="The machine offers scenes it could imagine. Notice one, keep that exact one, or ask for another family. Looking does not add anything to the room's history.";
  $("#stage-status").textContent=`${2-view.scrapes} more SCRAPE${view.scrapes===1?"":"s"} available · no preference inferred`;
  const list=$("#stage-actions"),preview=$("#stage-preview");list.replaceChildren();preview.replaceChildren();
  for(const candidate of view.candidates){
    list.append(makeActionCard({
      seedId:"toaster",label:candidate.title,detail:candidate.text,id:candidate.id,
    },candidate.id===focusedCandidate,()=>{
      focusedCandidate=candidate.id===focusedCandidate?null:candidate.id;
      renderStage();
    }));
  }
  const box=node("div","preview-box");
  if(focusedCandidate){
    const candidate=view.candidates.find(item=>item.id===focusedCandidate);
    addText(box,"p","eyebrow","FOCUSED · NOT YET KEPT");
    addText(box,"h3","",candidate.title);
    addText(box,"p","",candidate.text);
  }else{
    addText(box,"p","", "Choose one picture to focus on, or set the whole family aside.");
  }
  const row=node("div","action-buttons");
  if(focusedCandidate)row.append(button("KEEP this scene","primary-button",()=>commit({type:"keep",candidateId:focusedCandidate})));
  if(view.scrapes<2)row.append(button("SCRAPE · another family","button-quiet",()=>commit({type:"scrape"})));
  row.append(button("Set them aside","button-quiet",()=>commit({type:"pass"})));
  box.append(row);preview.append(box);
}
function showReceipt(view){
  $("#stage-eyebrow").textContent="ONE THING HAPPENED · ONE RECEIPT";
  $("#stage-title").textContent=view.receipt.title;
  $("#stage-body").textContent=view.receipt.body;
  $("#stage-status").textContent=`${view.beats} beat${view.beats===1?"":"s"} remain · source: ${view.receipt.source}`;
  $("#stage-actions").replaceChildren();
  const preview=$("#stage-preview");preview.replaceChildren();
  const box=node("div","preview-box");
  addText(box,"p","eyebrow","THE ROOM REMEMBERS");
  addText(box,"p","",view.receipt.kind==="refusal"?
    "No proposed scene was adopted; the local refusal remains visible as a moment of play.":
    "An attributable local turn was retained. Its donor never becomes the owner of another donor's story.");
  box.append(button(view.beats===0?"See what the room kept":"Return to the room","primary-button",()=>commit({type:"continue"})));
  preview.append(box);
}
function showEnding(view){
  $("#stage-eyebrow").textContent="THE ROOM TAKES ATTENDANCE";
  $("#stage-title").textContent="A room you couldn't have made alone.";
  $("#stage-body").textContent=`Four beats passed. ${view.memory.length} local move${view.memory.length===1?" was":"s were"} carried. An unchosen proposal stays unchosen. A quiet moment was still a moment.`;
  $("#stage-status").textContent=view.composition.title+" · local experiment complete";
  $("#stage-actions").replaceChildren();
  const preview=$("#stage-preview");preview.replaceChildren();
  const box=node("div","preview-box");
  addText(box,"p","eyebrow","WHAT CAME HOME");
  for(const item of view.memory.slice(-4))addText(box,"p","",`• ${item.text}`);
  addText(box,"p","", "None of these local fictional moments constitutes a real-world event or a cross-project world admission.");
  box.append(button("Compose another room","primary-button",()=>{$("#composer").open=true;$("#composer").scrollIntoView({block:"start",behavior:"smooth"});}));
  preview.append(box);
}
function renderStage(){
  error("");
  if(!run){
    decorateStage(null);
    $("#stage-eyebrow").textContent="YOUR NEW ROOM";
    $("#stage-title").textContent="A room is waiting.";
    $("#stage-body").textContent="Pick at least two seeds to see what they can make together. Every donor will bring something you can actually do.";
    $("#stage-status").textContent="11 possible two-to-four-seed combinations";
    $("#stage-actions").replaceChildren();
    $("#stage-preview").replaceChildren();
    syncSpatial(null);
    return;
  }
  const view=replayRun(run);decorateStage(view);
  switch(view.stage){
    case "room":showRoom(view);break;
    case "candidates":showCandidates(view);break;
    case "receipt":showReceipt(view);break;
    case "ending":showEnding(view);break;
    default:throw new Error("Unknown room stage");
  }
  syncSpatial(view);
}
function renderJournal(){
  const list=$("#journal-list"),sources=$("#source-links");list.replaceChildren();sources.replaceChildren();
  if(!run){addText(list,"li","","No moments retained yet.");return;}
  const view=replayRun(run);
  if(!view.memory.length)addText(list,"li","","Nothing has entered the room's memory yet. Proposals alone don't count.");
  for(const item of view.memory.slice(-8)){
    const li=node("li");
    addText(li,"b","",item.text);
    addText(li,"span","",`${SEEDS.find(seed=>seed.id===item.seedId)?.title??item.seedId} · ${item.kind}${item.parentId?` · from ${item.parentId}`:""}`);
    list.append(li);
  }
  addText(sources,"p","eyebrow","BORROWED GRAMMAR · ORIGINAL SOURCES");
  for(const seed of SEEDS.filter(seed=>view.composition.seedIds.includes(seed.id))){
    const a=node("a","",`${seed.title} ↗`);
    a.href=seed.source;a.target="_blank";a.rel="noopener noreferrer";sources.append(a);
  }
}
function render(){
  renderDonors();renderLead();renderStage();renderJournal();
}
render();
