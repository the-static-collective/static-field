// LITTLE YES EXPRESS / REALITY.2 × GROOVETOWN-007 — cooperative fictional tabletop engine.
// No actual land, materials, people, currency, blockchain mints, permissions or physical acts.
export const VERSION = 'LITTLE-YES-EXPRESS-007/v1';
export const TOWNS = [
  {id:'millford',name:'Millford',resource:'wood',number:8,stock:7,x:94,y:185,kind:'Woodlands'},
  {id:'bridgeport',name:'Bridgeport',resource:'ore',number:6,stock:7,x:273,y:118,kind:'Quarry'},
  {id:'ovenham',name:'Ovenham',resource:'idea',number:9,stock:5,x:472,y:125,kind:'Workshop'},
  {id:'lantern',name:'Lantern Town',resource:'idea',number:5,stock:4,x:666,y:198,kind:'Community Hearth'},
  {id:'cedar',name:'Cedar Junction',resource:'food',number:7,stock:7,x:200,y:345,kind:'Garden'},
  {id:'hearthside',name:'Hearthside',resource:'wood',number:10,stock:5,x:484,y:347,kind:'Commons'}
];
export const LINKS = [
  {id:'mb',a:'millford',b:'bridgeport',cost:1,name:'Millford–Bridgeport'},
  {id:'bo',a:'bridgeport',b:'ovenham',cost:1,name:'Bridgeport–Ovenham'},
  {id:'ol',a:'ovenham',b:'lantern',cost:2,name:'Ovenham–Lantern'},
  {id:'mc',a:'millford',b:'cedar',cost:1,name:'Millford–Cedar'},
  {id:'cb',a:'cedar',b:'bridgeport',cost:1,name:'Cedar–Bridgeport'},
  {id:'ch',a:'cedar',b:'hearthside',cost:1,name:'Cedar–Hearthside'},
  {id:'hl',a:'hearthside',b:'lantern',cost:2,name:'Hearthside–Lantern'},
  {id:'bh',a:'bridgeport',b:'hearthside',cost:2,name:'Bridgeport–Hearthside'},
  {id:'oh',a:'ovenham',b:'hearthside',cost:1,name:'Ovenham–Hearthside'}
];
export const ROLES = [
  {name:'The Engineer',task:'Ask what one rail connection could make possible.'},
  {name:'The Hearthkeeper',task:'Protect warmth without confusing game fuel with safe physical heating.'},
  {name:'The Gardener',task:'Connect the food supply to the town that needs it.'},
  {name:'The Witness',task:'Keep claims distinct from observations and receipts.'},
  {name:'The Mail Carrier',task:'Carry proposals, not obligations, between towns.'},
  {name:'The Inventor',task:'Find useful shared infrastructure instead of redundant projects.'}
];
export const RECIPES = [
  {id:'rail',name:'Forge two rail segments',inputs:{wood:1,ore:1},outputs:{rail:2},at:'commons',flavor:'Shared material capability unlocks a new line.'},
  {id:'firewood',name:'Craft two firewood tokens',inputs:{wood:1},outputs:{firewood:2},at:'millford',flavor:'Fictional material card; NOT real burning or heating guidance.'},
  {id:'blueprint',name:'Compose a reusable blueprint',inputs:{idea:1,ore:1},outputs:{blueprint:1},at:'commons',flavor:'An idea token is non-physical, not an authenticated construction plan.'}
];
const copy = x => JSON.parse(JSON.stringify(x));
const must = (condition,msg)=>{ if(!condition)throw Error(msg); };
const safeInt=(x,low,high)=>Number.isSafeInteger(x)&&x>=low&&x<=high;
export function makeGame(size=4, seed=317){
  must(safeInt(size,2,6),'Party supports 2–6 seats');
  must(safeInt(seed,1,2147483646),'Invalid seed');
  return {version:VERSION,mode:'SYNTHETIC_OFFLINE_PARTY',size,seed,random:seed,round:1,maxRounds:9,
    actionsLeft:size,activeSeat:0,pressure:0,phase:'PLAYING',resources:{wood:2,ore:2,food:0,idea:1,rail:0,firewood:0,blueprint:0},
    stock:Object.fromEntries(TOWNS.map(t=>[t.id,t.stock])),consents:[],built:[],delivered:{food:0,firewood:0},
    claim:{item:'WOOD',claimed:42,observed:39,authority:'DISPUTED_NO_STOCK',audited:false},
    relics:[],history:[{type:'START',text:'Six fictional towns form a cooperative table. Everything on this board is play.'}],
    lastEvent:'The train waits for the first Little Yes.',lastRoll:0};
}
export function connected(state,origin,destination){
  if(origin===destination)return true;
  const seen=new Set([origin]),stack=[origin];
  while(stack.length){const current=stack.pop();for(const e of LINKS){if(!state.built.includes(e.id))continue;
    const next=e.a===current?e.b:e.b===current?e.a:null;
    if(next&&!seen.has(next)){if(next===destination)return true;seen.add(next);stack.push(next);}
  }}return false;
}
export function shortestPlan(state,origin,destination){
  // Weighted path by absent route consent/build actions plus rail segments required; deterministic tie-break.
  const paths=[{at:origin,via:[],cost:0}],best=new Map();
  while(paths.length){paths.sort((a,b)=>a.cost-b.cost||a.via.join(',').localeCompare(b.via.join(',')));
    const p=paths.shift();if(best.has(p.at)&&best.get(p.at)<=p.cost)continue;best.set(p.at,p.cost);
    if(p.at===destination)return p;
    for(const edge of LINKS){const to=edge.a===p.at?edge.b:edge.b===p.at?edge.a:null;if(!to||p.via.some(id=>id===edge.id))continue;
      const missing=state.built.includes(edge.id)?0:(state.consents.includes(edge.id)?1:2);
      paths.push({at:to,via:[...p.via,edge.id],cost:p.cost+missing+(state.built.includes(edge.id)?0:edge.cost*.1)});
    }
  }return null;
}
export function goals(state){return {
  railway:connected(state,'millford','lantern'),
  warmth:state.delivered.firewood>=2,
  food:state.delivered.food>=2
};}
export function offer(state){
  if(state.phase!=='PLAYING')return {title:state.phase==='WON'?'The towns did it together.':'Try another railway.',reason:'This is a finished fictional game, not an actual field receipt.'};
  const g=goals(state);
  if(!g.railway){const p=shortestPlan(state,'millford','lantern');
    const missing=p?.via.map(id=>LINKS.find(x=>x.id===id)).find(e=>!state.built.includes(e.id));
    if(missing){if(!state.consents.includes(missing.id))return {title:`Ask for the Little Yes: ${missing.name}`,reason:'Both fictional endpoints must be willing before a route enters play.',suggested:{kind:'agree',id:missing.id}};
      if(state.resources.rail<missing.cost)return materialOffer(state,`To construct ${missing.name}, the table needs ${missing.cost} rail segment${missing.cost===1?'':'s'}.`);
      return {title:`Build ${missing.name}`,reason:`A new route can connect the shared network; this one consumes ${missing.cost} rail.`,suggested:{kind:'build',id:missing.id}};
    }
  }
  if(!g.warmth){if(state.resources.firewood<2){if(state.resources.wood<1)return gatherOffer(state,'wood','millford','Firewood tokens require one wood token first.');
      return {title:'Craft two firewood tokens',reason:'A modeled warmth need requires a prepared material card; no physical heating is authorized.',suggested:{kind:'craft',id:'firewood'}};}
    if(!connected(state,'millford','lantern'))return {title:'Connect Millford to Lantern Town',reason:'The simulated cargo needs a built route before the handoff.'};
    return {title:'Send two firewood tokens to Lantern Town',reason:'One modeled handoff can now satisfy the warmth objective.',suggested:{kind:'ship',id:'firewood'}};
  }
  if(!g.food){if(state.resources.food<2)return gatherOffer(state,'food','cedar','The garden can contribute food tokens, while its source remains fictional.');
    if(!connected(state,'cedar','lantern')){const p=shortestPlan(state,'cedar','lantern'),m=p?.via.map(id=>LINKS.find(x=>x.id===id)).find(x=>!state.built.includes(x.id));
      if(m){if(!state.consents.includes(m.id))return {title:`Ask to connect ${m.name}`,reason:'The shared meal needs an actual built path in the game.',suggested:{kind:'agree',id:m.id}};
        if(state.resources.rail<m.cost)return materialOffer(state,'One more rail connection could open the garden delivery.');
        return {title:`Build ${m.name}`,reason:'This connects a missing segment in the shortest modeled route.',suggested:{kind:'build',id:m.id}};
      }}
    return {title:'Send two food tokens to Lantern Town',reason:'The garden is now connected to the destination.',suggested:{kind:'ship',id:'food'}};
  }
  return {title:'Try a town laboratory experiment',reason:'Check whether a new shared capability unlocks more than one downstream goal.'};
}
function gatherOffer(state,resource,town,why){return {title:`Gather ${resource} at ${TOWNS.find(t=>t.id===town).name}`,reason:why,suggested:{kind:'gather',id:town}};}
function materialOffer(state,why){const r=RECIPES[0];if(state.resources.wood>=1&&state.resources.ore>=1)return {title:'Forge two new rail segments',reason:why,suggested:{kind:'craft',id:'rail'}};
  const want=state.resources.wood<1?'wood':'ore',at=want==='wood'?'millford':'bridgeport';return gatherOffer(state,want,at,why);
}
function nextRandom(n){return (n*48271)%2147483647;}
function nextRound(s){
  s.round++;
  s.actionsLeft=s.size;s.activeSeat=0;
  s.random=nextRandom(s.random);const one=s.random%6+1;
  s.random=nextRandom(s.random);const two=s.random%6+1;
  s.lastRoll=one+two;
  const tile=TOWNS.find(t=>t.number===s.lastRoll);
  let production='No matching town produced this round.';
  if(tile&&s.stock[tile.id]>0){s.stock[tile.id]--;s.resources[tile.resource]++;production=`${tile.name} produced one fictional ${tile.resource} token.`;}
  const effects=[{text:'A gust rattles the stations. Pressure rises.',pressure:1},
   {text:'A shared supper brings encouragement. Pressure eases.',pressure:-1},
   {text:'A helpful question arrives. Gain one idea token.',idea:1},
   {text:'A winter front approaches. Pressure rises.',pressure:1},
   {text:'An old track is inspected. No automatic damage or credit.',pressure:0},
   {text:'Cedar Junction finds one additional game-food token.',food:1},
   {text:'A doubtful claim remains disputed; it cannot be spent.',pressure:0},
   {text:'The neighbors make time for the commons. Pressure eases.',pressure:-1}];
  const ev=effects[(s.round-2)%effects.length];s.pressure=Math.max(0,s.pressure+(ev.pressure||0));if(ev.idea)s.resources.idea+=ev.idea;if(ev.food)s.resources.food+=ev.food;
  s.lastEvent=`Roll ${s.lastRoll}. ${production} ${ev.text}`;s.history.push({type:'ROUND',text:`Round ${s.round}: ${s.lastEvent}`});
  if(s.round>s.maxRounds||s.pressure>=5)s.phase='LOST';
}
const resourceCheck=(s,inputs)=>Object.entries(inputs).every(([k,v])=>s.resources[k]>=v);
function addRelic(s,type,title,details){
  const serial=s.relics.length+1;
  s.relics.push({id:`GAME-${String(serial).padStart(3,'0')}`,title,type,details,round:s.round,mode:'SYNTHETIC_PLAY_ONLY',transferable:'AS_A_FILE_ONLY',monetaryValue:null,blockchainMint:false});
}
export function step(state,action){
  must(state&&state.version===VERSION,'Unknown game state');
  must(state.phase==='PLAYING','Game is finished');
  must(safeInt(state.actionsLeft,1,6),'No actions left');
  must(action&&typeof action.kind==='string','Missing action');
  const s=copy(state),a=action;
  let message='';
  if(a.kind==='gather'){
    const t=TOWNS.find(t=>t.id===a.id);must(t,'Unknown town');must(s.stock[t.id]>0,`${t.name} has no remaining fictional stock`);
    s.stock[t.id]--;s.resources[t.resource]++;message=`Gathered one ${t.resource} token from ${t.name}.`;
  }else if(a.kind==='agree'){
    const e=LINKS.find(x=>x.id===a.id);must(e,'Unknown link');must(!s.consents.includes(a.id),'This link has already received its fictional Little Yes');
    must(!s.built.includes(a.id),'This route already exists');s.consents.push(a.id);
    message=`The table recorded a fictional Little Yes for ${e.name}. This is not real consent.`;
  }else if(a.kind==='build'){
    const e=LINKS.find(x=>x.id===a.id);must(e,'Unknown link');must(s.consents.includes(a.id),'A fictional Little Yes is required first');
    must(!s.built.includes(a.id),'Route already built');must(s.resources.rail>=e.cost,`Need ${e.cost} rail tokens`);
    s.resources.rail-=e.cost;s.built.push(a.id);message=`Built ${e.name} on the fictional board.`;
    addRelic(s,'RAIL_TICKET',`Route: ${e.name}`,{routeId:e.id,cost:e.cost});
  }else if(a.kind==='craft'){
    const r=RECIPES.find(x=>x.id===a.id);must(r,'Unknown recipe');must(resourceCheck(s,r.inputs),`Missing materials for ${r.name}`);
    for(const [k,n] of Object.entries(r.inputs))s.resources[k]-=n;
    for(const [k,n] of Object.entries(r.outputs))s.resources[k]+=n;
    message=`Crafted ${r.name.toLowerCase()}.`;
    addRelic(s,'CRAFT_TOKEN',r.name,{recipeId:r.id,inputs:r.inputs,outputs:r.outputs});
  }else if(a.kind==='ship'){
    const isFood=a.id==='food',isWood=a.id==='firewood';must(isFood||isWood,'Unknown shipment');
    const origin=isFood?'cedar':'millford';must(connected(s,origin,'lantern'),`No built route from ${origin} to Lantern Town`);
    const item=a.id;must(s.resources[item]>=2,`Need 2 ${item} tokens`);must(s.delivered[item]<2,'Objective already served');
    s.resources[item]-=2;s.delivered[item]+=2;message=`Handed off two fictional ${item} tokens to Lantern Town.`;
    addRelic(s,'ARRIVAL_CARD',`${isFood?'Community meal':'Warm hearth'} arrival`,{from:origin,to:'lantern',material:item,quantity:2});
  }else if(a.kind==='audit'){
    must(!s.claim.audited,'Claim already examined');s.claim.audited=true;
    s.resources.idea++;message='The table noticed the 42-vs-39 WOOD discrepancy. The claim remains disputed, and zero stock was credited. One idea token was earned for asking a better question.';
    addRelic(s,'QUESTION_CARD','42 WOOD / 39 observed',{finding:'DISPUTED',spendableStockCredited:0});
  }else throw Error('Unknown action');
  s.history.push({type:a.kind.toUpperCase(),seat:s.activeSeat+1,round:s.round,text:message});
  s.actionsLeft--;s.activeSeat=(s.activeSeat+1)%s.size;
  if(Object.values(goals(s)).every(Boolean)){s.phase='WON';s.lastEvent='The three cooperative objectives were accomplished in the fictional game.';
    addRelic(s,'COMMONS_EDITION','A railway that could carry care',{goals:goals(s),newPhysicalDeeds:0});
  }else if(s.actionsLeft===0){if(s.round===s.maxRounds)s.phase='LOST';else nextRound(s);}
  return {state:s,message};
}
export function exportRecord(state){must(state&&state.version===VERSION,'Invalid state');
  return {schema:'reality2-party-record-v1',fictional:true,authority:'NO_REAL_WORLD_CLAIMS',game:VERSION,
    scores:{phase:state.phase,round:state.round,goals:goals(state),pressure:state.pressure},
    relics:state.relics,history:state.history,board:{built:state.built,consents:state.consents},
    boundaries:['Claim != inventory','Play agreement != human consent','Receipt != deed','NFT card != cryptocurrency','No real rail, firewood, construction or shipping authorized']};}
