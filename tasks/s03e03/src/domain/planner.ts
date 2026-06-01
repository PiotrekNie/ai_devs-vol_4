import { REACTOR_BFS_MAX_DEPTH } from "../../config.js";
import type { Command, GameState } from "./types.js";
import { MOVE_COMMANDS } from "./types.js";
import {
  applyCommand,
  isAtGoal,
  isSafe,
  stateKey,
} from "./simulate.js";

export type PlannerChoice = {
  command: Command;
  reason: string;
};

function buildGameState(state: GameState): GameState {
  return {
    player: { ...state.player },
    blocks: state.blocks.map((b) => ({ ...b })),
    goal: { ...state.goal },
  };
}

export function chooseCommandHeuristic(state: GameState): PlannerChoice {
  for (const command of MOVE_COMMANDS) {
    const result = applyCommand(state, command);
    if (result === "crush") continue;
    if (result === "goal") {
      return { command: "right", reason: "heurystyka: right prowadzi do celu" };
    }
    if (command === "right" && isSafe(result)) {
      return { command, reason: "heurystyka: bezpieczny ruch w prawo" };
    }
  }

  const waitResult = applyCommand(state, "wait");
  if (waitResult !== "crush" && waitResult !== "goal" && isSafe(waitResult)) {
    return { command: "wait", reason: "heurystyka: czekam aż bloczki się odsuną" };
  }

  const leftResult = applyCommand(state, "left");
  if (leftResult !== "crush" && leftResult !== "goal" && isSafe(leftResult)) {
    return { command: "left", reason: "heurystyka: ucieczka w lewo" };
  }

  return { command: "wait", reason: "heurystyka: brak bezpiecznej opcji — wait" };
}

export function chooseCommandBfs(
  state: GameState,
  maxDepth = REACTOR_BFS_MAX_DEPTH,
): PlannerChoice | null {
  if (isAtGoal(state.player, state.goal)) {
    return null;
  }

  type Node = { state: GameState; path: Command[] };
  const queue: Node[] = [{ state: buildGameState(state), path: [] }];
  const visited = new Set<string>([stateKey(state)]);

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node.path.length >= maxDepth) continue;

    for (const command of MOVE_COMMANDS) {
      const result = applyCommand(node.state, command);
      if (result === "crush") continue;

      const nextPath = [...node.path, command];

      if (result === "goal") {
        return {
          command: nextPath[0]!,
          reason: `BFS: ${nextPath.length} krok(ów) do celu, pierwszy: ${nextPath[0]}`,
        };
      }

      const key = stateKey(result);
      if (visited.has(key)) continue;
      visited.add(key);

      queue.push({ state: result, path: nextPath });
    }
  }

  return null;
}

export function chooseCommand(state: GameState): PlannerChoice {
  const bfs = chooseCommandBfs(state);
  if (bfs) return bfs;
  return chooseCommandHeuristic(state);
}
