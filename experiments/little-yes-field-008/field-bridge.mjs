/**
 * Executes Static Field's own Living Deck composer, but offers only a local
 * fictional game doorway. Nothing is imported or authorized into a world.
 */
import {buildBrowserHandoff} from '../postemahhn-living-deck-001/browser-handoff.mjs';
import {makeGame, VERSION as RAIL_VERSION} from './rail/game.mjs';
import {createParty, VERSION as KINGDOM_VERSION} from './kingdom/kingdom.mjs';
const PACKS={
 '007':{title:'The Little Yes Express',entry:'./rail/index.html',version:RAIL_VERSION},
 '008':{title:'Who Built Your Kingdom?',entry:'./kingdom/index.html',version:KINGDOM_VERSION}
};
export function proposePartyDoors(selection,localActions=[]){
 const h=buildBrowserHandoff(selection,localActions);
 if(h.disposition==='refused')return {
  format:'static-field.little-yes-party-doors/1',status:'REFUSE_UNSUPPORTED_COMPOSITION',
  code:h.code,authority:'NONE',playAllowed:false,externalActions:0};
 const sticker=h.selection.stickerId;
 const ids=sticker==='echo'?['008','007']:sticker==='grow'?['007','008']:['007'];
 return {format:'static-field.little-yes-party-doors/1',
  status:'HOLD_PLAYER_CHOICE',authority:'NONE',playAllowed:true,
  externalActions:0,physicalDeeds:0,
  source:{format:h.format,compositionId:h.compositionReceipt.id,
   sourceVerification:h.sourceVerification,sourceCardReceipts:h.sourceCardReceipts,
   sourceStickerReceipt:h.sourceStickerReceipt,receipt:h.compositionReceipt},
  doors:ids.map(id=>({id,...PACKS[id],playMode:'LOCAL_FICTION_ONLY',acceptance:'PLAYER_OPENS_EXPLICITLY'})),
  pending:['player-choice','independent-source-verification-for-any-nonfictional-crossing',
   'destination-owned-admission','human-field-authorization'],
  caveat:'The Living Deck proposal never issues a token, imports authority or proves labor conditions.'};
}
export function previewFreshParty(id,partySize=4){
 if(!['007','008'].includes(id)||!Number.isInteger(partySize)||partySize<2||partySize>6)
   throw Error('Unsupported game or party size');
 const s=id==='007'?makeGame(partySize):createParty(partySize);
 return {id,version:s.version,fictional:true,playReceiptsAreNotFieldEvidence:true,
  realPersonConsentCount:0,physicalDeeds:0,gameState:s};
}
