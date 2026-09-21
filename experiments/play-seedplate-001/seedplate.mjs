// STATIC PLAY SEEDPLATE 001: a portable, local-only UX composition experiment.
// No imported donor code, model generation, remote participants, or world admission.
export const SEEDS = Object.freeze([
  {
    id:"grace",title:"Grace · The House",short:"HOUSE",role:"scene and finite choice",
    impulse:"A little ordinary life with more obligations than time.",
    mechanic:"One situated act spends one beat; other needs remain open.",
    skin:"Warm editorial paper",palette:{paper:"#f8f1e6",ink:"#30251d",accent:"#ac654d",secondary:"#777f69"},
    source:"https://github.com/the-static-collective/full-measure-world-layer/pull/33",
  },
  {
    id:"toaster",title:"The Haunted Toaster",short:"TOAST",role:"bounded possibilities and explicit continuation",
    impulse:"A strange little apparatus shows several possible creatures.",
    mechanic:"Preview is not an event. KEEP accepts one candidate; SCRAPE selects a fresh family without learning a dislike.",
    skin:"Electric cinema on dark plum",palette:{paper:"#251c32",ink:"#fff5e9",accent:"#f3a477",secondary:"#b5a5c8"},
    source:"https://github.com/the-static-collective/the-haunted-toaster",
  },
  {
    id:"groove",title:"GrooveRooms",short:"ROOM",role:"the feeling of being somewhere together",
    impulse:"A room has a listening position, a place for an arrival, and a trace of what was left.",
    mechanic:"Listen or leave one local note; neither act invents a remote person's answer.",
    skin:"Deep warm listening studio",palette:{paper:"#202a2d",ink:"#f2eee2",accent:"#b8cb9f",secondary:"#b8a48c"},
    source:"https://github.com/the-static-collective/groove-rooms",
  },
  {
    id:"fork",title:"FORK!",short:"FORK",role:"intruder and traceable branch",
    impulse:"One card crosses the ordinary story and invites a different route.",
    mechanic:"An intruder starts a possibility; BEND attaches a local descendant to its actual earlier parent.",
    skin:"Bold zine cut-paper",palette:{paper:"#f4f1de",ink:"#1a1a2e",accent:"#ff3366",secondary:"#008eaf"},
    source:"https://github.com/the-static-collective/fork-EXCLAIM",
  },
]);
const lookup=new Map(SEEDS.map(seed=>[seed.id,seed]));
const motifGroups=[
  [
    {title:"The chair has a second shadow",text:"The porch chair appears twice in the proposed picture; the second shadow belongs to an empty place."},
    {title:"The lemon keeps the beat",text:"A lemon on the windowsill marks a rhythm nobody has played yet."},
    {title:"A porch light for a question",text:"A small light turns on for a guest who has not arrived."},
  ],
  [
    {title:"The room sings through the door",text:"A screen door becomes a quiet percussion instrument in a possible scene."},
    {title:"The cup carries a stranger's tune",text:"A chipped cup offers a melody without identifying its owner."},
    {title:"The road remembers a chord",text:"One familiar note seems to travel beside an ordinary road."},
  ],
  [
    {title:"An unfinished letter is listening",text:"The folded letter holds an unasked question, not an unseen reply."},
    {title:"Another chair at the table",text:"A place is made for somebody who may choose not to come."},
    {title:"A bell with no instruction",text:"The porch bell rings in the proposed scene. What it means is still undecided."},
  ],
];
const positiveInt=(n)=>Number.isInteger(n)&&n>=0;
const own=(x,key)=>Object.prototype.hasOwnProperty.call(x,key);
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

