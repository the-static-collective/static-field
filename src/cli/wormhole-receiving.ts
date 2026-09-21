import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { canonicalize } from "../kernel/canonical.js";
import { act, exportBridgeArtifact, newMatch, type Action, type Match } from "../wormhole/game.js";
import {
  receiveBridge, moveReceiving, replayReceiving, exportReceivingResult,
  type AdmissionChoice, type IncomingArtifact, type ReceivingAction, type ReceivingWorld,
} from "../wormhole/receiving.js";

const [command, ...args] = process.argv.slice(2);
const USAGE = [
  "WORMHOLE WARS-002: local independent receiving-world game; not First Bell canon.",
  "node build/src/cli/wormhole-receiving.js receive <match.json> <artifact.json> <receiving.json> <admit|hold|refuse> <receiving-id>",
  "node build/src/cli/wormhole-receiving.js show <receiving.json>",
  "node build/src/cli/wormhole-receiving.js move <receiving.json> '<strict-action-json>'",
  "node build/src/cli/wormhole-receiving.js result <receiving.json>",
  "node build/src/cli/wormhole-receiving.js verify <receiving.json>",
  "node build/src/cli/wormhole-receiving.js demo",
  "Owner choice is a local CLI declaration, not a signed identity or real-world authorization."
].join("\n");

async function readBounded(path: string): Promise<unknown> {
  const full = resolve(path);
  if ((await stat(full)).size > 512_000) throw new Error("local input file exceeds bounded size");
  return JSON.parse(await readFile(full, "utf8")) as unknown;
}
async function save(path: string, content: unknown, createOnly: boolean): Promise<void> {
  const full = resolve(path);
  await mkdir(dirname(full), { recursive: true });
  if (createOnly) {
    await writeFile(full, JSON.stringify(content, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    return;
  }
  const temporary = full + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temporary, JSON.stringify(content, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    await rename(temporary, full);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}
function print(value: unknown): void { process.stdout.write(JSON.stringify(value, null, 2) + "\n"); }
function show(world: ReceivingWorld): unknown {
  return {
    receivingId: world.receivingId, sourceMatch: world.sourceMatch.matchId,
    claimedArtifactId: world.claimedArtifact.artifactId, admission: world.admission,
    state: replayReceiving(world),
    availableGrammar: [
      { kind: "inspect", actor: "north", lane: "porch|hall|road" },
      { kind: "attune", actor: "south", adapter: "direct|relay" },
      { kind: "cross", actor: "north", lane: "porch|hall|road" }
    ],
    nonclaims: "Local fictional admission is not an external proof, real player identity, or modification of the First Bell history."
  };
}
function demo(): void {
  let match = newMatch("wormhole-receiving-fixture");
  const actions: Action[] = [
    { kind: "play", actor: "north", card: "signal", lane: "hall" },
    { kind: "play", actor: "south", card: "receiver", lane: "hall" },
    { kind: "play", actor: "north", card: "second-chair", lane: "hall" },
    { kind: "respond", actor: "south", accept: true },
    { kind: "play", actor: "north", card: "missing-corner", lane: "hall" },
    { kind: "fit", actor: "south", adapter: "relay" },
    { kind: "test", actor: "north" },
    { kind: "deploy", actor: "south", lane: "hall" }
  ];
  for (const action of actions) {
    const next = act(match, action);
    if (next.receipt.decision.status !== "admitted") throw new Error("demo source refused");
    match = next.match;
  }
  const artifact = exportBridgeArtifact(match);
  let world = receiveBridge(match, artifact, "receiving-hall", "admit");
  if (world.admission.disposition !== "admitted") throw new Error("demo receiving world did not admit");
  const game: ReceivingAction[] = [
    { kind: "inspect", actor: "north", lane: "hall" },
    { kind: "attune", actor: "south", adapter: "relay" },
    { kind: "cross", actor: "north", lane: "hall" }
  ];
  for (const action of game) {
    const move = moveReceiving(world, action);
    if (move.receipt.disposition !== "admitted") throw new Error("demo receiving move refused");
    world = move.world;
  }
  print({ source: artifact, receiving: show(world), result: exportReceivingResult(world) });
}

try {
  if (command === "demo" && args.length === 0) demo();
  else if (command === "receive" && args.length === 5) {
    const [sourcePath, artifactPath, destinationPath, choice, id] = args as [string,string,string,string,string];
    const world = receiveBridge(
      await readBounded(sourcePath) as Match, await readBounded(artifactPath) as IncomingArtifact,
      id, choice as AdmissionChoice
    );
    await save(destinationPath, world, true);
    print(show(world));
  } else if (command === "show" && args.length === 1) {
    print(show(await readBounded(args[0]!) as ReceivingWorld));
  } else if (command === "verify" && args.length === 1) {
    const w = await readBounded(args[0]!) as ReceivingWorld;
    print({ status: "local-replay-verified", game: show(w) });
  } else if (command === "move" && args.length === 2) {
    const [destinationPath, json] = args as [string,string];
    const w = await readBounded(destinationPath) as ReceivingWorld;
    const moved = moveReceiving(w, JSON.parse(json) as ReceivingAction);
    await save(destinationPath, moved.world, false);
    print({ receipt: moved.receipt, game: show(moved.world) });
  } else if (command === "result" && args.length === 1) {
    print(exportReceivingResult(await readBounded(args[0]!) as ReceivingWorld));
  } else throw new Error(USAGE);
} catch (error) {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
}
