#!/usr/bin/env bash
# Run a command with Node/npx/bunx available to Cursor MCP spawns.
#
# Cursor (and other macOS GUI apps) use a minimal PATH that omits nvm, fnm,
# Homebrew, etc. This script discovers a Node toolchain and prepends it to PATH
# before exec'ing the requested command.
#
# Override discovery order with MCP_NODE_BIN_DIR (absolute path to a bin dir
# containing `node`, e.g. ~/.nvm/versions/node/v22.13.0/bin).
#
# Usage (from .cursor/mcp.json):
#   "command": "/bin/bash",
#   "args": ["scripts/mcp-run.sh", "npx", "-y", "@upstash/context7-mcp@latest"]

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "mcp-run.sh: missing command" >&2
  echo "usage: scripts/mcp-run.sh <command> [args...]" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

node_bin_dir_from_file_version() {
  local version_file="$1"
  local version candidate

  [[ -f "${version_file}" ]] || return 1
  version="$(tr -d 'v[:space:]' < "${version_file}")"
  [[ -n "${version}" ]] || return 1

  candidate="${HOME}/.nvm/versions/node/v${version}/bin"
  if [[ -x "${candidate}/node" ]]; then
    echo "${candidate}"
    return 0
  fi

  return 1
}

find_node_bin_dir() {
  local candidate ver latest

  if [[ -n "${MCP_NODE_BIN_DIR:-}" ]]; then
    candidate="${MCP_NODE_BIN_DIR%/}"
    if [[ -x "${candidate}/node" ]]; then
      echo "${candidate}"
      return 0
    fi
    echo "mcp-run.sh: MCP_NODE_BIN_DIR is set but ${candidate}/node is missing" >&2
    return 1
  fi

  candidate="$(node_bin_dir_from_file_version "${repo_root}/.nvmrc" || true)"
  if [[ -n "${candidate}" ]]; then
    echo "${candidate}"
    return 0
  fi

  candidate="$(node_bin_dir_from_file_version "${repo_root}/.node-version" || true)"
  if [[ -n "${candidate}" ]]; then
    echo "${candidate}"
    return 0
  fi

  if [[ -f "${HOME}/.nvm/alias/default" ]]; then
    ver="$(tr -d '[:space:]' < "${HOME}/.nvm/alias/default")"
    candidate="${HOME}/.nvm/versions/node/v${ver}/bin"
    if [[ -x "${candidate}/node" ]]; then
      echo "${candidate}"
      return 0
    fi
  fi

  if [[ -n "${VOLTA_HOME:-}" && -x "${VOLTA_HOME}/bin/node" ]]; then
    echo "${VOLTA_HOME}/bin"
    return 0
  fi
  if [[ -x "${HOME}/.volta/bin/node" ]]; then
    echo "${HOME}/.volta/bin"
    return 0
  fi

  for candidate in /opt/homebrew/bin /usr/local/bin; do
    if [[ -x "${candidate}/node" ]]; then
      echo "${candidate}"
      return 0
    fi
  done

  if [[ -d "${HOME}/.nvm/versions/node" ]]; then
    latest="$(ls -1 "${HOME}/.nvm/versions/node" 2>/dev/null | sort -V | tail -1 || true)"
    if [[ -n "${latest}" ]]; then
      candidate="${HOME}/.nvm/versions/node/${latest}/bin"
      if [[ -x "${candidate}/node" ]]; then
        echo "${candidate}"
        return 0
      fi
    fi
  fi

  return 1
}

node_bin_dir="$(find_node_bin_dir || true)"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if [[ -n "${node_bin_dir}" ]]; then
  export PATH="${node_bin_dir}:${PATH}"
fi

cmd="$1"
shift

if [[ "${cmd}" == "npx" && -x /opt/homebrew/bin/bunx ]]; then
  exec /opt/homebrew/bin/bunx "$@"
fi

if [[ "${cmd}" == "npx" && -x /usr/local/bin/bunx ]]; then
  exec /usr/local/bin/bunx "$@"
fi

if ! command -v "${cmd}" >/dev/null 2>&1; then
  echo "mcp-run.sh: command not found: ${cmd}" >&2
  echo "mcp-run.sh: set MCP_NODE_BIN_DIR to a directory containing node/npx, or install Node (nvm/Homebrew)." >&2
  exit 127
fi

exec "${cmd}" "$@"
