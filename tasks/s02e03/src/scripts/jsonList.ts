import { createHash } from "node:crypto";
import { z } from "zod";
import { logEntrySchema } from "./categorizeData.js";
import type { CategorizedData } from "../types/index.js";
import type { CategorizedLogRow } from "../scripts/categorizeData.js";

/** On-disk JSON for pipeline cache: fingerprint of CRIT inputs + full categorized rows. */
export const jsonListCacheSchema = z.object({
  inputFingerprint: z.string(),
  data: z.array(logEntrySchema),
});

/** Accepts cache-shaped files or MCP `{ items }` / partial `data`. */
const jsonListLooseSchema = z.object({
  inputFingerprint: z.string().optional(),
  data: z.array(logEntrySchema).optional(),
  items: z.array(logEntrySchema).optional(),
});

export type JsonListCachePayload = z.infer<typeof jsonListCacheSchema>;

export type JsonListWritePayload =
  | JsonListCachePayload
  | { data: CategorizedLogRow[] };

export const writeJsonListDescription = [
  "Write a JSON list file at `path` with categorized log rows.",
  "Payload is `{ data: [...] }` (full CategorizedLogRow objects).",
  "Replaces the file contents; does not merge with existing data.",
].join(" ");

export const updateJsonListDescription = [
  "Merge categorized log rows into a JSON list file at `path`.",
  "Rows are deduplicated by date + status + message (later values win).",
  "Creates the file if missing; reads cache-shaped `{ inputFingerprint, data }` or `{ items }` / `{ data }`.",
].join(" ");

export const readJsonListFileDescription = [
  "Read a JSON list file at `path` (pipeline cache shape).",
  "Expects strict schema: `inputFingerprint` plus `data` (full categorized rows).",
  "Returns `data: null` when the file is missing or does not match this schema (e.g. loose `{ items }`-only files are not returned as structured cache).",
].join(" ");

export const buildListToVerifyDescription = [
  "Build one plaintext string from json list rows for verification.",
  "Each row becomes: a leading newline, then `[DATE] [STATUS] MESSAGE` using that row's date, status, and message.",
  "Empty `items` returns an empty string; callers choose which rows to include (no category filter).",
].join(" ");

export function buildListToVerify(
  items: Pick<CategorizedLogRow, "date" | "status" | "message">[],
): string {
  return items
    .map((row) => `\n[${row.date}] [${row.status}] ${row.message}`)
    .join("");
}

function rowKey(r: { date: string; status: string; message: string }): string {
  return `${r.date}\0${r.status}\0${r.message}`;
}

/** Merge and dedupe by date+status+message; later rows win. */
export function mergeDedupeCategorized(
  existing: CategorizedLogRow[],
  incoming: CategorizedLogRow[],
): CategorizedLogRow[] {
  const map = new Map<string, CategorizedLogRow>();
  for (const r of existing) {
    map.set(rowKey(r), r);
  }
  for (const r of incoming) {
    map.set(rowKey(r), r);
  }
  return [...map.values()];
}

export function computeInputFingerprint(rows: CategorizedData[]): string {
  const canonical = rows.map((r) => ({
    date: r.date,
    status: r.status,
    message: r.message,
  }));
  return createHash("sha256")
    .update(JSON.stringify(canonical), "utf8")
    .digest("hex");
}

function normalizeLooseRows(
  parsed: z.infer<typeof jsonListLooseSchema>,
): CategorizedLogRow[] {
  const fromData = parsed.data?.length ? parsed.data : [];
  const fromItems = parsed.items?.length ? parsed.items : [];
  if (fromData.length && fromItems.length) {
    return mergeDedupeCategorized(fromData, fromItems);
  }
  return fromData.length ? fromData : fromItems;
}

/** Read and validate pipeline cache; returns null if missing or invalid. */
export async function readJsonListFile(
  filePath: string,
): Promise<JsonListCachePayload | null> {
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return null;
    }
    const raw = await file.text();
    const parsed: unknown = JSON.parse(raw);
    const out = jsonListCacheSchema.safeParse(parsed);
    if (!out.success) {
      return null;
    }
    return out.data;
  } catch {
    return null;
  }
}

/** Read loose format for MCP merge (cache or items-only). */
export async function readJsonListLoose(
  filePath: string,
): Promise<z.infer<typeof jsonListLooseSchema> | null> {
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return null;
    }
    const raw = await file.text();
    const parsed: unknown = JSON.parse(raw);
    const out = jsonListLooseSchema.safeParse(parsed);
    if (!out.success) {
      return null;
    }
    return out.data;
  } catch {
    return null;
  }
}

export async function writeJsonList(
  filePath: string,
  payload: JsonListWritePayload,
): Promise<void> {
  const body: Record<string, unknown> = { data: payload.data };
  if ("inputFingerprint" in payload && payload.inputFingerprint !== undefined) {
    body.inputFingerprint = payload.inputFingerprint;
  }
  await Bun.write(filePath, `${JSON.stringify(body, null, 2)}\n`);
}

export async function updateJsonList(
  filePath: string,
  items: CategorizedLogRow[],
): Promise<void> {
  const loose = await readJsonListLoose(filePath);
  if (!loose) {
    await writeJsonList(filePath, { data: mergeDedupeCategorized([], items) });
    return;
  }
  const existing = normalizeLooseRows(loose);
  const merged = mergeDedupeCategorized(existing, items);
  const body =
    loose.inputFingerprint !== undefined
      ? { inputFingerprint: loose.inputFingerprint, data: merged }
      : { data: merged };
  const prevRaw = (await Bun.file(filePath).text()).trimEnd();
  const nextRaw = `${JSON.stringify(body, null, 2)}\n`.trimEnd();
  if (prevRaw === nextRaw) {
    return;
  }
  await Bun.write(filePath, `${JSON.stringify(body, null, 2)}\n`);
}
