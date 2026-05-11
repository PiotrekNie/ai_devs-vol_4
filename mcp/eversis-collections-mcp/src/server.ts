import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { listAllowedScripts, runAllowlistedScript } from "./repoScripts.js";
import { listAllowedSkillScripts, runAllowlistedSkillScript, skillScriptKeysForZod } from "./skillScripts.js";
import { getSkillFile, listSkills } from "./skills.js";
import { validateAllSkills } from "./validate.js";

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function createPackageDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export async function runMcpServer(): Promise<void> {
  const startDir = createPackageDir();
  const server = new McpServer({
    name: "eversis-collections",
    version: "1.0.0",
  });

  server.registerTool(
    "eversis_skills_list",
    {
      description:
        "List all eversis-* skill packages under .cursor/skills/ with name and description from SKILL.md frontmatter.",
    },
    async () => {
      const skills = listSkills(startDir);
      return textResult(JSON.stringify({ skills }, null, 2));
    }
  );

  server.registerTool(
    "eversis_skills_get",
    {
      description:
        "Read SKILL.md or another file under an eversis-* skill directory (references/, assets/). Optional 1-based line range.",
      inputSchema: {
        skillId: z.string().describe("Skill folder name, e.g. eversis-creating-skills"),
        relativePath: z
          .string()
          .optional()
          .describe('File relative to the skill folder. Default: "SKILL.md"'),
        startLine: z.number().int().positive().optional(),
        endLine: z.number().int().positive().optional(),
      },
    },
    async ({ skillId, relativePath, startLine, endLine }) => {
      try {
        const { content, path: p } = getSkillFile(startDir, skillId, relativePath ?? "SKILL.md", {
          startLine,
          endLine,
        });
        return textResult(JSON.stringify({ path: p, content }, null, 2));
      } catch (e) {
        return textResult(
          JSON.stringify({ error: e instanceof Error ? e.message : String(e) }, null, 2)
        );
      }
    }
  );

  server.registerTool(
    "eversis_skills_validate",
    {
      description:
        "Validate all eversis-* skills (frontmatter, directory name match, SKILL.md present). Returns errors and warnings JSON.",
      inputSchema: {
        treatWarningsAsErrors: z
          .boolean()
          .optional()
          .describe("If true, warnings fail validation (use in CI)."),
      },
    },
    async ({ treatWarningsAsErrors }) => {
      const result = validateAllSkills(startDir, {
        treatWarningsAsErrors: treatWarningsAsErrors ?? false,
      });
      return textResult(JSON.stringify(result, null, 2));
    }
  );

  server.registerTool(
    "eversis_repo_run_script",
    {
      description:
        "Run an allowlisted maintenance script at the repository root (sync-prompts, sync-framework-doc).",
      inputSchema: {
        script: z
          .enum(["sync-prompts", "sync-framework-doc"] as [string, ...string[]])
          .describe(`One of: ${listAllowedScripts().join(", ")}`),
      },
    },
    async ({ script }) => {
      const r = await runAllowlistedScript(startDir, script);
      return textResult(
        JSON.stringify(
          {
            exitCode: r.exitCode,
            stdout: r.stdout,
            stderr: r.stderr,
          },
          null,
          2
        )
      );
    }
  );

  server.registerTool(
    "eversis_skill_run_script",
    {
      description:
        "Run an allowlisted script under .cursor/skills/<eversis-*>/scripts/ (e.g. deterministic stats for a skill). Keys are defined in the MCP package allowlist, not auto-discovered from disk.",
      inputSchema: {
        script: z
          .enum(skillScriptKeysForZod())
          .describe(`One of: ${listAllowedSkillScripts().join(", ")}`),
      },
    },
    async ({ script }) => {
      const r = await runAllowlistedSkillScript(startDir, script);
      return textResult(
        JSON.stringify(
          {
            exitCode: r.exitCode,
            stdout: r.stdout,
            stderr: r.stderr,
          },
          null,
          2
        )
      );
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
