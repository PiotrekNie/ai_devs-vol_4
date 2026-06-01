import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  applyCommand,
  blocksEqual,
  moveBlocks,
  parseGameState,
} from "./simulate.js";
import type { Block, Command, GameState } from "./types.js";
import { reactorHubResponseSchema } from "./types.js";

const fixturesDir = new URL("./fixtures/", import.meta.url);

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

describe("moveBlocks + applyCommand vs hub fixtures", () => {
  const stepsDir = join(fixturesDir.pathname, "steps");
  const stepFiles = readdirSync(stepsDir).filter((f) => f.endsWith(".json"));

  for (const file of stepFiles) {
    it(`matches hub after ${file}`, () => {
      const step = loadJson<{
        command: Command;
        before: GameState;
        after: Record<string, unknown>;
      }>(join(stepsDir, file));

      const state: GameState = {
        player: step.before.player,
        blocks: step.before.blocks,
        goal: step.before.goal,
      };

      const simulated = applyCommand(state, step.command);
      expect(simulated).not.toBe("crush");

      const apiAfter = reactorHubResponseSchema.parse(step.after);
      if (!apiAfter.blocks || !apiAfter.player) {
        throw new Error(`Fixture ${file} missing blocks/player in after`);
      }

      if (simulated === "goal") {
        expect(apiAfter.reached_goal ?? apiAfter.player.col === step.before.goal.col).toBeTruthy();
        return;
      }

      if (simulated === "crush") {
        throw new Error(`Unexpected crush for fixture ${file}`);
      }

      expect(simulated.player).toEqual(apiAfter.player);
      expect(blocksEqual(simulated.blocks, apiAfter.blocks)).toBe(true);
    });
  }

  it("moveBlocks alone matches wait fixture block transition", () => {
    const step = loadJson<{
      before: GameState;
      after: { blocks: Block[] };
    }>(join(stepsDir, "wait-1.json"));

    const moved = moveBlocks(step.before.blocks);
    expect(blocksEqual(moved, step.after.blocks)).toBe(true);
  });

  it("parseGameState from start fixture", () => {
    const start = reactorHubResponseSchema.parse(
      loadJson(join(fixturesDir.pathname, "start-01.json")),
    );
    const state = parseGameState(start);
    expect(state.player).toEqual({ col: 1, row: 5 });
    expect(state.goal).toEqual({ col: 7, row: 5 });
    expect(state.blocks).toHaveLength(5);
  });
});
