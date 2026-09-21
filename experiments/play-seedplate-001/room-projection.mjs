// Pure spatial presentation adapter. This module may derive imagery and available
// affordances from the seedplate replay, but never admits an event or owns a save.
const HOTSPOTS=Object.freeze([
  {id:"picture-machine",label:"Picture machine",seedId:"toaster"},
  {id:"listening-chair",label:"Listening chair",seedId:"groove"},
]);
export function hotspotActions(view,hotspotId) {
  if(!view || view.stage!=="room")return [];
  const seedId=HOTSPOTS.find(h=>h.id===hotspotId)?.seedId;
  if(!seedId || !view.composition.seedIds.includes(seedId))return [];
  return view.choices.filter(choice=>choice.seedId===seedId).map(choice=>({...choice}));
}
export function projectListeningRoom(view) {
  if(!view || !["toaster","groove"].every(id=>view.composition.seedIds.includes(id)))
    return null;
  const kept=view.memory.findLast(item=>item.action==="toaster:keep")??null;
  const echo=view.memory.findLast(item=>item.action==="groove:echo" && item.parentId===kept?.id)??null;
  const candidates=view.stage==="candidates"?view.candidates.map(c=>({...c})):[];
  const heroStatus=echo?"echo":view.stage==="candidates"?"proposal":kept?"kept":"empty";
  return {
    stage:view.stage,
    beats:view.beats,
    hero:{
      status:heroStatus,
      title:view.stage==="candidates"?"Possible pictures — not yet kept":
        kept?.text.replace(/^Kept proposed scene: /,"")??"A picture waiting to happen",
      keptEventId:kept?.id??null,
    },
    keptEventId:kept?.id??null,
    echoEventId:echo?.id??null,
    echoParentId:echo?.parentId??null,
    hotspots:HOTSPOTS.map(h=>({...h,actions:hotspotActions(view,h.id).map(a=>a.id)})),
    choosable:candidates,
  };
}
