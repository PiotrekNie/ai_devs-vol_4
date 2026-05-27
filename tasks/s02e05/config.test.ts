import { describe, expect, it } from "bun:test";
import { DRONE_DOCS_URL, DRONE_MAP_LOCAL_PATH, DRONE_MAP_URL } from "./config.js";

describe("config", () => {
  it("DRONE_DOCS_URL has course default", () => {
    expect(DRONE_DOCS_URL).toBe("https://hub.ag3nts.org/dane/drone.html");
  });

  it("DRONE_MAP_URL is exported as string (set via env at runtime)", () => {
    expect(typeof DRONE_MAP_URL).toBe("string");
  });

  it("DRONE_MAP_LOCAL_PATH defaults to data/map.png", () => {
    expect(DRONE_MAP_LOCAL_PATH).toBe("data/map.png");
  });
});
