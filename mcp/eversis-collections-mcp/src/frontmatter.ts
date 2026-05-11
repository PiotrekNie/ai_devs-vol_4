export type SkillFrontmatter = {
  name?: string;
  description?: string;
  "user-invokable"?: boolean | string;
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Minimal YAML-ish parse for skill frontmatter (key: value or key: "quoted"). */
export function parseSkillFrontmatter(raw: string): {
  frontmatter: SkillFrontmatter;
  bodyStartLine: number;
} {
  const m = raw.match(FRONTMATTER_RE);
  if (!m) {
    return { frontmatter: {}, bodyStartLine: 1 };
  }
  const block = m[1] ?? "";
  const fm: SkillFrontmatter = {};
  for (const line of block.split(/\r?\n/)) {
    const kv = line.match(/^(\s*)([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[2];
    let val = kv[3].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key === "name") fm.name = val;
    else if (key === "description") fm.description = val;
    else if (key === "user-invokable") {
      if (val === "true" || val === "True") fm["user-invokable"] = true;
      else if (val === "false" || val === "False") fm["user-invokable"] = false;
      else fm["user-invokable"] = val;
    }
  }
  const linesBefore = raw.slice(0, m.index! + m[0].length).split(/\r?\n/);
  const bodyStartLine = linesBefore.length + 1;
  return { frontmatter: fm, bodyStartLine };
}
