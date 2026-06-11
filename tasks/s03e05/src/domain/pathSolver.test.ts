import { describe, expect, test } from "bun:test";
import mapFixture from "./__fixtures__/maps-skolwin.json";
import {
  buildGameConfig,
  defaultVehicleProfiles,
  parseGridFromMaps,
} from "./parseHubResponses.js";
import { solveBestRoute, solveRoute } from "./pathSolver.js";

describe("pathSolver", () => {
  const grid = parseGridFromMaps(mapFixture);
  const config = buildGameConfig(grid!, defaultVehicleProfiles());

  test("finds rocket route with dismount on Skolwin fixture", () => {
    const route = solveRoute(config!, "rocket");
    expect(route).not.toBeNull();
    expect(route![0]).toBe("rocket");
    expect(route).toContain("dismount");
    expect(route!.at(-1)).toBeDefined();
  });

  test("solveBestRoute picks rocket for fixture", () => {
    const best = solveBestRoute(config!);
    expect(best?.vehicle).toBe("rocket");
    expect(best?.route.length).toBeGreaterThan(2);
  });
});
