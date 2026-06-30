import { access, mkdir } from "node:fs/promises";
import { DEMAND_LOCAL_PATH, FOOD4CITIES_URL } from "../../config.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download city demand JSON if not cached. Returns absolute path to the file.
 */
export async function downloadDemand(): Promise<string> {
  if (await pathExists(DEMAND_LOCAL_PATH)) {
    return DEMAND_LOCAL_PATH;
  }

  await mkdir(DEMAND_LOCAL_PATH.replace(/\/[^/]+$/, ""), { recursive: true });

  const response = await fetch(FOOD4CITIES_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${FOOD4CITIES_URL}: HTTP ${response.status}`,
    );
  }

  await Bun.write(DEMAND_LOCAL_PATH, await response.text());

  if (!(await pathExists(DEMAND_LOCAL_PATH))) {
    throw new Error(`Expected demand file at ${DEMAND_LOCAL_PATH}`);
  }

  return DEMAND_LOCAL_PATH;
}
