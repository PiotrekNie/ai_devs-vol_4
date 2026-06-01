import { REACTOR_COLS, REACTOR_ROWS } from "../../config.js";
import type { Block, Command, GameState, Goal, Player, ReactorHubResponse } from "./types.js";

export function cloneBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) => ({ ...b }));
}

/** Advance all reactor blocks one tick (before robot moves). */
export function moveBlocks(blocks: Block[]): Block[] {
  const next = cloneBlocks(blocks);
  for (const block of next) {
    if (block.direction === "up") {
      if (block.top_row <= 1) {
        block.direction = "down";
      } else {
        block.top_row -= 1;
        block.bottom_row -= 1;
        if (block.top_row <= 1) {
          block.direction = "down";
        }
      }
    } else {
      if (block.bottom_row >= REACTOR_ROWS) {
        block.direction = "up";
      } else {
        block.top_row += 1;
        block.bottom_row += 1;
        if (block.bottom_row >= REACTOR_ROWS) {
          block.direction = "up";
        }
      }
    }
  }
  return next;
}

export function occupies(blocks: Block[], col: number, row: number): boolean {
  return blocks.some(
    (b) => b.col === col && row >= b.top_row && row <= b.bottom_row,
  );
}

export function isSafe(state: GameState): boolean {
  return !occupies(state.blocks, state.player.col, state.player.row);
}

export function stateKey(state: GameState): string {
  const blocks = [...state.blocks]
    .sort((a, b) => a.col - b.col)
    .map((b) => `${b.col}:${b.top_row}-${b.bottom_row}${b.direction[0]}`)
    .join("|");
  return `${state.player.col},${state.player.row}|${blocks}`;
}

export function blocksEqual(a: Block[], b: Block[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.col - y.col);
  const sortedB = [...b].sort((x, y) => x.col - y.col);
  return sortedA.every(
    (block, i) =>
      block.col === sortedB[i]!.col &&
      block.top_row === sortedB[i]!.top_row &&
      block.bottom_row === sortedB[i]!.bottom_row &&
      block.direction === sortedB[i]!.direction,
  );
}

export function parseGameState(data: ReactorHubResponse): GameState {
  if (!data.player || !data.goal || !data.blocks) {
    throw new Error("Hub response missing player, goal, or blocks");
  }
  return {
    player: data.player,
    blocks: data.blocks,
    goal: data.goal,
  };
}

export function applyCommand(
  state: GameState,
  command: Command,
): GameState | "crush" | "goal" {
  const blocks = moveBlocks(state.blocks);
  const { player, goal } = state;

  if (occupies(blocks, player.col, player.row)) {
    return "crush";
  }

  if (command === "wait") {
    return { player, blocks, goal };
  }

  if (command === "left") {
    const col = player.col - 1;
    if (col < 1 || occupies(blocks, col, player.row)) {
      return "crush";
    }
    return { player: { col, row: player.row }, blocks, goal };
  }

  if (command === "right") {
    const col = player.col + 1;
    if (col > REACTOR_COLS || occupies(blocks, col, player.row)) {
      return "crush";
    }
    const nextPlayer: Player = { col, row: player.row };
    if (nextPlayer.col === goal.col && nextPlayer.row === goal.row) {
      return "goal";
    }
    return { player: nextPlayer, blocks, goal };
  }

  return state;
}

export function isAtGoal(player: Player, goal: Goal): boolean {
  return player.col === goal.col && player.row === goal.row;
}
