import { createHash } from "node:crypto";
import { compose } from "./composer.mjs";

// The Jubilee PR is an ACTUAL design source, not a source-issued card receipt.
// Pin a commit rather than implying the branch name is immutable.
import { DESIGN_SOURCE } from "./source-design.mjs";
export { DESIGN_SOURCE } from "./source-design.mjs";

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (plainObject(value)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  throw new TypeError("Only finite JSON values and plain objects are allowed in a handoff");
}
const sha256 = value => createHash("sha256").update(canonical(value)).digest("hex");
const result = (disposition, reason, details = {}) => ({ disposition, reason, ...details });
const exactFields = (actual, expected) => actual && Object.entries(expected).every(([k, v]) => actual[k] === v);

/**
 * Freeze the INPUT to a would-be cross-world admission. This is a proposal,
 * never a source-owned PostEmahh'n receipt, printed-card claim, or world event.
 */
export function prepareHandoff(selection) {
  if (!plainObject(selection)) return result("refused", "malformed-selection");
  const preview = compose({
    firstId: selection.firstId,
    secondId: selection.secondId,
    stickerId: selection.stickerId,
  });
  if (!preview.ok) return result("refused", preview.code);
  const input = {
    version: "living-deck-handoff/0.2",
    cardRefs: preview.receipt.orderedCardRefs,
    stickerRef: preview.receipt.stickerRef,
    compositionId: preview.receipt.id,
    sourceDesign: DESIGN_SOURCE,
    evidenceLevel: "design-backed-local-fixture",
    sourceCardReceipts: null,
    sourceStickerReceipt: null,
  };
  const fingerprint = sha256(input);
  const projectDraft = {
    format: "full-measure.project-draft-proposal/0.1",
    sourceComposition: preview.receipt.id,
    inputSha256: fingerprint,
    title: preview.quest.title,
    story: preview.quest.encounter,
    needs: [{
      title: preview.quest.objective,
      description: "Participant can inspect, attempt, or leave. No completion without destination-owned confirmation.",
      status: "open",
    }],
    status: "proposal",
    attribution: "local-fixture-only",
    notAProjectRecord: true,
  };
  const roomCapsule = {
    format: "static-room-source-handoff",
    version: 1,
    boundary: "Proposed creative room. Not a ROroomOM snapshot, imported object, or authority grant.",
    object: {
      id: preview.receipt.id,
      name: preview.quest.title,
      address: `static://living-deck/${preview.receipt.id}`,
      kind: "proposed encounter",
    },
    intent: "explore",
    sourceEvidence: { designSource: DESIGN_SOURCE, actualIssuedCardProof: null },
    brief: preview.room.visibleConsequence,
    drafts: { quest: preview.quest.objective, room: preview.room.visibleConsequence },
    questions: ["What project-owned adapter would admit this composition?"],
    localReceiptCount: 0,
  };
  return {
    disposition: "prepared",
    fingerprint,
    input,
    preview,
    projectDraft,
    roomCapsule,
    provenance: "design-backed-local-fixture",
    grantedAuthority: "none",
    externalExecution: false,
  };
}

/**
 * A source-owned verifier must be supplied by a separately reviewed adapter.
 * DO NOT accept `verified:true` from the JSON handoff or a scanned QR code.
 * The receiving Full Measure and ROroomOM ports EACH decide locally.
 */
