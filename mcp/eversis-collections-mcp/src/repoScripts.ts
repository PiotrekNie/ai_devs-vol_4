import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { findRepoRoot } from "./resolveRoot.js";

const ALLOWED: Record<string, string> = {
  "sync-prompts": "scripts/sync-prompts.mjs",
  "sync-framework-doc": "scripts/sync-framework-doc.mjs",
};

export type RunScriptResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export function runAllowlistedScript(
  startDir: string,
  scriptKey: string
): Promise<RunScriptResult> {
  const rel = ALLOWED[scriptKey];
  if (!rel) {
    return Promise.resolve({
      exitCode: 1,
      stdout: "",
      stderr: `Unknown script. Allowed: ${Object.keys(ALLOWED).join(", ")}`,
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

export function listAllowedScripts(): string[] {
  return Object.keys(ALLOWED);
}
