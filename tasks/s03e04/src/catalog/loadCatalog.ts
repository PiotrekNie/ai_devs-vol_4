import { readFileSync } from "node:fs";
import path from "node:path";
import { CSV_DIR } from "../../config.js";
import { normalizeText } from "../matcher/normalize.js";
import type { CatalogIndex, City, Item } from "./types.js";

function parseCsv(content: string): string[][] {
  const lines = content.trim().split(/\r?\n/);
  return lines.slice(1).map((line) => {
    const comma = line.lastIndexOf(",");
    if (comma <= 0) return ["", ""];
    return [line.slice(0, comma).trim(), line.slice(comma + 1).trim()];
  });
}

export function loadCatalog(csvDir: string = CSV_DIR): CatalogIndex {
  const itemsRows = parseCsv(
    readFileSync(path.join(csvDir, "items.csv"), "utf8"),
  );
  const citiesRows = parseCsv(
    readFileSync(path.join(csvDir, "cities.csv"), "utf8"),
  );
  const connectionsRows = parseCsv(
    readFileSync(path.join(csvDir, "connections.csv"), "utf8"),
  );

  const items: Item[] = itemsRows
    .filter(([name, code]) => Boolean(name && code))
    .map(([name, code]) => ({
      name: name!,
      code: code!,
      normalizedName: normalizeText(name!),
    }));

  const itemsByCode = new Map<string, Item>(
    items.map((item) => [item.code, item]),
  );

  const citiesByCode = new Map<string, City>(
    citiesRows
      .filter(([name, code]) => Boolean(name && code))
      .map(([name, code]) => [code!, { name: name!, code: code! }]),
  );

  const cityCodesByItem = new Map<string, Set<string>>();
  for (const [itemCode, cityCode] of connectionsRows) {
    if (!itemCode || !cityCode) continue;
    let set = cityCodesByItem.get(itemCode);
    if (!set) {
      set = new Set<string>();
      cityCodesByItem.set(itemCode, set);
    }
    set.add(cityCode);
  }

  return { items, itemsByCode, citiesByCode, cityCodesByItem };
}

export function cityNamesForItem(
  catalog: CatalogIndex,
  itemCode: string,
): string[] {
  const codes = catalog.cityCodesByItem.get(itemCode);
  if (!codes || codes.size === 0) return [];

  return [...codes]
    .map((code) => catalog.citiesByCode.get(code)?.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b, "pl"));
}
