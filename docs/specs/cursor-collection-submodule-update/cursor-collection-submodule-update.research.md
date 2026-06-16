# Research — Should we update the cursor-collections submodule?

**Date:** 2026-06-13  
**Status:** Draft — awaiting human approval before plan  
**Trigger:** `/eversis-implement` — *Should I update the cursor-collection package?*

---

## Problem statement

Decide whether to bump **`third-party/github-collections`** (git submodule → [PiotrNie-Eversis/cursor-collections](https://github.com/PiotrNie-Eversis/cursor-collections)) in this consumer repo, given recent local MCP work (`scripts/mcp-run.sh`, `.cursor/mcp.json` PATH fix) and an unpushed submodule dirty state.

---

## Current state

| Item | Value |
|------|--------|
| Pinned submodule commit | `c12ce0f` — *chore: update changelog and readme* |
| `origin/main` (fetched) | `ff741f9` — **11 commits ahead** |
| Local commits on submodule | **0** (not forked; just pinned old) |
| Submodule dirty file | `mcp/eversis-collections-mcp/yarn.lock` (modified, uncommitted) |
| Consumer sync tool | [`scripts/sync-cursor-collections.mjs`](../../scripts/sync-cursor-collections.mjs) (`git submodule update --remote` + relink) |
| Symlinked from submodule | `.cursor/prompts`, `.cursor/skills`, `.cursor/commands`, most `eversis-*.mdc` rules |
| **Not** symlinked (consumer-local) | [`.cursor/mcp.json`](../../.cursor/mcp.json), [`.cursor/rules/eversis-project-stack.mdc`](../../.cursor/rules/eversis-project-stack.mdc), [`scripts/mcp-run.sh`](../../scripts/mcp-run.sh) |

### Uncommitted consumer work (would block `--check-only`)

- `M` `.cursor/mcp.json` — `mcp-run.sh` wrapper
- `M` `AGENTS.md`, `scripts/README.md`
- `??` `scripts/mcp-run.sh`
- `??` `docs/specs/cursor-collection-mcp-node-version/`

---

## What upstream adds (11 commits, `c12ce0f..ff741f9`)

Highlights relevant to this repo:

| Commit / area | Benefit |
|---------------|---------|
| **`ff741f9`** — interactive MCP multi-select in `setup-cursor-local.sh` | Better onboarding when vendoring framework; optional for this repo (uses own sync script) |
| **`a155e30`** — `.docx` locale / table handling in `eversis-collections-mcp` | Richer BA docs MCP tools (Polish/French heading IDs, tables/images in sections) |
| **`fdedb1c`** — restore stack rule profile in upstream `eversis-project-stack.mdc` | **No direct impact** — consumer keeps its own AI-Devs stack rule file |
| **`2aa01b8` / `6915c25`** — setup-cursor-local enhancements | Useful if adopting upstream setup flow later |
| **`d853a03`** — GitHub Actions for cursor rules validation | Upstream CI only |
| Docs / website | README, installation, readability — no runtime impact on tasks |

**MCP server code** (`mcp/eversis-collections-mcp/`): meaningful `.docx` changes + test script tweak; **requires rebuild** after bump (`npm ci && npm run build`).

**What upstream does *not* include:**

- No `mcp-run.sh` or macOS GUI `PATH` fix ([`mcp-npx-path`](../mcp-npx-path/mcp-npx-path.research.md) still consumer-local).
- Upstream [`.cursor/mcp.json`](../../third-party/github-collections/.cursor/mcp.json) still uses bare `npx` / `node`.

---

## Risks of updating

| Risk | Severity | Mitigation |
|------|----------|------------|
| Submodule `yarn.lock` conflict | Low | `git checkout -- mcp/eversis-collections-mcp/yarn.lock` in submodule before sync, or commit intentional lock change |
| MCP binary stale after bump | Medium | Always run `--build-mcp` |
| Overwriting local `.cursor/mcp.json` | **High if manual merge** | **Do not** copy upstream `mcp.json` over consumer file; keep `mcp-run.sh` entries |
| Symlinked prompts/skills drift | Low | Expected; review changelog if prompts changed behavior |
| Working tree dirty blocks sync check | Low | Commit or stash consumer MCP fixes first |
| Regression in docx MCP tools | Low | Run `npm test` in MCP dir after build |

## Risks of *not* updating

| Risk | Severity |
|------|----------|
| Missing `.docx` locale/table fixes | Medium (if using BA docs workflow) |
| Missing setup/MCP UX improvements for future contributors | Low |
| Growing divergence (harder to bump later) | Medium over time |

---

## Recommendation

### **Yes — update the submodule**, with guardrails

You are **11 commits behind** your own `origin/main` fork with **no local submodule commits** to preserve. The bump is low-risk and brings useful **eversis-collections-mcp** fixes. Updating does **not** replace your local MCP PATH solution.

### Preconditions (do first)

1. **Commit or stash** consumer changes: `mcp-run.sh`, `.cursor/mcp.json`, `AGENTS.md`, `scripts/README.md`, research specs.
2. **Clean submodule dirty state:**
   ```sh
   cd third-party/github-collections
   git checkout -- mcp/eversis-collections-mcp/yarn.lock
   ```
3. Bump + relink + rebuild from repo root:
   ```sh
   node scripts/sync-cursor-collections.mjs --build-mcp
   ```
4. **Verify** MCP in Cursor (especially `eversis-collections` after rebuild).
5. **Commit** updated submodule pointer in parent repo:
   ```sh
   git add third-party/github-collections
   git commit -m "chore: bump cursor-collections submodule to ff741f9"
   ```

### Do **not** do on update

- Replace [`.cursor/mcp.json`](../../.cursor/mcp.json) with upstream template (would reintroduce `spawn npx ENOENT`).
- Symlink or overwrite [`.cursor/rules/eversis-project-stack.mdc`](../../.cursor/rules/eversis-project-stack.mdc) (AI-Devs-specific).

### Optional follow-up (separate task)

- **Contribute `mcp-run.sh` upstream** to `cursor-collections` (setup script + docs) so all consumers get the PATH fix — aligns with [`mcp-npx-path`](../mcp-npx-path/mcp-npx-path.research.md) Option C.
- Document in upstream `mcp-setup.md`: Node `>=18` for `eversis-collections`, `>=22.13` for `pdf-reader`.

---

## Decision matrix

| Situation | Update? |
|-----------|---------|
| You use BA `.docx` MCP tools or want latest skills/prompts | **Yes** |
| You only need stable task agents and MCP already works | **Optional** (defer) |
| You have uncommitted `mcp-run.sh` work you want to keep | **Yes, after commit** |
| You plan to copy upstream `mcp.json` verbatim | **No** (until PATH fix lands upstream) |

---

## Acceptance checks (after bump)

- [ ] `third-party/github-collections` HEAD = `ff741f9` (or newer `origin/main`)
- [ ] `third-party/github-collections/mcp/eversis-collections-mcp/dist/index.js` exists
- [ ] `.cursor/mcp.json` still uses `scripts/mcp-run.sh` (unchanged)
- [ ] Cursor MCP: `eversis-collections`, `context7`, `playwright` connect
- [ ] `node scripts/sync-cursor-collections.mjs --check-only` passes on clean tree

---

## Open questions

1. Should `mcp-run.sh` be contributed to upstream in the same effort or as a follow-up PR?
2. Is the dirty `yarn.lock` in the submodule intentional (local npm vs yarn) or accidental?

---

**Next step:** Human approval → optional implementation plan for submodule bump + verification (no upstream publish — package is not on npm).
