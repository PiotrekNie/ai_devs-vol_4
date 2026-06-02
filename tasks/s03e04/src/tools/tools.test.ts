import { describe, expect, test } from "bun:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "../catalog/loadCatalog.js";
import { findCitiesForProduct } from "./findCitiesForProduct.js";
import { findCitiesWithAllProducts } from "./findCitiesWithAllProducts.js";
import { byteLength, clampOutput } from "./formatOutput.js";

const csvDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../csv",
);
const catalog = loadCatalog(csvDir);

describe("formatOutput", () => {
  test("E6: clamp keeps 4-500 bytes", () => {
    const short = clampOutput("ok");
    expect(byteLength(short)).toBeGreaterThanOrEqual(4);

    const long = clampOutput("Miasto, ".repeat(80));
    expect(byteLength(long)).toBeLessThanOrEqual(500);
  });
});

describe("findCitiesForProduct", () => {
  test("E2: turbine 48V cities", () => {
    const output = findCitiesForProduct(catalog, "turbina wiatrowa 400W 48V");
    expect(output).toContain("Skolwin");
    expect(output).toContain("Rzeszow");
    expect(output).toContain("Domatowo");
    expect(byteLength(output)).toBeLessThanOrEqual(500);
  });

  test("E4: empty params", () => {
    expect(findCitiesForProduct(catalog, "")).toBe("Podaj opis produktu.");
  });
});

describe("findCitiesWithAllProducts", () => {
  test("E1: 48V kit intersection", () => {
    const output = findCitiesWithAllProducts(
      catalog,
      "turbina wiatrowa 48V, inwerter 48V 3000W, akumulator AGM 48V",
    );
    expect(output).toBe("Domatowo, Skolwin");
  });

  test("E5: unrelated triple has no common cities", () => {
    const output = findCitiesWithAllProducts(
      catalog,
      "turbina wiatrowa 400W 24V, Inwerter DC/AC 12V 1500W, Akumulator kwasowy 12V 200Ah",
    );
    expect(output).toBe("Brak miast ze wszystkimi produktami.");
  });
});
