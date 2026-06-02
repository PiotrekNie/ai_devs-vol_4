import { cityNamesForItem } from "../catalog/loadCatalog.js";
import type { CatalogIndex } from "../catalog/types.js";
import { matchProducts } from "../matcher/matchProduct.js";
import { clampOutput, formatCityList } from "./formatOutput.js";

function intersectCityCodes(sets: Set<string>[]): Set<string> {
  if (sets.length === 0) return new Set();
  const [first, ...rest] = sets;
  const result = new Set(first);
  for (const set of rest) {
    for (const code of [...result]) {
      if (!set.has(code)) result.delete(code);
    }
  }
  return result;
}

export function findCitiesWithAllProducts(
  catalog: CatalogIndex,
  params: string,
): string {
  const trimmed = params.trim();
  if (!trimmed) return "Podaj opis produktu.";

  const matched = matchProducts(catalog, trimmed);
  if (!matched.ok) return clampOutput(matched.message);

  const citySets = matched.items.map(
    (item) => catalog.cityCodesByItem.get(item.code) ?? new Set<string>(),
  );
  const commonCodes = intersectCityCodes(citySets);

  const cityNames = [...commonCodes]
    .map((code) => catalog.citiesByCode.get(code)?.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b, "pl"));

  if (cityNames.length === 0) {
    return "Brak miast ze wszystkimi produktami.";
  }

  return formatCityList(cityNames);
}
