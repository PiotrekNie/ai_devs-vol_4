import type { CategorizedLogRow } from "./categorizeData.js";
import { mergeDedupeCategorized } from "./jsonList.js";
import { minimizeMessage, normalizeBodyKey } from "./minimizeMessage.js";

/** Dedupe by date + status + message; later rows win (same as JsonList merge). */
export function dedupeCategorizedRows(
  rows: CategorizedLogRow[],
): CategorizedLogRow[] {
  return mergeDedupeCategorized([], rows);
}

function rowKeyStatusMessage(r: CategorizedLogRow): string {
  return `${r.status}\0${normalizeBodyKey(r.message)}`;
}

/** Dedupe by status + normalized message body; later rows win (timestamps from the last occurrence). */
export function dedupeCategorizedRowsByMessage(
  rows: CategorizedLogRow[],
): CategorizedLogRow[] {
  const map = new Map<string, CategorizedLogRow>();
  for (const r of rows) {
    map.set(rowKeyStatusMessage(r), r);
  }
  return [...map.values()];
}

export type DedupeRowsMode = "exact" | "same_message";

export function dedupeCategorizedRowsWithMode(
  rows: CategorizedLogRow[],
  mode: DedupeRowsMode,
): CategorizedLogRow[] {
  return mode === "same_message"
    ? dedupeCategorizedRowsByMessage(rows)
    : dedupeCategorizedRows(rows);
}

const STATUSES = ["INFO", "WARN", "CRIT"] as const;
export type LogStatus = (typeof STATUSES)[number];

export function filterRowsByStatus(
  rows: CategorizedLogRow[],
  statuses: LogStatus[],
): CategorizedLogRow[] {
  const set = new Set<LogStatus>(statuses);
  return rows.filter((r) => set.has(r.status));
}

/** Ascending by `date` (YYYY-MM-DD HH:mm:ss); tie-break status then message for stable output. */
export function sortCategorizedRowsByLogDate(
  rows: CategorizedLogRow[],
): CategorizedLogRow[] {
  return [...rows].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    const s = a.status.localeCompare(b.status);
    if (s !== 0) return s;
    return a.message.localeCompare(b.message);
  });
}

const DEFAULT_MINIFY_CONCURRENCY = Math.min(
  8,
  Math.max(1, Number(process.env.S02E03_MINIFY_CONCURRENCY ?? 4)),
);

/**
 * Shortens each row's message via minimizeMessage; order preserved.
 * Runs up to `concurrency` minimizations in parallel per chunk to limit rate spikes.
 */
export async function minifyCategorizedRows(
  rows: CategorizedLogRow[],
  concurrency: number = DEFAULT_MINIFY_CONCURRENCY,
): Promise<CategorizedLogRow[]> {
  const out: CategorizedLogRow[] = [];
  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    const part = await Promise.all(
      chunk.map(async (r) => ({
        ...r,
        message: await minimizeMessage(r.message),
      })),
    );
    out.push(...part);
  }
  return out;
}
