const $ = (selector) => document.querySelector(selector);
const state = { game: null, lane: "porch", pending: false };
const CARDS = [
  { id: "signal", title: "SIGNAL", cost: 1, description: "Place a tone:bell source." },
  { id: "receiver", title: "RECEIVER", cost: 1, description: "Place a tone:knock receiving port." },
  { id: "second-chair", title: "SECOND CHAIR", cost: 1, description: "Offer a voluntary shared connection." },
  { id: "missing-corner", title: "MISSING CORNER", cost: 2, description: "Turn an admitted gap into a playable puzzle." }
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
    state.game = body;
    message("Recorded in the Static Field local world log.");
  } catch (error) {
    message(error instanceof Error ? error.message : String(error));
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
    const tile = element("div", "lane" + (lane === state.lane ? " selected" : ""));
    tile.dataset.selectLane = lane;
    tile.tabIndex = 0;
    tile.setAttribute("role", "button");
    tile.setAttribute("aria-label", "Select " + lane + " lane");
    tile.append(element("h3", "", lane.toUpperCase()));
    for (const piece of board?.pieces?.filter(part => part.lane === lane) || []) {
      tile.append(element("p", "piece" + (piece.kind === "target" ? " target" : ""),
        piece.owner.toUpperCase() + " / " + piece.kind.toUpperCase() + " / " + piece.port));
    }
    if (board?.puzzle?.lane === lane) tile.append(element("p", "lane-note",
      "GAP: " + (board.puzzle.adapter || "NO ADAPTER") + (board.bridgeReceipt ? " / BRIDGE MADE" : "")));
    if (board?.bridgeLane === lane && board.finished) tile.append(element("p", "lane-note", "STABILIZED"));
    lanes.append(tile);
  }
  const hand = $("#hand");
  hand.replaceChildren();
  const active = Boolean(board && !board.finished && !receiving);
  for (const card of CARDS) {
    const count = board ? board.hand[board.turn][card.id] : 0;
    const button = element("button", "card-tile");
    button.type = "button";
    button.dataset.card = card.id;
    button.disabled = !active || !count || state.pending;
    button.append(element("strong", "", card.title), element("span", "", card.description));
    const foot = element("span", "card-footer");
    foot.append(element("b", "", "COST " + card.cost), element("b", "", "×" + count));
    button.append(foot);
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
