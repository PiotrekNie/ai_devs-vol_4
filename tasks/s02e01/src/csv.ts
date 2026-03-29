import { parse } from "csv-parse/sync";

export interface CategorizeRow {
  id: string;
  description: string;
}

function stripBom(key: string): string {
  return key.replace(/^\uFEFF/, "").trim();
}

/** Normalize header keys (CSV may start with \ufeffid). */
function normalizeRecord(rec: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec)) {
    out[stripBom(k)] = typeof v === "string" ? v : String(v ?? "");
  }
  return out;
}

function getByAliases(rec: Record<string, string>, aliases: string[]): string {
  const lowerMap = new Map(
    Object.entries(rec).map(([k, v]) => [k.toLowerCase(), v.trim()]),
  );
  for (const a of aliases) {
    const v = lowerMap.get(a.toLowerCase()) ?? rec[a]?.trim();
    if (v) {
      return v;
    }
  }
  return "";
}

const ID_ALIASES = [
  "id",
  "identifier",
  "identyfikator",
  "item_id",
  "itemid",
  "sku",
  "nr",
  "numer",
  "number",
  "kod",
  "code",
];

const DESC_ALIASES = [
  "description",
  "desc",
  "opis",
  "name",
  "title",
  "product",
  "towar",
];

/**
 * Expected: id + description columns (hub requires a non-empty item id in the prompt).
 * Falls back to first column = id, second = description when headers differ.
 */
export function parseCategorizeCsv(text: string): CategorizeRow[] {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const rows: CategorizeRow[] = [];
  for (const raw of records) {
    const rec = normalizeRecord(raw);
    let id = getByAliases(rec, ID_ALIASES);
    let description = getByAliases(rec, DESC_ALIASES);

    const keys = Object.keys(rec).filter((k) => k.length > 0);
    if (!id && keys.length >= 2) {
      const k0 = keys[0];
      const k1 = keys[1];
      if (k0 !== undefined && k1 !== undefined) {
        id = rec[k0]?.trim() ?? "";
        if (!description) {
          description = rec[k1]?.trim() ?? "";
        }
      }
    } else if (!id && keys.length >= 1) {
      const k0 = keys[0];
      if (k0 !== undefined) {
        id = rec[k0]?.trim() ?? "";
      }
    }

    if (id || description) {
      rows.push({ id, description });
    }
  }
  return rows;
}
