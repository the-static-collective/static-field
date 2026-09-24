// POSTEMAHHN-LIVING-DECK-001: deliberately local fixture grammar, not card-source authority.
export const CARDS = Object.freeze([
  { id: "cicada", title: "Cicada on the Porch", kind: "signal", verbs: ["sing", "emerge"] },
  { id: "cup", title: "The Blue Cup", kind: "vessel", verbs: ["receive", "hold"] },
  { id: "radio", title: "The Porch Radio", kind: "instrument", verbs: ["tune", "record"] },
  { id: "door", title: "The Missing Corner", kind: "threshold", verbs: ["open", "cross"] },
]);
export const STICKERS = Object.freeze([
  { id: "echo", title: "ECHO", verb: "repeat" },
  { id: "pour", title: "POUR", verb: "transfer" },
  { id: "open", title: "OPEN", verb: "reveal" },
  { id: "grow", title: "GROW", verb: "branch" },
  { id: "call", title: "CALL", verb: "invite" },
  { id: "wait", title: "WAIT", verb: "delay" },
]);
const find = (items, id) => items.find((item) => item.id === id);
const fail = (code, explanation) => ({ ok: false, code, explanation });
const rule = (first, second, sticker) => {
  if (first.id === second.id) return fail("same-card", "Choose two distinct cards; self-composition has not been defined.");
  if (sticker.id === "echo" && !(first.id === "cicada" && second.id === "radio"))
    return fail("missing-signal-adapter", "ECHO currently needs Cicada as the source and Porch Radio as its receiver.");
  if (sticker.id === "pour" && first.id !== "cup")
    return fail("missing-vessel", "POUR currently needs the Blue Cup as its first card.");
  if (sticker.id === "open" && second.id !== "door")
    return fail("missing-threshold", "OPEN currently needs the Missing Corner as its second card.");
  if (sticker.id === "call" && !["cicada", "radio"].includes(first.id))
    return fail("missing-caller", "CALL currently needs the Cicada or Radio as its first card.");
  return { ok: true };
};
const effect = {
  echo: "A repeated song sounds different on its next encounter.",
  pour: "What was held in the cup becomes available to the receiving object.",
  open: "A previously inaccessible doorway becomes visible.",
  grow: "A new branch becomes available, without overwriting the first path.",
  call: "A request is left for someone who may choose to respond.",
  wait: "A consequence is deferred until a later visit; it is not resolved now.",
};
export function compose({ firstId, secondId, stickerId } = {}) {
  const first = find(CARDS, firstId);
  const second = find(CARDS, secondId);
  const sticker = find(STICKERS, stickerId);
  if (!first || !second || !sticker) return fail("unknown-input", "A card or sticker is not defined in this local fixture deck.");
  const valid = rule(first, second, sticker);
  if (!valid.ok) return valid;
  const id = `pc001:${first.id}:${sticker.id}:${second.id}`;
  const canPlayLoop = first.id === "cicada" && second.id === "radio" && sticker.id === "echo";
  return {
    ok: true,
    receipt: {
      schema: "static-field.postemahhn-composition-preview.v0",
      id,
      orderedCardRefs: [`fixture:${first.id}`, `fixture:${second.id}`],
      stickerRef: `fixture:${sticker.id}`,
      localFixtureVersion: "001",
      provenance: { origin: "local-demo-fixture", verifiedExternalCardIdentity: false, importedPostEmahhnReceipt: null },
      authority: "none",
      status: "proposed",
      acceptedIntoSharedWorld: false,
      claim: "This receipt describes a browser-local composition only."
    },
    quest: {
      kind: "candidate-full-measure-quest",
      title: `${first.title} / ${second.title} / ${sticker.title}`,
      objective: `Use ${sticker.title} to connect ${first.title} with ${second.title}.`,
      encounter: effect[sticker.id],
      resolution: "Locally record INSPECT then ATTEMPT, or choose LEAVE; no choice changes external canon.",
      authority: "none",
      status: "proposal"
    },
    room: {
      kind: "candidate-roroomom-scene",
      place: "The Porch",
      availableActions: ["INSPECT", "ATTEMPT", "LEAVE"],
      visibleConsequence: effect[sticker.id],
      authority: "none",
      status: "proposal"
    },
    tool: canPlayLoop ? {
      kind: "browser-audio-loop",
      title: "Cicada Radio ECHO",
      patternHz: [440, 587.33, 659.25, 587.33],
      supported: true,
      effects: "Audio preview only; no microphone capture, files, remote calls or external execution."
    } : null,
    unimplemented: canPlayLoop ? [] : ["A general-purpose executable tool compiler is not defined for this composition."]
  };
}
