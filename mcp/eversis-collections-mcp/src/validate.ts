import fs from "node:fs";
import path from "node:path";
import { parseSkillFrontmatter } from "./frontmatter.js";
import { findRepoRoot } from "./resolveRoot.js";

const MAX_BODY_LINES_RECOMMENDED = 500;
const SKILL_ID_PREFIX = "eversis-";

export type ValidationIssue = {
  level: "error" | "warning";
  path: string;
  message: string;
};

export type ValidateResult = {
  ok: boolean;
  issues: ValidationIssue[];
  skillCount: number;
};

function listSkillDirs(skillsDir: string): string[] {
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() && d.name.startsWith(SKILL_ID_PREFIX) && !d.name.startsWith(".")
    )
    .map((d) => d.name)
    .sort();
}

function validateOneSkill(
  skillsDir: string,
  dirName: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const relBase = path.join(".cursor", "skills", dirName);
  const skillPath = path.join(skillsDir, dirName);
  const skillMd = path.join(skillPath, "SKILL.md");
  if (!fs.existsSync(skillMd)) {
    issues.push({
      level: "error",
      path: relBase,
      message: "Missing SKILL.md",
    });
    return issues;
  }
  const raw = fs.readFileSync(skillMd, "utf8");
  const { frontmatter } = parseSkillFrontmatter(raw);
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const lineCount = body.split(/\r?\n/).length;
  if (!frontmatter.name) {
    issues.push({
      level: "error",
      path: path.join(relBase, "SKILL.md"),
      message: "Frontmatter must include 'name:'",
    });
  } else if (frontmatter.name !== dirName) {
    issues.push({
      level: "error",
      path: path.join(relBase, "SKILL.md"),
      message: `Frontmatter 'name' (${frontmatter.name}) must match directory (${dirName})`,
    });
  }
  if (!frontmatter.description) {
    issues.push({
      level: "error",
      path: path.join(relBase, "SKILL.md"),
      message: "Frontmatter must include 'description:'",
    });
  }
  if (lineCount > MAX_BODY_LINES_RECOMMENDED) {
    issues.push({
      level: "warning",
      path: path.join(relBase, "SKILL.md"),
      message: `Body is ${lineCount} lines; creating-skills recommends under ${MAX_BODY_LINES_RECOMMENDED} (progressive disclosure)`,
    });
  }
  return issues;
}

/**
 * Full validation of all `eversis-*` skill packages under `.cursor/skills/`.
 * When `treatWarningsAsErrors` is true, warnings fail the run (e.g. CI strict mode).
 */
export function validateAllSkills(
  startDir: string,
  options?: { treatWarningsAsErrors?: boolean }
): ValidateResult {
  const treatWarningsAsErrors = options?.treatWarningsAsErrors ?? false;
  const repoRoot = findRepoRoot(startDir);
  const skillsDir = path.join(repoRoot, ".cursor", "skills");
  const dirs = listSkillDirs(skillsDir);
  const issues: ValidationIssue[] = [];
  for (const dir of dirs) {
    issues.push(...validateOneSkill(skillsDir, dir));
  }
  const hasError = issues.some((i) => i.level === "error");
  const hasWarn = issues.some((i) => i.level === "warning");
  const ok = !hasError && !(treatWarningsAsErrors && hasWarn);
  return { ok, issues, skillCount: dirs.length };
}
