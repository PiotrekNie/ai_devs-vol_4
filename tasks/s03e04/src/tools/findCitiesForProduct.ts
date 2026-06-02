import { cityNamesForItem, loadCatalog } from "../catalog/loadCatalog.js";
import type { CatalogIndex } from "../catalog/types.js";
import { matchProduct } from "../matcher/matchProduct.js";
import { formatCityList } from "./formatOutput.js";

export function findCitiesForProduct(
  catalog: CatalogIndex,
  params: string,
): string {
  const trimmed = params.trim();
  if (!trimmed) return "Podaj opis produktu.";

  const item = matchProduct(catalog, trimmed);
  if (!item) return "Nie rozpoznano produktu.";

  return formatCityList(cityNamesForItem(catalog, item.code));
}
