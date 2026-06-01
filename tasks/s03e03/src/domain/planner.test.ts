import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chooseCommand, chooseCommandBfs } from "./planner.js";
import { parseGameState } from "./simulate.js";
import { reactorHubResponseSchema } from "./types.js";

const fixturesDir = new URL("./fixtures/", import.meta.url);

describe("planner", () => {
  it("returns a move command for start fixture", () => {
    const start = reactorHubResponseSchema.parse(
      JSON.parse(readFileSync(join(fixturesDir.pathname, "start-01.json"), "utf8")),
    );
    const state = parseGameState(start);
    const choice = chooseCommand(state);
    expect(["right", "wait", "left"]).toContain(choice.command);
    expect(choice.reason.length).toBeGreaterThan(0);
  });

  it("BFS finds first step on recorded mid-game state", () => {
    const step = JSON.parse(
      readFileSync(join(fixturesDir.pathname, "steps/right-4.json"), "utf8"),
    ) as { before: ReturnType<typeof parseGameState> extends infer T ? T : never };
    const choice = chooseCommandBfs({
      player: step.before.player,
      blocks: step.before.blocks,
      goal: step.before.goal,
    });
    expect(choice?.command).toBe("right");
  });
});
