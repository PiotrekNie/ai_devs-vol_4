const ITEM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

const POLISH_CHAR_MAP: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

export function normalizeText(input: string): string {
  const lower = input.toLowerCase();
  const withoutDiacritics = lower.replace(
    /[ąćęłńóśźż]/g,
    (ch) => POLISH_CHAR_MAP[ch] ?? ch,
  );

  return withoutDiacritics
    .replace(/[^a-z0-9\s./+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter((token) => token.length >= 2);
  const extra = extractSpecTokens(normalized);
  return [...new Set([...tokens, ...extra])];
}

export function extractSpecTokens(input: string): string[] {
  const normalized = normalizeText(input);
  const found: string[] = [];

  for (const match of normalized.matchAll(/\b(\d+)v\b/g)) {
    found.push(`${match[1]}v`);
  }
  for (const match of normalized.matchAll(/\b(\d+)w\b/g)) {
    found.push(`${match[1]}w`);
  }
  for (const match of normalized.matchAll(/\b(\d+)ah\b/g)) {
    found.push(`${match[1]}ah`);
  }

  return found;
}

export function looksLikeItemCode(input: string): boolean {
  return ITEM_CODE_PATTERN.test(input.trim());
}
