import { describe, expect, test } from "bun:test";
import mapFixture from "./__fixtures__/maps-skolwin.json";
import { parseGridFromMaps, parseVehicleProfile } from "./parseHubResponses.js";

describe("parseHubResponses", () => {
  test("parseGridFromMaps finds S and G", () => {
    const grid = parseGridFromMaps(mapFixture);
    expect(grid).not.toBeNull();
    expect(grid!.cells[grid!.start.y]?.[grid!.start.x]).toBe("S");
    expect(grid!.cells[grid!.goal.y]?.[grid!.goal.x]).toBe("G");
    expect(grid!.width).toBe(10);
    expect(grid!.height).toBe(10);
  });

  test("parseVehicleProfile reads consumption", () => {
    const profile = parseVehicleProfile({
      name: "rocket",
      consumption: { fuel: 1, food: 0.1 },
    });
    expect(profile?.fuelPerMove).toBe(1);
    expect(profile?.foodPerMove).toBe(0.1);
    expect(profile?.canCrossWater).toBe(false);
  });
});
