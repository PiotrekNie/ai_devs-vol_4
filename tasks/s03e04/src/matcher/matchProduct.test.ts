import { describe, expect, test } from "bun:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "../catalog/loadCatalog.js";
import {
  matchProduct,
  matchProducts,
  splitProductSegments,
} from "./matchProduct.js";
import { normalizeText, tokenize } from "./normalize.js";

const csvDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../csv",
);
const catalog = loadCatalog(csvDir);

describe("normalize", () => {
  test("strips diacritics and lowercases", () => {
    expect(normalizeText("  Turbina  Łódź  ")).toBe("turbina lodz");
  });

  test("tokenize keeps voltage tokens", () => {
    expect(tokenize("turbina wiatrowa 48V")).toContain("48v");
  });
});

describe("matchProduct", () => {
  test("E2: matches wind turbine 48V", () => {
    const item = matchProduct(catalog, "turbina wiatrowa 400W 48V");
    expect(item?.code).toBe("WITR48");
  });

  test("matches by item code", () => {
    expect(matchProduct(catalog, "WITR48")?.code).toBe("WITR48");
  });

  test("E3: rejects nonsense", () => {
    expect(matchProduct(catalog, "losowy nonsens xyz")).toBeNull();
  });
});

describe("matchProducts / split", () => {
  test("splits on comma and oraz", () => {
    expect(
      splitProductSegments("a, b oraz c"),
    ).toEqual(["a", "b", "c"]);
  });

  test("E1: matches 48V triple", () => {
    const result = matchProducts(
      catalog,
      "turbina wiatrowa 48V, inwerter 48V 3000W, akumulator AGM 48V",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items.map((i) => i.code).sort()).toEqual([
        "06OTEA",
        "A94MAZ",
        "WITR48",
      ]);
    }
  });
});
