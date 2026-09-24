import { compose } from "./composer.mjs";
import { DESIGN_SOURCE } from "./source-design.mjs";

/**
 * Browser-safe, unverified proposal export. Does not run destination adapters.
 * A source-owned verifier and destination-owned admission must happen later.
 */
export function buildBrowserHandoff(selection, localActions = []) {
  const c = compose(selection);
  if (!c.ok) return { disposition: "refused", code: c.code, explanation: c.explanation };
  const acts = Array.isArray(localActions) ? localActions.filter(v => ["INSPECT", "ATTEMPT", "LEAVE"].includes(v)).slice(0, 50) : [];
  return {
    format: "static-field.living-deck-portable-proposal",
    version: 1,
    status: "unverified-proposal",
    sourceDesign: DESIGN_SOURCE,
    sourceCardReceipts: null,
    sourceStickerReceipt: null,
    sourceVerification: "unavailable",
    externalAuthority: "none",
    selection: { firstId: selection.firstId, secondId: selection.secondId, stickerId: selection.stickerId },
    localPreviewActions: acts,
    compositionReceipt: c.receipt,
    fullMeasure: {
      format: "full-measure.project-draft-proposal/0.1",
      title: c.quest.title,
      story: c.quest.encounter,
      needs: [{ title: c.quest.objective, status: "open" }],
      status: "proposal",
      notAProjectRecord: true,
      sourceCardProof: null,
      caveat: "For human review, not directly importable as an active Full Measure project.",
    },
    roroomom: {
      format: "static-room-source-handoff",
      version: 1,
      boundary: "Creative handoff for review; not an imported ROroomOM room, capability, or snapshot.",
      object: {
        id: c.receipt.id,
        name: c.quest.title,
        address: `static://living-deck/${c.receipt.id}`,
        kind: "proposed encounter",
      },
      intent: "explore",
      sourceEvidence: { designSource: DESIGN_SOURCE, issuedCardProof: null },
      brief: c.room.visibleConsequence,
      drafts: { quest: c.quest.objective, room: c.room.visibleConsequence },
      questions: ["What local destination-owned adapter would accept this proposal?"],
      localReceiptCount: 0,
    },
    pending: ["source-owned-card-proof", "source-owned-sticker-proof", "human-approval", "full-measure-admission", "roroomom-admission"],
  };
}
