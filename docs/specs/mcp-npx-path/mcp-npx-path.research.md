# Research — MCP `spawn npx ENOENT` (context7 and other stdio servers)

**Date:** 2026-05-30  
**Status:** Draft — awaiting human approval before plan  
**Trigger:** Cursor MCP log for `context7`:

```text
Connection failed: spawn npx ENOENT
[V2 FSM] connection:connect_failure: conn=connecting,auth=unknown -> conn=failed,auth=unknown
CreateClient completed, connected: false, statusType: error
```

---

## Problem statement

The **context7** MCP server (and potentially other stdio servers) fails to start in Cursor because the IDE cannot resolve the `npx` executable.

## Root cause

On **macOS**, GUI apps (including Cursor) spawn child processes with a **minimal `PATH`**, typically:

`/usr/bin:/bin:/usr/sbin:/sbin`

They do **not** inherit shell profile paths from `.zshrc`, `.bashrc`, **nvm**, or **Homebrew** unless explicitly configured.

| Environment | `npx` available? | Location |
|-------------|------------------|----------|
| User's zsh terminal | Yes | `~/.nvm/versions/node/v20.19.2/bin/npx` |
| Homebrew symlink | Yes | `/opt/homebrew/bin/npx` |
| Cursor MCP spawn | **No** | `spawn npx ENOENT` |

`ENOENT` = executable not found on `PATH` at spawn time — not a network or auth failure.

## Current configuration

[`.cursor/mcp.json`](../../.cursor/mcp.json) defines **seven** stdio servers using bare `npx`:

| Server | Package |
|--------|---------|
| `gcp-gcloud` | `@google-cloud/gcloud-mcp` |
| `gcp-observability` | `@google-cloud/observability-mcp` |
| `gcp-storage` | `@google-cloud/storage-mcp` |
| `playwright` | `@playwright/mcp@latest` |
| **`context7`** | `@upstash/context7-mcp@latest` |
| `sequential-thinking` | `@modelcontextprotocol/server-sequential-thinking` |
| `pdf-reader` | `@sylphx/pdf-reader-mcp` |

The local **`eversis-collections`** entry uses `node` with a repo-relative path — separate concern; may also fail if `node` is absent from GUI `PATH`.

Upstream template lives in [`third-party/github-collections/.cursor/mcp.json`](../../third-party/github-collections/.cursor/mcp.json); this repo already customizes the `eversis-collections` args path.

## Project conventions

- Runtime package manager: **Bun** (`eversis-project-stack.mdc`, `use-bun-instead-of-node-vite-npm-pnpm.mdc`).
- `bunx` successfully runs context7 from terminal: `/opt/homebrew/bin/bunx -y @upstash/context7-mcp@latest --help` → OK.
- No existing `env.PATH` workaround in repo MCP config.

## Solution options

### A — `bunx` + explicit `env.PATH` (recommended)

Replace `command: "npx"` with `command: "bunx"` and add:

```json
"env": {
  "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
}
```

**Pros:** Aligns with Bun-first stack; fixes macOS GUI PATH for Homebrew Bun users; no machine-specific absolute paths in JSON.  
**Cons:** Users who only have Node via nvm (no Homebrew Bun) must extend `PATH` locally or install Bun.

### B — Absolute path to `bunx` or `npx`

e.g. `"command": "/opt/homebrew/bin/bunx"`

**Pros:** Works immediately on this machine.  
**Cons:** Not portable (Linux paths, Intel Mac `/usr/local`, Windows, CI).

### C — Wrapper script in `scripts/`

e.g. `scripts/mcp-bunx.sh` that exports PATH then execs bunx.

**Pros:** Centralized PATH logic; can detect OS.  
**Cons:** Extra file; Cursor still needs to find `bash`; overkill for config-only fix.

### D — Documentation only

Add troubleshooting to `AGENTS.md`; user patches local `mcp.json`.

**Pros:** Zero risk to shared config.  
**Cons:** Every developer hits the same failure; poor DX.

## Recommendation

**Option A** for all seven `npx` stdio servers in **this repo's** `.cursor/mcp.json`, plus a short **MCP troubleshooting** subsection in [`AGENTS.md`](../../AGENTS.md) (nvm-only users: add their Node bin dir to `env.PATH`).

Do **not** change upstream submodule `mcp.json` in this task unless explicitly requested — that is a separate contribution to `github-collections`.

## Acceptance criteria (for plan)

1. After Cursor MCP restart, **context7** connects without `spawn npx ENOENT`.
2. Other stdio `npx` servers use the same pattern (consistent fix).
3. `eversis-collections` entry unchanged.
4. HTTP servers (`figma`, `atlassian`) unchanged.
5. `AGENTS.md` documents the macOS PATH limitation and nvm workaround.

## Risks

| Risk | Mitigation |
|------|------------|
| Linux/Windows devs without `/opt/homebrew/bin` | PATH list includes `/usr/local/bin`; doc nvm/Node path override |
| Bun not installed | Document `brew install bun` or PATH to nvm `npx` |
| Upstream sync overwrites `mcp.json` | `sync-cursor-collections-from-upstream.sh` copies upstream — note in changelog that local MCP deltas may need re-application |

## Out of scope

- Fixing `node` PATH for `eversis-collections` (separate if reported).
- Patching upstream `third-party/github-collections/.cursor/mcp.json`.
- Installing Bun or Node for the user.

---

**Next step:** Human approval → implementation plan → implement `.cursor/mcp.json` + `AGENTS.md` docs.
