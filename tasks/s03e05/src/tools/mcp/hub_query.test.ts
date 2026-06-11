import { afterEach, describe, expect, test, mock } from "bun:test";
import {
  getDiscoveryState,
  resetDiscoveryStore,
} from "../../domain/discovery_store.js";
import { executeHubQuery } from "./hub_query.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  resetDiscoveryStore();
  mock.restore();
});

describe("hub_query", () => {
  test("records maps response in discovery store", async () => {
    process.env["HUB_API_KEY"] = "test-key";

    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          code: 241,
          map: [["S", "."], [".", "G"]],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const result = await executeHubQuery({ path: "maps", query: "Skolwin" });
    const text = result.content[0]?.text ?? "";
    expect(text).toContain('"ok":true');
    expect(getDiscoveryState().grid).not.toBeNull();
    expect(getDiscoveryState().rawByPath["maps"]?.length).toBe(1);
  });

  test("returns error when HUB_API_KEY missing", async () => {
    const prev = process.env["HUB_API_KEY"];
    process.env["HUB_API_KEY"] = "";
    const result = await executeHubQuery({ path: "toolsearch", query: "map" });
    expect(result.content[0]?.text).toContain("HUB_API_KEY");
    process.env["HUB_API_KEY"] = prev;
  });
});
