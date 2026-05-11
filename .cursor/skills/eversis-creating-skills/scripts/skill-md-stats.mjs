/**
 * Deterministic local stats for this skill's SKILL.md (no network).
 * Invoked by eversis-collections MCP tool eversis_skill_run_script with key
 * eversis-creating-skills-skill-md-stats.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.join(__dirname, "..");
const skillMd = path.join(skillRoot, "SKILL.md");
const relPath = path.join(".cursor", "skills", "eversis-creating-skills", "SKILL.md");

if (!fs.existsSync(skillMd)) {
  console.error(JSON.stringify({ error: "SKILL.md not found", path: relPath }));
  process.exit(1);
}

const raw = fs.readFileSync(skillMd, "utf8");
const lines = raw.split(/\r?\n/);
const hasYamlFrontmatter = raw.startsWith("---");
let bodyLineCount = lines.length;
if (hasYamlFrontmatter) {
  const second = raw.indexOf("\n---\n", 3);
  if (second !== -1) {
    const afterFrontmatter = raw.slice(second + 5);
    bodyLineCount = afterFrontmatter.split(/\r?\n/).length;
  }
}

const out = {
  skillId: "eversis-creating-skills",
  path: relPath,
  lineCount: lines.length,
  bodyLineCount,
  hasYamlFrontmatter,
};

console.log(JSON.stringify(out, null, 2));
