import { mkdir, rename } from "node:fs/promises";
import path from "node:path";

const SESSIONS_DIR = path.join(import.meta.dir, "..", "data", "sessions");

/** Plain sessionID in the filename; only strip path separators / nulls for a safe single path segment. */
function sessionFileBase(sessionID: string): string {
  const safe = sessionID
    .trim()
    .replace(/[/\\]/g, "_")
    .replace(/\0/g, "")
    .slice(0, 200);
  return safe || "session";
}

export async function ensureSessionsDir(): Promise<void> {
  await mkdir(SESSIONS_DIR, { recursive: true });
}

export async function loadSessionInput(sessionID: string): Promise<unknown[]> {
  const filePath = path.join(SESSIONS_DIR, `${sessionFileBase(sessionID)}.json`);
  const f = Bun.file(filePath);
  if (!(await f.exists())) {
    return [];
  }
  try {
    const data: unknown = await f.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveSessionInput(
  sessionID: string,
  nextInput: unknown[],
): Promise<void> {
  const finalPath = path.join(
    SESSIONS_DIR,
    `${sessionFileBase(sessionID)}.json`,
  );
  const tmpPath = `${finalPath}.tmp`;
  const payload = JSON.stringify(nextInput, null, 2);
  await Bun.write(tmpPath, payload);
  await rename(tmpPath, finalPath);
}
