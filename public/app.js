const state = { map: "surface", world: null };

async function load() {
  const response = await fetch("/api/state");
  state.world = await response.json();
  render();
}

async function act(action) {
  const response = await fetch("/api/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const body = await response.json();
  const message = document.querySelector("#message");
  if (!response.ok) {
    message.textContent = body.reason ?? body.error;
    return;
  }
  message.textContent = "";
  state.world = body;
  render();
}

function render() {
  const world = state.world;
  document.querySelector("#objective").textContent = world.story.objective.replaceAll("_", " ");
  document.querySelector("#attendance").textContent =
    world.attendance.presentParticipantIds.join(", ") || "nobody recorded yet";
  document.querySelector("#charge").textContent = `${world.charge.current}/${world.charge.max}`;
  document.querySelector("#surface-state").textContent =
    JSON.stringify(world.surface, null, 2);
  document.querySelector("#resonance-state").textContent =
    JSON.stringify(world.resonance, null, 2);
  document.querySelector("#resonance-copy").textContent =
    world.resonance.available ? "a relation can be entered" : "quiet";
  const notice = document.querySelector("#notice-clue");
  notice.hidden = world.story.bellCount < 2 || world.story.secretNoticed;
  const resonanceTab = document.querySelector('[data-map="resonance"]');
  resonanceTab.disabled = !world.resonance.available && !world.resonance.entered;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.action) void act(button.dataset.action);
  if (button.dataset.map) {
    state.map = button.dataset.map;
    document.querySelectorAll("[data-map]").forEach((node) =>
      node.classList.toggle("active", node.dataset.map === state.map));
    document.querySelectorAll(".map").forEach((node) =>
      node.classList.toggle("active", node.id === state.map));
  }
});

void load();
