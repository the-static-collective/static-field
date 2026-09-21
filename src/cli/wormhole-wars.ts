import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  act, exportBridgeArtifact, newMatch, replayMatch, type Action, type Match
} from "../wormhole/game.js";

const [command, pathArg, detail] = process.argv.slice(2);
const HELP = [
  "WORMHOLE WARS — local two-player tactical card composition encounter",
  "node build/src/cli/wormhole-wars.js init <save.json> <match-id>",
  "node build/src/cli/wormhole-wars.js show <save.json>",
  "node build/src/cli/wormhole-wars.js move <save.json> '<strict-action-json>'",
  "node build/src/cli/wormhole-wars.js artifact <save.json>",
  "node build/src/cli/wormhole-wars.js demo",
  "Players are declared local roles, not authenticated identities. This CLI does not affect Static Field canon."
].join("\n");

async function readMatch(filename: string): Promise<Match> {
  const path = resolve(filename);
  const size = (await stat(path)).size;
  if (size > 262_144) throw new Error("local game file exceeds bound");
  return JSON.parse(await readFile(path, "utf8")) as Match;
}
async function saveMatch(filename: string, match: Match, createOnly: boolean): Promise<void> {
  const path = resolve(filename);
  await mkdir(dirname(path), { recursive: true });
  if (createOnly) {
    await writeFile(path, JSON.stringify(match, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    return;
  }
  // Single-process local CLI: atomic replacement avoids partial JSON but does not
  // provide a cross-process compare-and-swap or multi-user admission plane.
  const temporary = path + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temporary, JSON.stringify(match, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}
function view(match: Match): unknown {
  const board = replayMatch(match);
  return {
    matchId: match.matchId,
    turn: board.turn,
    charge: board.charge,
    hand: board.hand,
    lanes: ["porch", "hall", "road"],
    pieces: board.pieces,
    offer: board.offer,
    puzzle: board.puzzle,
    bridgeReceipt: board.bridgeReceipt,
    bridgeLane: board.bridgeLane,
    finished: board.finished,
    refusedAttempts: board.refused,
    receiptHead: board.receiptHead,
    actions: [
      "play: {kind:'play',actor:'north',card:'signal',lane:'porch'}",
      "respond: {kind:'respond',actor:'south',accept:true}",
      "fit: {kind:'fit',actor:'south',adapter:'relay'}",
      "test: {kind:'test',actor:'north'}",
      "deploy: {kind:'deploy',actor:'south',lane:'porch'}",
      "rest: {kind:'rest',actor:'north'}"
    ],
    disclaimer: "Local fictional game receipts only; no project-native witness, external identity or shared-world admission."
  };
}
function print(value: unknown): void { process.stdout.write(JSON.stringify(value, null, 2) + "\n"); }
function demo(): void {
  let match = newMatch("wormhole-specimen");
  const actions: Action[] = [
    { kind: "play", actor: "north", card: "signal", lane: "porch" },
    { kind: "play", actor: "south", card: "receiver", lane: "porch" },
    { kind: "play", actor: "north", card: "second-chair", lane: "porch" },
    { kind: "respond", actor: "south", accept: true },
    { kind: "play", actor: "north", card: "missing-corner", lane: "porch" },
    { kind: "fit", actor: "south", adapter: "relay" },
    { kind: "test", actor: "north" },
    { kind: "deploy", actor: "south", lane: "porch" },
  ];
  for (const action of actions) {
    const result = act(match, action);
    if (result.receipt.decision.status !== "admitted") throw new Error("specimen action unexpectedly refused");
    match = result.match;
  }
  print({ board: view(match), artifact: exportBridgeArtifact(match), moves: match.events.length });
}
try {
  if (command === "demo" && pathArg === undefined && detail === undefined) demo();
  else if (command === "init" && pathArg && detail) {
    const match = newMatch(detail);
    await saveMatch(pathArg, match, true);
    print(view(match));
  } else if (command === "show" && pathArg && detail === undefined) {
    const match = await readMatch(pathArg);
    print(view(match));
  } else if (command === "move" && pathArg && detail) {
    const match = await readMatch(pathArg);
    const result = act(match, JSON.parse(detail) as Action);
    await saveMatch(pathArg, result.match, false);
    print({ receipt: result.receipt, board: view(result.match) });
  } else if (command === "artifact" && pathArg && detail === undefined) {
    print(exportBridgeArtifact(await readMatch(pathArg)));
  } else {
    throw new Error(HELP);
  }
} catch (error) {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
}