export async function evaluateHandoff(prepared, {
  sourceCardVerifier,
  sourceStickerVerifier,
  fullMeasurePort,
  roomPort,
  humanApproval = false,
} = {}) {
  if (!plainObject(prepared) || prepared.disposition !== "prepared" || !plainObject(prepared.input)) {
    return result("refused", "not-prepared");
  }
  let rebuilt;
  try { rebuilt = prepareHandoff({
    firstId: prepared.input.cardRefs?.[0]?.replace(/^fixture:/, ""),
    secondId: prepared.input.cardRefs?.[1]?.replace(/^fixture:/, ""),
    stickerId: prepared.input.stickerRef?.replace(/^fixture:/, ""),
  }); } catch { return result("refused", "malformed-preparation"); }
  if (rebuilt.disposition !== "prepared" || !exactFields(prepared, { fingerprint: rebuilt.fingerprint }) ||
      canonical(prepared.input) !== canonical(rebuilt.input) ||
      canonical(prepared.projectDraft) !== canonical(rebuilt.projectDraft) ||
      canonical(prepared.roomCapsule) !== canonical(rebuilt.roomCapsule)) {
    return result("refused", "tampered-preparation");
  }
  if (humanApproval !== true) return result("held", "explicit-human-approval-required", { fingerprint: rebuilt.fingerprint });
  if (![sourceCardVerifier, sourceStickerVerifier, fullMeasurePort, roomPort].every(x => typeof x === "function")) {
    return result("held", "source-and-destination-adapters-not-connected", { fingerprint: rebuilt.fingerprint });
  }
  const requireProof = (proof, subjectRef, kind) => plainObject(proof) &&
    proof.ok === true && proof.sourceOwned === true && proof.kind === kind &&
    proof.subjectRef === subjectRef && proof.scope === "composition-input" &&
    typeof proof.receiptRef === "string" && proof.receiptRef.length > 4 &&
    typeof proof.digest === "string" && /^[a-f0-9]{64}$/.test(proof.digest);
  const verified = { cards: [], sticker: null };
  try {
    for (const ref of rebuilt.input.cardRefs) {
      const proof = await sourceCardVerifier({ requestedCardRef: ref, sourceDesign: DESIGN_SOURCE });
      if (!requireProof(proof, ref, "card")) return result("held", "source-card-proof-unavailable", { subjectRef: ref });
      verified.cards.push({ subjectRef: ref, receiptRef: proof.receiptRef, digest: proof.digest });
    }
    const ref = rebuilt.input.stickerRef;
    const proof = await sourceStickerVerifier({ requestedStickerRef: ref, sourceDesign: DESIGN_SOURCE });
    if (!requireProof(proof, ref, "sticker")) return result("held", "source-sticker-proof-unavailable", { subjectRef: ref });
    verified.sticker = { subjectRef: ref, receiptRef: proof.receiptRef, digest: proof.digest };
  } catch {
    return result("held", "source-verification-indeterminate");
  }
  const candidate = {
    fingerprint: rebuilt.fingerprint,
    sourceProofs: verified,
    fullMeasureProjectDraft: rebuilt.projectDraft,
    roomCapsule: rebuilt.roomCapsule,
    authorityRequested: "destination-local-proposal-only",
    sourceStatus: "verified-through-supplied-adapter",
  };
  const dispositionOK = (r, dest) => plainObject(r) && r.destination === dest &&
    r.fingerprint === rebuilt.fingerprint && ["admitted", "held", "refused"].includes(r.disposition) &&
    typeof r.receiptRef === "string" && r.receiptRef.length > 4;
  let fm;
  try { fm = await fullMeasurePort(candidate); }
  catch { return result("held", "full-measure-outcome-indeterminate", { sourceProofs: verified }); }
  if (!dispositionOK(fm, "full-measure")) return result("held", "full-measure-disposition-invalid", { sourceProofs: verified });
  if (fm.disposition !== "admitted") return result(fm.disposition, "full-measure-destination-decision", { fullMeasure: fm, sourceProofs: verified });
  let room;
  try { room = await roomPort({ ...candidate, fullMeasureReceiptRef: fm.receiptRef }); }
  catch { return result("held", "roroomom-outcome-indeterminate", { fullMeasure: fm, sourceProofs: verified }); }
  if (!dispositionOK(room, "roroomom")) return result("held", "roroomom-disposition-invalid", { fullMeasure: fm, sourceProofs: verified });
  if (room.disposition !== "admitted") return result(room.disposition, "roroomom-destination-decision", { fullMeasure: fm, roroomom: room, sourceProofs: verified });
  return result("admitted", "both-destinations-accepted-their-own-local-proposals", {
    fingerprint: rebuilt.fingerprint,
    sourceProofs: verified,
    fullMeasure: fm,
    roroomom: room,
    emittedStaticFieldEvent: false,
    externalPublication: false,
    note: "This integration boundary does not itself materialize a project, import a room, issue a card, or record a Static Field world event.",
  });
}
