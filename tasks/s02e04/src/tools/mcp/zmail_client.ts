/**
 * Shared zmail HTTP client — POST JSON with hub apikey + retry on 429/503.
 *
 * Reads `HUB_API_KEY` from the environment at call time (not import time)
 * so tests can set `process.env` before invoking tools.
 */

import { fetchWithRetry } from "../../agent/ai.js";
import { ZMAIL_API_URL } from "../../../config.js";

export async function postZmail(
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const apikey = process.env["HUB_API_KEY"]?.trim() ?? "";
  if (!apikey) {
    throw new Error(
      "HUB_API_KEY is not set. Add it to tasks/.env for zmail API calls.",
    );
  }

  const payload = { apikey, ...body };
  const response = await fetchWithRetry(ZMAIL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }

  return { ok: response.ok, status: response.status, data };
}
