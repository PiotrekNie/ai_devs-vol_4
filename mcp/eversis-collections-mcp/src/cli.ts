#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateAllSkills } from "./validate.js";

const startDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const cmd = argv[0];

if (cmd === "validate") {
  const strict =
    argv.includes("--strict") || process.env["EVERSIS_SKILLS_VALIDATE_STRICT"] === "1";
  const result = validateAllSkills(startDir, { treatWarningsAsErrors: strict });
  for (const issue of result.issues) {
    const prefix = issue.level === "error" ? "ERROR" : "WARN ";
    console.log(`${prefix} ${issue.path}: ${issue.message}`);
  }
  console.log(`Validated ${result.skillCount} skill package(s).`);
  if (!result.ok) {
    process.exit(1);
  }
  process.exit(0);
}

console.error(`Usage: eversis-collections validate [--strict]
  --strict  Treat validation warnings as failures (or set EVERSIS_SKILLS_VALIDATE_STRICT=1)`);
process.exit(1);
