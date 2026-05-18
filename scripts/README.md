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
