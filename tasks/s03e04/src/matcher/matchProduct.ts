import type { CatalogIndex, Item } from "../catalog/types.js";
import {
  extractSpecTokens,
  looksLikeItemCode,
  normalizeText,
  tokenize,
} from "./normalize.js";

export const MIN_SCORE = 2;
export const MIN_MARGIN = 1;

type ScoredItem = {
  item: Item;
  score: number;
};

function scoreItem(item: Item, params: string, tokens: string[]): number {
  let score = 0;

  for (const token of tokens) {
    if (item.normalizedName.includes(token)) {
      score += token.length >= 4 ? 2 : 1;
    }
  }

  const normalizedParams = normalizeText(params);
  if (
    normalizedParams.length >= 6 &&
    item.normalizedName.includes(normalizedParams)
  ) {
    score += 4;
  }

  for (const spec of extractSpecTokens(params)) {
    if (item.normalizedName.includes(spec)) {
      score += 2;
    }
  }

  return score;
}

export function matchProduct(
  catalog: CatalogIndex,
  params: string,
): Item | null {
  const trimmed = params.trim();
  if (!trimmed) return null;

  if (looksLikeItemCode(trimmed)) {
    return catalog.itemsByCode.get(trimmed.toUpperCase()) ?? null;
  }

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return null;

  const scored: ScoredItem[] = catalog.items.map((item) => ({
    item,
    score: scoreItem(item, trimmed, tokens),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const second = scored[1];

  if (!best || best.score < MIN_SCORE) return null;
  if (second && best.score - second.score < MIN_MARGIN) return null;

  return best.item;
}

const SEGMENT_SPLIT =
  /\s*(?:,|;|\boraz\b|\bi\b|\bor\b|\+)\s*/i;

export function splitProductSegments(params: string): string[] {
  return params
    .split(SEGMENT_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);
}

export type MatchProductsResult =
  | { ok: true; items: Item[] }
  | { ok: false; message: string };

export function matchProducts(
  catalog: CatalogIndex,
  params: string,
): MatchProductsResult {
  const segments = splitProductSegments(params);
  if (segments.length === 0) {
    return { ok: false, message: "Podaj opis produktu." };
  }

  const items: Item[] = [];
  for (const segment of segments) {
    const item = matchProduct(catalog, segment);
    if (!item) {
      const preview =
        segment.length > 40 ? `${segment.slice(0, 37)}...` : segment;
      return { ok: false, message: `Nie rozpoznano: ${preview}.` };
    }
    items.push(item);
  }

  return { ok: true, items };
}
