import fs from "node:fs";
import path from "node:path";
import { parseSkillFrontmatter } from "./frontmatter.js";
import { assertUnderRoot, findRepoRoot } from "./resolveRoot.js";

const SKILL_ID_PREFIX = "eversis-";

export type SkillSummary = {
  id: string;
  name: string;
  description: string;
  userInvokable?: boolean;
};

function listSkillDirNames(skillsDir: string): string[] {
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

export function listSkills(startDir: string): SkillSummary[] {
  const repoRoot = findRepoRoot(startDir);
  const skillsDir = path.join(repoRoot, ".cursor", "skills");
  const out: SkillSummary[] = [];
  for (const id of listSkillDirNames(skillsDir)) {
    const skillMd = path.join(skillsDir, id, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      out.push({
        id,
        name: id,
        description: "(missing SKILL.md)",
      });
      continue;
    }
    const raw = fs.readFileSync(skillMd, "utf8");
    const { frontmatter } = parseSkillFrontmatter(raw);
    const userInvokable =
      typeof frontmatter["user-invokable"] === "boolean"
        ? frontmatter["user-invokable"]
        : frontmatter["user-invokable"] === "true";
    out.push({
      id,
      name: frontmatter.name ?? id,
      description: frontmatter.description ?? "",
      userInvokable,
    });
  }
  return out;
}

export function getSkillFile(
  startDir: string,
  skillId: string,
  relativeFile: string,
  lineRange?: { startLine?: number; endLine?: number }
): { content: string; path: string } {
  if (!skillId.startsWith(SKILL_ID_PREFIX) || skillId.includes("..")) {
    throw new Error("Invalid skill id");
  }
  const repoRoot = findRepoRoot(startDir);
  const safeRel = relativeFile.replace(/^\//, "");
  if (safeRel.includes("..")) {
    throw new Error("Invalid relative path");
  }
  const full = path.join(repoRoot, ".cursor", "skills", skillId, safeRel);
  assertUnderRoot(repoRoot, full);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    throw new Error(`File not found: ${safeRel}`);
  }
  let content = fs.readFileSync(full, "utf8");
  const lines = content.split(/\r?\n/);
  const start = Math.max(1, lineRange?.startLine ?? 1);
  const end = lineRange?.endLine ?? lines.length;
  if (start > 1 || end < lines.length) {
    const slice = lines.slice(start - 1, end);
    content = slice.join("\n");
  }
  return {
    content,
    path: path.join(".cursor", "skills", skillId, safeRel),
  };
}
