# Research — Minimum Node.js version for Cursor Collections MCP servers

**Date:** 2026-06-13  
**Status:** Draft — awaiting human approval before plan  
**Trigger:** Question via `@eversis-implement`: *What is the lowest version of Node to run MCPs from the Cursor Collection?*

---

## Problem statement

Determine the **minimum supported Node.js version** for running MCP servers shipped or configured by the **Cursor Collections (Eversis)** framework in this repository.

Scope clarification matters: the framework includes **one local Node MCP** (`eversis-collections`) plus **several third-party stdio MCPs** launched via `npx` in [`.cursor/mcp.json`](../../third-party/github-collections/.cursor/mcp.json).

---

## Findings

### 1. Local server: `eversis-collections` (framework-owned)

| Source | Requirement |
|--------|-------------|
| [`mcp/eversis-collections-mcp/package.json`](../../third-party/github-collections/mcp/eversis-collections-mcp/package.json) `engines.node` | **`>=18`** |
| Dependency `@modelcontextprotocol/sdk` `engines.node` (installed) | **`>=18`** |
| Runtime invocation in `.cursor/mcp.json` | `node mcp/eversis-collections-mcp/dist/index.js` |
| Build step | `cd mcp/eversis-collections-mcp && npm ci && npm run build` |

**Conclusion:** The Cursor Collections **local** MCP server requires **Node.js 18 or newer**.

Supporting evidence:

- Package is ESM (`"type": "module"`) — supported on Node 18+.
- Dev/test script uses `node --import tsx` (Node 18+ loader API); **not** required at MCP runtime.
- No documented requirement above 18 for running `dist/index.js`.

### 2. Full `.cursor/mcp.json` template (all stdio Node-based servers)

Servers in the upstream template and their declared `engines` (queried via `npm view`, 2026-06-13):

| MCP server | Launch | Declared `engines.node` |
|------------|--------|-------------------------|
| **eversis-collections** | `node …/dist/index.js` | `>=18` |
| **playwright** | `npx @playwright/mcp@latest` | `>=18` |
| **context7** | `npx @upstash/context7-mcp@latest` | *(none published)* |
| **sequential-thinking** | `npx @modelcontextprotocol/server-sequential-thinking` | *(none published)* |
| **pdf-reader** | `npx @sylphx/pdf-reader-mcp` | **`>=22.13.0`** |
| **gcp-gcloud** | `npx @google-cloud/gcloud-mcp` | *(none published)* |
| **gcp-observability** | `npx @google-cloud/observability-mcp` | *(none published)* |
| **gcp-storage** | `npx @google-cloud/storage-mcp` | *(none published)* |

Servers **not** requiring Node:

| MCP server | Type | Runtime |
|------------|------|---------|
| **figma** | HTTP | Remote endpoint |
| **atlassian** | HTTP | Remote endpoint |
| **awslabs.aws-api-mcp-server** | stdio | `uvx` (Python) |
| **awslabs.aws-documentation-mcp-server** | stdio | `uvx` (Python) |

**Conclusion for the full template:** If you enable **every** stdio server that runs on Node, the **binding minimum is Node.js 22.13.0**, driven by **`pdf-reader`**. Without `pdf-reader`, the documented floor among packages that declare `engines` is **Node.js 18**.

### 3. Documentation gap

- [`website/docs/getting-started/prerequisites.md`](../../third-party/github-collections/website/docs/getting-started/prerequisites.md) — mentions MCP but **does not** state a Node version.
- [`website/docs/getting-started/mcp-setup.md`](../../third-party/github-collections/website/docs/getting-started/mcp-setup.md) — build instructions for `eversis-collections` use `npm install` / `npm run build` but **no** Node version floor.
- [`documentation/cursor-collection.md`](../../third-party/github-collections/documentation/cursor-collection.md) — CI example uses `node:20-alpine` (recommendation, not a hard minimum).

### 4. Related constraint (PATH, not version)

Existing research [`docs/specs/mcp-npx-path/mcp-npx-path.research.md`](../mcp-npx-path/mcp-npx-path.research.md) documents that on macOS, Cursor may fail to spawn `npx` / `node` with `ENOENT` if GUI `PATH` omits Homebrew/nvm bins. That is orthogonal to version but affects whether MCPs start at all.

### 5. This consumer repo (`ai_devs-vol_4`)

