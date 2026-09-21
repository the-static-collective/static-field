const $ = (selector) => document.querySelector(selector);
const state = { game: null, lane: "porch", pending: false };
const CARDS = [
  { id: "signal", title: "SIGNAL", cost: 1, series: "01 / RESONANCE", description: "Place a tone:bell source." },
  { id: "receiver", title: "RECEIVER", cost: 1, series: "02 / RECEPTION", description: "Place a tone:knock receiving port." },
  { id: "second-chair", title: "SECOND CHAIR", cost: 1, series: "03 / RELATION", description: "Offer a voluntary shared connection." },
  { id: "missing-corner", title: "MISSING CORNER", cost: 2, series: "04 / COMPOSITION", description: "Turn an admitted gap into a playable puzzle." }
];
const LANES = ["porch", "hall", "road"];
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function message(text) { $("#message").textContent = text; }
function receiptShort(id) { return id ? id.slice(0, 19) + "…" : "—"; }
function latestOutcome(previous, current, command) {
  const oldSource = previous?.source?.events?.length || 0;
  const oldReceiving = previous?.receiving?.events?.length || 0;
  if ((current?.source?.events?.length || 0) > oldSource) {
    const receipt = current.source.events.at(-1);
    return { outcome: receipt.decision.status, text: receipt.decision.reason.replaceAll("_", " ") };
  }
  if ((current?.receiving?.events?.length || 0) > oldReceiving) {
    const receipt = current.receiving.events.at(-1);
    return { outcome: receipt.disposition, text: receipt.reason.replaceAll("_", " ") };
  }
  if (command.kind === "receive") {
    return { outcome: current.receiving.admission.disposition, text:
      "RECEIVING WORLD: " + current.receiving.admission.reason.replaceAll("_", " ") };
  }
  if (command.kind === "publish") return { outcome: "admitted", text: "LOCAL CROSSING RECORDED" };
  return { outcome: "idle", text: "NEW LOCAL MATCH READY" };
}
function visualFeedback(outcome, text) {
  const panel = $("#visual-feedback");
  panel.dataset.outcome = outcome;
  $("#visual-feedback-icon").textContent = outcome === "admitted" ? "✦" :
    outcome === "refused" ? "×" : outcome === "held" ? "◌" : "◈";
  $("#visual-feedback-text").textContent = text.toUpperCase();
  panel.classList.remove("flash");
  void panel.offsetWidth; // restart the visual pulse only on a new result, not on render.
  panel.classList.add("flash");
}
async function request(command) {
  if (state.pending) return;
  state.pending = true;
  render();
  try {
    const response = await fetch("/api/wormhole/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(command)
    });
    const body = await response.json();
    if (!response.ok) throw Error(body.reason || body.error || "Action refused");
    const result = latestOutcome(state.game, body, command);
    state.game = body;
    message(result.outcome === "refused" ? "Attempt recorded; the world did not admit that move." :
      "Recorded in the Static Field local world log.");
    visualFeedback(result.outcome, result.text);
  } catch (error) {
    message(error instanceof Error ? error.message : String(error));
    visualFeedback("refused", "COMMAND NOT ADMITTED");
  } finally {
    state.pending = false;
    render();
  }
}
async function reload() {
  try {
    const response = await fetch("/api/wormhole");
    if (!response.ok) throw Error("The local world did not respond.");
    state.game = await response.json();
    message("Replayed from the persistent Static Field world history.");
    visualFeedback("idle", "WORLD HISTORY RELOADED");
    render();
  } catch (error) { message(error instanceof Error ? error.message : String(error)); }
}
function setDisabled(selector, disabled) {
  const node = $(selector);
  if (node) node.disabled = Boolean(disabled) || state.pending;
}
function render() {
  const data = state.game;
  const source = data?.source;
  const board = source?.board;
  const receiving = data?.receiving;
  const second = receiving?.state;
  $("#match-name").textContent = source ? source.matchId.slice(0, 8).toUpperCase() : "UNSTARTED";
  $("#turn-name").textContent = board ? board.finished ? "COMPLETED" : board.turn.toUpperCase() : "—";
  $("#crossing-count").textContent = String(data?.crossings?.length || 0);
  $("#north-charge").textContent = board ? board.charge.north + " / 5" : "—";
  $("#south-charge").textContent = board ? board.charge.south + " / 5" : "—";
  document.querySelectorAll("[data-lane]").forEach(button => {
    button.classList.toggle("selected", button.dataset.lane === state.lane);
  });
  const lanes = $("#lanes");
  lanes.replaceChildren();
  for (const lane of LANES) {
    const tile = element("div", "lane lane--" + lane + (lane === state.lane ? " selected" : "")
      + (board?.puzzle?.lane === lane ? " has-gap" : "")
      + (board?.bridgeLane === lane ? " has-bridge" : ""));
    tile.dataset.selectLane = lane;
    tile.tabIndex = 0;
    tile.setAttribute("role", "button");
    tile.setAttribute("aria-label", "Select " + lane + " lane");
    const vista = element("div", "lane-vista");
    const horizon = element("span", "lane-horizon");
    vista.append(horizon);
    tile.append(vista, element("h3", "", lane.toUpperCase()));
    for (const piece of board?.pieces?.filter(part => part.lane === lane) || []) {
      const fixture = element("div", "piece" + (piece.kind === "target" ? " target" : ""));
      const image = element("img", "piece-art");
      image.src = "/wormhole-art/" + (piece.kind === "source" ? "signal" : "receiver") + ".svg";
      image.alt = "";
      fixture.append(image, element("span", "", piece.owner.toUpperCase() + " / "
        + piece.kind.toUpperCase() + " / " + piece.port));
      tile.append(fixture);
    }
    if (board?.puzzle?.lane === lane) tile.append(element("p", "lane-note",
      "GAP: " + (board.puzzle.adapter || "NO ADAPTER") + (board.bridgeReceipt ? " / BRIDGE MADE" : "")));
    if (board?.bridgeLane === lane && board.finished) tile.append(element("p", "lane-note", "STABILIZED"));
    lanes.append(tile);
  }
  const phase = !board ? "unmade" : second?.crossed ? "crossed" :
    receiving?.admission?.disposition === "admitted" ? "received" :
    board.finished ? "stabilized" : board.bridgeReceipt ? "constituted" :
    board.puzzle ? "gap" : "unmade";
  const portal = $("#portal-stage");
  portal.dataset.phase = phase;
  const portalCopy = {
    unmade: ["THE GAP REMAINS", "Two distinct histories. One possible connection."],
    gap: ["THE SEAM IS EXPOSED", "An adapter must actually join tone:bell to tone:knock."],
    constituted: ["THE BRIDGE EXISTS", "The admitted connection can now be deployed."],
    stabilized: ["ONE LANE STABILIZED", "The completed source match can propose a receiving encounter."],
    received: ["A WORLD IS LISTENING", "The receiving encounter has its own steps and permissions."],
    crossed: ["THE SECOND SIDE", "This local fictional crossing was reached by play."]
  };
  $("#portal-title").textContent = portalCopy[phase][0];
  $("#portal-caption").textContent = portalCopy[phase][1];
  portal.setAttribute("aria-label", portalCopy[phase].join(". "));
  const hand = $("#hand");
  hand.replaceChildren();
  const active = Boolean(board && !board.finished && !receiving);
  for (const card of CARDS) {
    const count = board ? board.hand[board.turn][card.id] : 0;
    const button = element("button", "card-tile card--" + card.id);
    button.type = "button";
    button.dataset.card = card.id;
    button.setAttribute("aria-label", card.title + ", Charge cost " + card.cost
      + ", " + count + " remaining. " + card.description);
    button.disabled = !active || !count || board.charge[board.turn] < card.cost || state.pending;
    const top = element("span", "card-top");
    top.append(element("span", "card-series", card.series), element("span", "card-cost", "◆ " + card.cost));
    const art = element("span", "card-art");
    const image = element("img", "card-art-image");
    image.src = "/wormhole-art/" + card.id + ".svg";
    image.alt = "";
    image.loading = "lazy";
    art.append(image, element("span", "card-art-sheen"));
    const name = element("span", "card-name", card.title);
    const detail = element("span", "card-description", card.description);
    const foot = element("span", "card-footer");
    foot.append(element("span", "", "STATIC / 001"), element("span", "", "×" + count));
    button.append(top, art, name, detail, foot);
    hand.append(button);
  }
  const offer = board?.offer;
  const offering = Boolean(active && offer && !offer.accepted && offer.to === board.turn);
  const puzzle = Boolean(active && board.puzzle && !board.bridgeReceipt);
  const bridge = Boolean(active && board.bridgeReceipt);
  setDisabled("#new-match", state.pending);
  for (const control of ["#accept", "#decline"]) setDisabled(control, !offering);
  setDisabled("#fit", !puzzle);
  setDisabled("#test", !puzzle);
  setDisabled("#rest", !active || board.charge[board.turn] >= 5);
  setDisabled("#deploy", !bridge);
  $("#adapter").disabled = !puzzle || state.pending;
  $("#table-note").textContent = !board ? "Start a local match to set out the table."
    : board.finished ? "The lane is stabilized. This match can now propose a new receiving-side encounter."
    : offer && !offer.accepted ? "SECOND CHAIR: " + offer.to.toUpperCase() + " can accept or decline the invitation."
    : puzzle && !bridge ? "CONCRETE GAP: test the actual connection, not merely a compatible-looking label."
    : bridge ? "The connection has been constituted. The active role may deploy the bridge."
    : "Place source and receiver in the same lane; invite the other role and establish a voluntary connection.";
  $("#receipt-chip").textContent = source?.artifact ? receiptShort(source.artifact.artifactId) : "NO BRIDGE";
  const canReceive = Boolean(source?.artifact && !receiving);
  setDisabled("#receive", !canReceive);
  $("#choice").disabled = !canReceive || state.pending;
  $("#receiver-note").textContent = !source?.artifact
    ? "Complete the card-table encounter to produce a candidate bridge."
    : receiving ? "Destination decision: " + receiving.admission.disposition.toUpperCase()
      + ". " + receiving.admission.reason + "."
      : "The bridge is a candidate only. The receiving owner may ADMIT, HOLD, or REFUSE it.";
  $("#second-note").textContent = !receiving
    ? "No receiving game has been constructed."
    : receiving.admission.disposition !== "admitted"
      ? "This receiving world has not admitted the artifact. It cannot be crossed."
      : second.crossed ? "The fictional receiving-side encounter is complete."
      : "Turn: " + second.turn.toUpperCase() + " · inspected: " + second.inspected
        + " · relay attuned: " + second.attuned + " · lane: " + second.lane;
  setDisabled("#inspect", !second || receiving.admission.disposition !== "admitted" ||
    second.crossed || second.turn !== "north" || second.inspected);
  setDisabled("#attune", !second || receiving.admission.disposition !== "admitted" ||
    second.crossed || second.turn !== "south" || !second.inspected || second.attuned);
  setDisabled("#cross", !second || receiving.admission.disposition !== "admitted" ||
    second.crossed || second.turn !== "north" || !second.attuned);
  setDisabled("#publish", !second?.crossed || receiving?.published);
  $("#publish").textContent = receiving?.published ? "RECORDED IN THE WORLD ✓" : "RECORD LOCAL CROSSING";
  const events = [
    ...(source?.events || []).map(item => ({
      name: "TABLE", reason: item.decision.reason, status: item.decision.status, id: item.receiptId,
      index: item.sequence
    })),
    ...(receiving?.events || []).map(item => ({
      name: "RECEIVING", reason: item.reason, status: item.disposition, id: item.receiptId,
      index: item.sequence
    }))
  ];
  const history = $("#history");
  history.replaceChildren();
  for (const item of events.slice(-22).reverse()) {
    const line = element("li", item.status === "refused" ? "refused" : "");
    line.append(element("strong", "", item.name + " / " + item.index + " · " + item.reason));
    line.append(element("small", "", receiptShort(item.id)));
    history.append(line);
  }
  if (!events.length) history.append(element("li", "", "No actions recorded in this local match."));
}
document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (button?.dataset.lane) {
    state.lane = button.dataset.lane;
    render();
  }
  const selectedLane = event.target.closest("[data-select-lane]");
  if (selectedLane) {
    state.lane = selectedLane.dataset.selectLane;
    render();
  }
  if (button?.dataset.card) {
    const actor = state.game?.source?.board?.turn;
    if (actor) void request({kind:"card",action:{kind:"play",actor,card:button.dataset.card,lane:state.lane}});
  }
});
$("#lanes").addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target.closest("[data-select-lane]");
  if (!target) return;
  event.preventDefault();
  state.lane = target.dataset.selectLane;
  render();
});
$("#new-match").addEventListener("click", () => {
  if (state.game?.source && !window.confirm("Start another local match? Earlier encounters remain in the world history but the table will show the new match.")) return;
  void request({kind:"start"});
});
$("#accept").addEventListener("click", () => void request({kind:"card",action:{kind:"respond",actor:state.game.source.board.turn,accept:true}}));
$("#decline").addEventListener("click", () => void request({kind:"card",action:{kind:"respond",actor:state.game.source.board.turn,accept:false}}));
$("#fit").addEventListener("click", () => void request({kind:"card",action:{kind:"fit",actor:state.game.source.board.turn,adapter:$("#adapter").value}}));
$("#test").addEventListener("click", () => void request({kind:"card",action:{kind:"test",actor:state.game.source.board.turn}}));
$("#rest").addEventListener("click", () => void request({kind:"card",action:{kind:"rest",actor:state.game.source.board.turn}}));
$("#deploy").addEventListener("click", () => void request({kind:"card",action:{kind:"deploy",actor:state.game.source.board.turn,lane:state.lane}}));
$("#receive").addEventListener("click", () => void request({kind:"receive",choice:$("#choice").value,artifact:state.game.source.artifact}));
$("#inspect").addEventListener("click", () => void request({kind:"receiving",action:{kind:"inspect",actor:"north",lane:state.game.receiving.state.lane}}));
$("#attune").addEventListener("click", () => void request({kind:"receiving",action:{kind:"attune",actor:"south",adapter:"relay"}}));
$("#cross").addEventListener("click", () => void request({kind:"receiving",action:{kind:"cross",actor:"north",lane:state.game.receiving.state.lane}}));
$("#publish").addEventListener("click", () => void request({kind:"publish"}));
$("#reload").addEventListener("click", () => void reload());
void reload();
