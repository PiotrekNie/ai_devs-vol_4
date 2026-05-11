import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { findRepoRoot } from "./resolveRoot.js";

/**
 * Central allowlist: script key -> path relative to repository root.
 * New entries must be reviewed in the same PR as the script in each
 * eversis-* skill's scripts/ directory.
 */
const ALLOWED = {
  "eversis-creating-skills-skill-md-stats":
    ".cursor/skills/eversis-creating-skills/scripts/skill-md-stats.mjs",
} as const;

export type SkillScriptKey = keyof typeof ALLOWED;

export type RunSkillScriptResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

function keysForZod(): [SkillScriptKey, ...SkillScriptKey[]] {
  const keys = Object.keys(ALLOWED) as SkillScriptKey[];
  if (keys.length === 0) {
    throw new Error("eversis-collections-mcp: no allowlisted skill scripts");
  }
  return keys as [SkillScriptKey, ...SkillScriptKey[]];
}

export { keysForZod as skillScriptKeysForZod };

export function listAllowedSkillScripts(): string[] {
  return Object.keys(ALLOWED);
}

export function runAllowlistedSkillScript(
  startDir: string,
  scriptKey: string
): Promise<RunSkillScriptResult> {
  const rel = ALLOWED[scriptKey as SkillScriptKey];
  if (!rel) {
    return Promise.resolve({
      exitCode: 1,
      stdout: "",
      stderr: `Unknown skill script. Allowed: ${listAllowedSkillScripts().join(", ")}`,
    });
  }
  const repoRoot = findRepoRoot(startDir);
  const scriptPath = path.join(repoRoot, rel);
  if (!fs.existsSync(scriptPath)) {
    return Promise.resolve({
      exitCode: 1,
      stdout: "",
      stderr: `Script not found at ${rel}`,
    });
  }

  return new Promise((resolve) => {
    const chunksOut: Buffer[] = [];
    const chunksErr: Buffer[] = [];
    const child = spawn(
      process.execPath,
      [scriptPath],
      {
        cwd: repoRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    child.stdout?.on("data", (d) => chunksOut.push(Buffer.from(d)));
    child.stderr?.on("data", (d) => chunksErr.push(Buffer.from(d)));
    child.on("close", (code) => {
      resolve({
        exitCode: code,
        stdout: Buffer.concat(chunksOut).toString("utf8"),
        stderr: Buffer.concat(chunksErr).toString("utf8"),
      });
    });
    child.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout: "",
        stderr: String(err),
      });
    });
  });
}