- Runtime for tasks: **Bun** (`eversis-project-stack.mdc`).
- MCP still uses **`node`** for `eversis-collections` per [`.cursor/mcp.json`](../../.cursor/mcp.json).
- Bun does **not** replace Node for MCP unless config is changed.

---

## Answer summary

| Scope | Minimum Node.js |
|-------|-----------------|
| **`eversis-collections` only** (skills + `.docx` tools) | **18** |
| **All Node stdio MCPs in upstream `.cursor/mcp.json`** (incl. `pdf-reader`) | **22.13.0** |
| **HTTP MCPs** (Figma, Atlassian) | **None** (no local Node) |
| **AWS MCPs** (`uvx`) | **Python/uv**, not Node |

**Practical recommendation:** Use **Node 20 LTS** or **Node 22** for day-to-day work — aligns with CI examples and satisfies `pdf-reader` when enabled. **Node 18** is sufficient if you only build/run `eversis-collections` and omit `pdf-reader`.

---

## Assumptions

- “MCPs from the Cursor Collection” refers to servers defined in the framework’s `.cursor/mcp.json`, not arbitrary MCP servers the user may add.
- Versions checked against **latest** npm publishes at research time; upstream pins may drift.
- User runs MCP via Cursor’s stdio spawn (`node` / `npx`), not via Bun unless locally reconfigured.

---

## Open questions

1. Should upstream docs (`prerequisites.md` / `mcp-setup.md`) explicitly document **Node >= 18** for `eversis-collections` and **Node >= 22.13** when `pdf-reader` is enabled?
2. Is the user asking only about `eversis-collections`, or the full integration set?

---

## Suggested next steps (if approved)

- **No code change required** if the question is informational only.
- Optional doc PR to upstream `cursor-collections`: add Node version prerequisites to `mcp-setup.md`.
- Optional local note in `AGENTS.md` cross-linking this research and `mcp-npx-path` PATH guidance.

---

**Next step:** Human approval — confirm scope (local MCP only vs full template) before any documentation plan.

---

## Addendum (2026-06-13) — User report: context7, pdf-reader, Playwright fail on Node v20.19.2

### Verified runtime (terminal, `PATH` includes `~/.nvm/versions/node/v20.19.2/bin`)

| MCP | Node 20.19.2 | Notes |
|-----|--------------|-------|
| **context7** | **Starts OK** | `npx -y @upstash/context7-mcp@latest` → `Context7 Documentation MCP Server v3.2.0 running on stdio` |
| **playwright** | **Starts OK** | `engines.node: >=18`; stdio server runs silently (expected) |
| **pdf-reader** | **Starts OK** (runtime) | Declares `engines.node: >=22.13.0` on npm, but process still runs on 20.19.2 in probe; treat **22.13+** as the supported floor |

### Actual failure mode in Cursor (not version)

Cursor GUI spawns MCP with a **minimal `PATH`** (`/usr/bin:/bin:…`) that **does not** include nvm/Homebrew bins. Reproduced locally:

```text
PATH=/usr/bin:/bin:/usr/sbin:/sbin → command -v npx → NOT FOUND
```

This produces `spawn npx ENOENT` (documented in [`mcp-npx-path.research.md`](../mcp-npx-path/mcp-npx-path.research.md)). It affects **all** `npx`-launched MCPs equally and is **orthogonal to Node 20.19.2** — the same failure happens regardless of which Node version nvm has active in the shell.

With `PATH="$HOME/.nvm/versions/node/v20.19.2/bin:…"`, `npx` and `node` resolve and all three MCPs start.

### Corrected guidance

| MCP | Minimum Node (declared) | Works on 20.19.2? | Cursor fix |
|-----|-------------------------|-------------------|------------|
| context7 | *(none)*; dep `commander@14` needs `>=20` | **Yes** (with PATH) | Add `env.PATH` with nvm bin dir, or absolute `npx` path |
| playwright | `>=18` | **Yes** (with PATH) | Same |
| pdf-reader | `>=22.13.0` | **Unsupported** on 20.x per publisher; use **22.13+** for compliance | Same PATH fix **plus** Node 22.13+ |

**Conclusion:** Node **v20.19.2 is not the blocker** for context7 and Playwright. The blocker is **Cursor not finding `npx`/`node`**. Only **pdf-reader** has a genuine version floor above Node 20 (22.13.0).
