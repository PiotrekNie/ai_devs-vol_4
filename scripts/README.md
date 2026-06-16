# Cursor Collections maintenance scripts

Repo maintenance tooling for the **`third-party/github-collections`** submodule. Run from **`scripts/`** (or call `node` with paths from the repo root — see [AGENTS.md](../AGENTS.md)).

`package.json` here has **no runtime dependencies**; install is optional:

```bash
cd scripts
npm install
```

Common scripts:

```bash
npm run sync:collections   # bump submodule + refresh symlinks
npm run build:mcp         # install + build eversis-collections MCP in submodule
npm run start:mcp         # foreground stdio MCP server (debug)
```

## MCP PATH wrapper (`mcp-run.sh`)

Cursor on macOS spawns MCP with a **minimal `PATH`** (no nvm/Homebrew), so bare `npx` / `node` in `.cursor/mcp.json` often fails with `spawn npx ENOENT`.

**Fix:** stdio servers in [`.cursor/mcp.json`](../.cursor/mcp.json) use:

```json
"command": "/bin/bash",
"args": ["scripts/mcp-run.sh", "npx", "-y", "@some/mcp-package"]
```

`scripts/mcp-run.sh` discovers Node from (in order):

1. `MCP_NODE_BIN_DIR` env override (per-server in `mcp.json`)
2. repo `.nvmrc` / `.node-version`
3. nvm default alias
4. Volta
5. Homebrew (`/opt/homebrew/bin`, `/usr/local/bin`)
6. latest nvm-installed version

Then prepends that bin dir to `PATH` and `exec`s the command. If the command is `npx` and Homebrew `bunx` exists, it prefers `bunx` (Bun-first stack).

**pdf-reader** declares Node `>=22.13.0`. If your default Node is older, set on that server only:

```json
"env": { "MCP_NODE_BIN_DIR": "/Users/you/.nvm/versions/node/v22.13.0/bin" }
```

Restart MCP in Cursor after changing `mcp.json` (Settings → MCP → refresh, or restart Cursor).
