import path from "node:path";
import { postRailwayAnswer } from "./hubClient.ts";

export const CONCEPTS_FILE = path.join(import.meta.dir, "..", "concepts.json");

function wantsRefreshHelp(): boolean {
  if (process.argv.includes("--refresh-help")) {
    return true;
  }
  return process.env.RAILWAY_REFRESH_HELP === "1";
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
}

/**
 * Minimal validation: non-empty object; typical help responses include strings or nested maps.
 */
export function isValidHelpPayload(value: unknown): boolean {
  if (!isNonEmptyObject(value)) {
    return false;
  }
  const json = JSON.stringify(value);
  return json.includes("action") || json.includes("help") || json.includes("Action");
}

export async function loadHelpPayloadFromDisk(): Promise<unknown | null> {
  const file = Bun.file(CONCEPTS_FILE);
  const exists = await file.exists();
  if (!exists) {
    console.log(`[helpCache] no ${CONCEPTS_FILE} — will fetch help from Hub`);
    return null;
  }

  try {
    const text = await file.text();
    const parsed: unknown = JSON.parse(text);
    if (!isValidHelpPayload(parsed)) {
      console.warn("[helpCache] concepts.json failed validation — will refetch help");
      return null;
    }
    console.log(`[helpCache] loaded help payload from ${CONCEPTS_FILE}`);
    return parsed;
  } catch (e) {
    console.warn("[helpCache] could not parse concepts.json — will refetch help:", e);
    return null;
  }
}

export async function saveHelpPayload(payload: unknown): Promise<void> {
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  await Bun.write(CONCEPTS_FILE, text);
  console.log(`[helpCache] wrote ${CONCEPTS_FILE}`);
}

/**
 * Returns help documentation object (from disk unless refresh is forced, then Hub).
 */
export async function loadHelpPayload(): Promise<unknown> {
  if (!wantsRefreshHelp()) {
    const cached = await loadHelpPayloadFromDisk();
    if (cached !== null) {
      return cached;
    }
  } else {
    console.log("[helpCache] refresh forced — fetching help from Hub");
  }

  const raw = await postRailwayAnswer({ action: "help" });
  if (!isValidHelpPayload(raw)) {
    console.warn("[helpCache] help response failed minimal validation — still persisting for inspection");
  }
  await saveHelpPayload(raw);
  return raw;
}
