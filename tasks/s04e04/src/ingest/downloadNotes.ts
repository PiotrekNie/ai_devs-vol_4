import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { NOTES_DIR, NOTES_URL, NOTES_ZIP_PATH } from "../../config.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download and unzip Natan notes if not cached. Returns absolute notes directory.
 */
export async function downloadNotes(): Promise<string> {
  const readmePath = join(NOTES_DIR, "README.md");
  if (await pathExists(readmePath)) {
    return NOTES_DIR;
  }

  await mkdir(join(NOTES_DIR, ".."), { recursive: true });

  const response = await fetch(NOTES_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${NOTES_URL}: HTTP ${response.status}`,
    );
  }

  await Bun.write(NOTES_ZIP_PATH, await response.arrayBuffer());
  await mkdir(NOTES_DIR, { recursive: true });
  await $`unzip -o ${NOTES_ZIP_PATH} -d ${NOTES_DIR}`.quiet();

  if (!(await pathExists(readmePath))) {
    throw new Error(
      `Expected README.md in ${NOTES_DIR} after unzip — check archive layout.`,
    );
  }

  return NOTES_DIR;
}

/**
 * Absolute paths to the four source files for prompts.
 */
export function noteFilePaths(notesDir: string): {
  readme: string;
  ogloszenia: string;
  transakcje: string;
  rozmowy: string;
} {
  return {
    readme: join(notesDir, "README.md"),
    ogloszenia: join(notesDir, "ogłoszenia.txt"),
    transakcje: join(notesDir, "transakcje.txt"),
    rozmowy: join(notesDir, "rozmowy.txt"),
  };
}