export function composeSeedplate(ids,{visualLead=ids?.[0]}={}) {
  assert(Array.isArray(ids)&&ids.length>=2&&ids.length<=4,"Choose two to four donor seeds");
  assert(new Set(ids).size===ids.length,"A donor cannot silently duplicate itself");
  assert(ids.every(id=>lookup.has(id)),"Unknown donor seed");
  assert(ids.includes(visualLead),"The visual lead must be a selected donor");
  const seeds=ids.map(id=>lookup.get(id));
  return {
    schema:"static-play-seedplate.composition.v1",
    id:ids.join("+")+"@"+visualLead,
    seedIds:[...ids],visualLead,
    title:seeds.map(seed=>seed.short).join(" × "),
    headline:seeds.length===2?"Two ordinary systems meet":"A little room made of several worlds",
    promise:seeds.map(seed=>seed.role).join(" · "),
    palette:{...lookup.get(visualLead).palette},
    donorRoles:seeds.map(seed=>({id:seed.id,role:seed.role,source:seed.source})),
    nonClaims:["UX composition != donor code integration","local fiction != shared-world occurrence","source inspiration != automatic canon"],
  };
}
export function exportCompositionRecipe(composition) {
  const canonical=composeSeedplate(composition.seedIds,{visualLead:composition.visualLead});
  assert(composition.id===canonical.id,"Composition identity mismatch");
  return JSON.stringify({
    schema:"static-play-seedplate.recipe.v1",
    status:"experimental-ux-recipe",
    id:canonical.id,
    seedIds:[...canonical.seedIds],
    visualLead:canonical.visualLead,
    title:canonical.title,
    donors:canonical.donorRoles.map(donor=>{
      const seed=lookup.get(donor.id);
      return {id:donor.id,role:donor.role,mechanic:seed.mechanic,
        skin:seed.skin,source:donor.source};
    }),
    constraints:[...canonical.nonClaims,
      "a composed UX recipe is not donor code, a runtime adapter, or world admission"],
  },null,2);
}
export function createRun(composition) {
  const verified=composeSeedplate(composition.seedIds,{visualLead:composition.visualLead});
  assert(composition.id===verified.id,"Composition identity mismatch");
  return {schema:"static-play-seedplate.run.v1",composition:verified,events:[]};
}
export function getCandidates(round) {
  assert(positiveInt(round),"Invalid candidate round");
  const group=motifGroups[round%motifGroups.length];
  return group.map((item,index)=>({...item,id:`scene-${round}-${index+1}`,status:"proposal"}));
}
function nextChoices(seeds,view) {
  if(view.stage!=="room"||view.beats===0)return [];
  return seeds.map(id=>{
    switch(id){
      case "grace":return view.memory.some(m=>m.action==="grace:call")?
        {id:"grace:hold",seedId:id,label:"Take a quiet moment",detail:"Spend one beat; do not erase an unanswered call."}:
        {id:"grace:call",seedId:id,label:"Make the call",detail:"Spend one beat on an attempt, not an outcome."};
      case "toaster":return {id:"toaster:propose",seedId:id,label:"Look through the picture machine",detail:"See three possibilities; none becomes history by appearing."};
      case "groove":return view.memory.some(m=>m.action==="groove:listen")?
        {id:"groove:note",seedId:id,label:"Leave a note in the room",detail:"A local note is not somebody else's response."}:
        {id:"groove:listen",seedId:id,label:"Listen to the room",detail:"Spend one beat noticing what is already here."};
      case "fork":return view.memory.some(m=>m.action==="fork:intruder")?
        {id:"fork:bend",seedId:id,label:"Bend the intruder",detail:"Continue from its recorded parent rather than editing that event."}:
        {id:"fork:intruder",seedId:id,label:"Deal an intruder",detail:"Introduce a fictional possibility, not an outside-world occurrence."};
      default:throw new Error("Unknown action donor");
    }
  });
}
export function replayRun(run) {
  assert(run?.schema==="static-play-seedplate.run.v1","Invalid seedplate run schema");
  const composition=composeSeedplate(run.composition?.seedIds,{visualLead:run.composition?.visualLead});
  assert(run.composition.id===composition.id,"Run composition is inconsistent");
  assert(Array.isArray(run.events)&&run.events.length<=60,"Invalid seedplate event log");
  const view={composition,beats:4,stage:"room",memory:[],receipt:null,
    round:0,scrapes:0,retained:[],choices:[],candidates:[]};
  for(let i=0;i<run.events.length;i++){
    const event=run.events[i];
    assert(event&&event.id===`plate-e${String(i+1).padStart(4,"0")}`,"Invalid seedplate event identity");
    if(event.type==="continue"){
      assert(view.stage==="receipt","Continue requires an active consequence");
      view.stage=view.beats===0?"ending":"room";view.receipt=null;continue;
    }
    if(event.type==="scrape"){
      assert(view.stage==="candidates","SCRAPE requires an offered family");
      assert(view.scrapes<2,"The bounded SCRAPE family limit has been reached");
      view.scrapes+=1;view.round+=1;continue;
    }
    if(event.type==="pass"){
      assert(view.stage==="candidates","Set aside requires offered candidates");
      view.receipt={title:"Possibilities set aside",body:"No proposed scene entered this room's history.",source:"toaster",kind:"refusal"};
      view.stage="receipt";continue;
    }
    if(event.type==="keep"){
      assert(view.stage==="candidates","KEEP requires an offered family");
      const candidate=getCandidates(view.round).find(c=>c.id===event.candidateId);
      assert(candidate,"KEEP must name exactly one offered candidate");
      assert(view.beats>0,"No beat remains for continuation");
      view.beats-=1;
      const memory={id:event.id,action:"toaster:keep",seedId:"toaster",kind:"fictional-admission",
        text:`Kept proposed scene: ${candidate.title}`,detail:candidate.text,
        parentId:view.memory.at(-1)?.id??null};
      view.memory.push(memory);view.retained.push(candidate.id);
      view.receipt={title:"This one may continue",body:`You kept “${candidate.title}.” The two other proposals remain only proposals.`,source:"toaster",kind:"admission"};
      view.stage="receipt";continue;
    }
    assert(event.type==="act","Unknown seedplate event type");
    assert(view.stage==="room","An action requires the room foreground");
    const action=nextChoices(composition.seedIds,view).find(a=>a.id===event.actionId);
    assert(action,"Action is not available in this composition");
    if(action.id==="toaster:propose"){
      view.stage="candidates";view.round=0;view.scrapes=0;continue;
    }
    if(action.id==="groove:note"){
      assert(typeof event.note==="string"&&event.note.trim().length>0&&event.note.trim().length<=120,
        "A local note must contain 1–120 characters");
    } else {
      assert(!own(event,"note"),"Only a note action may contain note text");
    }
    assert(view.beats>0,"No ordinary beat remains");
    const parent=view.memory.at(-1)?.id??null;
    view.beats-=1;
    let text="",body="",kind="local-act";
    switch(action.id) {
      case "grace:call":
        text="An ordinary call was attempted";body="No answer yet. The call is still an open thread.";break;
      case "grace:hold":
        text="One quiet moment was held";body="The missed call remains open. A pause was a real choice.";break;
      case "groove:listen":
        text="You listened at the center of the room";body="This is your listening position, not a remote person's testimony.";break;
      case "groove:note":
        text=`You left a local note: ${event.note.trim()}`;body="The room can remember your note; nobody else is claimed to have heard it.";break;
      case "fork:intruder":
        text="FORK! offered an intruder: the empty chair has a new question";
        body="A fictional possibility has been placed on the table, not admitted as an actual visitor.";kind="proposal";break;
      case "fork:bend":
        assert(parent,"A branch needs an actual earlier parent");
        text="BENT: the chair's question can be carried to another room";
        body="A new fictional branch grew from an attributable earlier turn; its parent did not change.";kind="branch";break;
      default:throw new Error("Unsupported action");
    }
    const branchParent=action.id==="fork:bend"
      ? view.memory.findLast(item=>item.action==="fork:intruder")?.id
      : null;
    if(action.id==="fork:bend")assert(branchParent,"BEND requires an attributable intruder parent");
    view.memory.push({id:event.id,action:action.id,seedId:action.seedId,kind,text,
      detail:body,parentId:branchParent});
    view.receipt={title:action.label,body,source:action.seedId,kind};
    view.stage="receipt";
  }
  view.choices=nextChoices(composition.seedIds,view);
  view.candidates=view.stage==="candidates"?getCandidates(view.round):[];
  return view;
}
export function appendRunEvent(run,event) {
  replayRun(run);
  const next={...run,events:[...run.events,{...event,id:`plate-e${String(run.events.length+1).padStart(4,"0")}`}]};
  replayRun(next);
  return next;
}
export function exportRun(run){replayRun(run);return JSON.stringify(run,null,2);}
export function importRun(raw){const run=JSON.parse(raw);replayRun(run);return run;}
