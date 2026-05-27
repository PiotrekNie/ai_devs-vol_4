/**
 * Prefetch drone map PNG before the ReAct loop (binary-safe; http_request cannot).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type FetchImpl = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export async function ensureDroneMapCached(
  mapUrl: string,
  localPath: string,
  fetchImpl: FetchImpl = fetch,
): Promise<{ bytes: number; localPath: string }> {
  const url = mapUrl.trim();
  if (!url) {
    throw new Error(
      "DRONE_MAP_URL is required — set it in tasks/.env (map PNG URL from the course platform).",
    );
  }

  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch drone map: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType &&
    !contentType.includes("image/") &&
    !url.toLowerCase().endsWith(".png")
  ) {
    throw new Error(
      `Unexpected map content-type: ${contentType} (expected image/*)`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error("Fetched map is empty");
  }

  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, bytes);

  return { bytes: bytes.length, localPath };
}
