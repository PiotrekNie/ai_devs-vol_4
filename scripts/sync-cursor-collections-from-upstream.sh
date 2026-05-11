#!/usr/bin/env bash
# sync-cursor-collections-from-upstream.sh
#
# Synchronises the vendored Cursor Collections (Eversis) framework layer
# from a local clone of PiotrNie-Eversis/cursor-collections into this repo.
#
# USAGE
#   ./scripts/sync-cursor-collections-from-upstream.sh
#
# UPSTREAM_ROOT (optional env var)
#   Path to the local cursor-collections clone.
#   Defaults to ../cursor-collections relative to this repo's root.
#   Override:  UPSTREAM_ROOT=/path/to/cursor-collections ./scripts/sync-…sh
#
# LOCALLY FORKED FILES — not overwritten by this script
#   These files are excluded from sync because they are customised for
#   this repository and must be maintained manually:
#     .cursor/rules/eversis-project-stack.mdc   — stack / quality commands
#     AGENTS.md                                  — repo-specific entry points
#     .cursorignore                              — repo-specific exclusions
#     documentation/cursor-collection.md        — kept in sync manually
#
#   After each sync, run:
#     git diff .cursor/rules/ .cursor/prompts/ .cursor/skills/
#   and review whether new upstream content should be merged into the
#   excluded files above.
#
# AFTER SYNC
#   Rebuild the local MCP server:
#     cd mcp/eversis-collections-mcp && npm install && npm run build

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPSTREAM_ROOT="${UPSTREAM_ROOT:-"$(cd "$REPO_ROOT/../cursor-collections" 2>/dev/null && pwd || echo "")"}"

if [ -z "$UPSTREAM_ROOT" ] || [ ! -d "$UPSTREAM_ROOT/.cursor/skills" ]; then
  echo "ERROR: Cannot find cursor-collections at '$UPSTREAM_ROOT'."
  echo "       Set UPSTREAM_ROOT to the path of your local clone:"
  echo "       UPSTREAM_ROOT=/path/to/cursor-collections $0"
  exit 1
fi

echo "Syncing from: $UPSTREAM_ROOT"
echo "Syncing into: $REPO_ROOT"
echo ""

RSYNC="rsync -av --delete"

# Shared exclusions applied to every rsync call
COMMON_EXCLUDES=(
  --exclude='node_modules/'
  --exclude='.git/'
  --exclude='dist/'
  --exclude='*.log'
)

# ── .cursor/rules ────────────────────────────────────────────────────────────
echo "=== .cursor/rules ==="
$RSYNC "${COMMON_EXCLUDES[@]}" \
  --exclude='eversis-project-stack.mdc' \
  "$UPSTREAM_ROOT/.cursor/rules/" \
  "$REPO_ROOT/.cursor/rules/"

# ── .cursor/prompts ──────────────────────────────────────────────────────────
echo "=== .cursor/prompts ==="
$RSYNC "${COMMON_EXCLUDES[@]}" \
  "$UPSTREAM_ROOT/.cursor/prompts/" \
  "$REPO_ROOT/.cursor/prompts/"

# ── .cursor/skills ───────────────────────────────────────────────────────────
echo "=== .cursor/skills ==="
$RSYNC "${COMMON_EXCLUDES[@]}" \
  "$UPSTREAM_ROOT/.cursor/skills/" \
  "$REPO_ROOT/.cursor/skills/"

# ── .cursor/mcp.json ─────────────────────────────────────────────────────────
echo "=== .cursor/mcp.json ==="
cp "$UPSTREAM_ROOT/.cursor/mcp.json" "$REPO_ROOT/.cursor/mcp.json"

# ── mcp/eversis-collections-mcp (source only) ────────────────────────────────
echo "=== mcp/eversis-collections-mcp ==="
mkdir -p "$REPO_ROOT/mcp/eversis-collections-mcp"
$RSYNC "${COMMON_EXCLUDES[@]}" \
  --exclude='tasks/**/.cursor/' \
  "$UPSTREAM_ROOT/mcp/eversis-collections-mcp/" \
  "$REPO_ROOT/mcp/eversis-collections-mcp/"

# ── documentation/cursor-collection.md ───────────────────────────────────────
echo "=== documentation/cursor-collection.md ==="
mkdir -p "$REPO_ROOT/documentation"
cp "$UPSTREAM_ROOT/documentation/cursor-collection.md" \
   "$REPO_ROOT/documentation/cursor-collection.md"

echo ""
echo "Sync complete."
echo ""
echo "Next steps:"
echo "  1. Review any upstream changes to excluded files:"
echo "       git diff .cursor/rules/eversis-project-stack.mdc AGENTS.md .cursorignore"
echo "  2. Rebuild the MCP server:"
echo "       cd mcp/eversis-collections-mcp && npm install && npm run build"
echo "  3. Stage and commit the updates:"
echo "       git add .cursor/ mcp/eversis-collections-mcp/src documentation/"
echo "       git commit -m 'chore: sync cursor-collections from upstream'"
