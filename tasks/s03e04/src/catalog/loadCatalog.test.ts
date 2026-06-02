import { describe, expect, test } from "bun:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./loadCatalog.js";

const csvDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../csv",
);

describe("loadCatalog", () => {
  test("loads items, cities and connections", () => {
    const catalog = loadCatalog(csvDir);
    expect(catalog.items.length).toBeGreaterThan(2000);
    expect(catalog.citiesByCode.size).toBeGreaterThanOrEqual(50);
    expect(catalog.cityCodesByItem.get("WITR48")?.size).toBe(3);
  });
});
