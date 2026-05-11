# eversis-collections-mcp

Local **Model Context Protocol** server for the [cursor-collections](https://github.com/PiotrNie-Eversis/cursor-collections) repository. It exposes **`eversis_*` tools** to list, read, and validate the `eversis-*` skill packages under `.cursor/skills/`, to run a small set of allowlisted root scripts (e.g. `scripts/sync-prompts.mjs`), and to run **allowlisted per-skill scripts** under `.cursor/skills/eversis-*/scripts/` (see `eversis_skill_run_script`) — not auto-discovered; each entry is code-reviewed in the MCP package.

## Not published to npm

This package is **not** published to the registry. Use it from a **clone of the repository**:

```bash
cd mcp/eversis-collections-mcp
npm install
npm run build
```

Then enable the **`eversis-collections`** entry in the repo’s `.cursor/mcp.json` (already present) and restart Cursor.

## CLI: validate skills (CI)

```bash
npm run validate
# or
node dist/cli.js validate
```

- **`--strict`** — treat length warnings as failures (same as `EVERSIS_SKILLS_VALIDATE_STRICT=1`).

## Tools (MCP)

| Tool | Purpose |
| --- | --- |
| `eversis_skills_list` | List all `eversis-*` skills with `name` / `description` from `SKILL.md` frontmatter |
| `eversis_skills_get` | Read `SKILL.md` or a file under `references/` or `assets/` (optional line range) |
| `eversis_skills_validate` | Validate every skill (frontmatter, name vs directory, optional length warnings) |
| `eversis_repo_run_script` | Run `sync-prompts` or `sync-framework-doc` under the repo root |
| `eversis_skill_run_script` | Run an allowlisted script under `.cursor/skills/eversis-*/scripts/` (e.g. `eversis-creating-skills-skill-md-stats`) |

**Security:** `eversis_skill_run_script` and `eversis_repo_run_script` only run paths on a fixed allowlist in this package. New scripts require a PR that adds the file and the key in `src/skillScripts.ts` or `src/repoScripts.ts`. Tools that call external APIs (e.g. cloud cost APIs) are not bundled here by default; add them only with explicit env/credential requirements and review.

## Environment

- **`EVERSIS_COLLECTIONS_ROOT`** — absolute path to a checkout that contains `.cursor/skills` (optional; auto-detected by walking up from this package).
