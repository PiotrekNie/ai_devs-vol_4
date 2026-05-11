import fs from "node:fs";
import path from "node:path";

/**
 * Walk upward from `startDir` until `.cursor/skills` exists.
 * Falls back to `EVERSIS_COLLECTIONS_ROOT` when set.
 */
export function findRepoRoot(startDir: string): string {
  let dir = path.resolve(startDir);
  for (;;) {
    const skillsPath = path.join(dir, ".cursor", "skills");
    if (fs.existsSync(skillsPath) && fs.statSync(skillsPath).isDirectory()) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  const envRoot = process.env["EVERSIS_COLLECTIONS_ROOT"];
  if (envRoot) {
    const resolved = path.resolve(envRoot);
    const skillsPath = path.join(resolved, ".cursor", "skills");
    if (fs.existsSync(skillsPath)) {
      return resolved;
    }
    throw new Error(
      `EVERSIS_COLLECTIONS_ROOT=${envRoot} does not contain .cursor/skills`
    );
  }
  throw new Error(
    "Could not find repository root (directory with .cursor/skills). Set EVERSIS_COLLECTIONS_ROOT to override."
  );
}

export function assertUnderRoot(repoRoot: string, candidate: string): string {
  const resolved = path.resolve(candidate);
  const root = path.resolve(repoRoot);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Path escapes repository root: ${candidate}`);
  }
  return resolved;
}
