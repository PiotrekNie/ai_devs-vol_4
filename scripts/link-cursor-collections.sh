#!/usr/bin/env bash
# Symlink cursor-collections framework files from the git submodule into .cursor/
# Run from repo root after: git submodule update --init --recursive
#
# Symlink targets use paths relative to .cursor/ so they resolve to repo-root third-party/github-collections.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUB="${ROOT}/third-party/github-collections"

if [[ ! -d "${SUB}/.cursor" ]]; then
  echo "error: submodule missing or not initialized: ${SUB}" >&2
  echo "  git submodule update --init --recursive" >&2
  exit 1
fi

mkdir -p "${ROOT}/.cursor/rules"

link_dir() {
  local name="$1"
  local target="../third-party/github-collections/.cursor/${name}"
  local linkpath="${ROOT}/.cursor/${name}"
  if [[ -e "${linkpath}" && ! -L "${linkpath}" ]]; then
    echo "error: ${linkpath} exists and is not a symlink; remove or move it first" >&2
    exit 1
  fi
  ln -sfn "${target}" "${linkpath}"
  echo "linked .cursor/${name} -> ${target}"
}

link_dir "prompts"
link_dir "skills"
link_dir "commands"

while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  if [[ "${base}" == "eversis-project-stack.mdc" ]]; then
    continue
  fi
  linkpath="${ROOT}/.cursor/rules/${base}"
  if [[ -e "${linkpath}" && ! -L "${linkpath}" ]]; then
    echo "error: ${linkpath} exists and is not a symlink" >&2
    exit 1
  fi
  ln -sfn "../../third-party/github-collections/.cursor/rules/${base}" "${linkpath}"
  echo "linked .cursor/rules/${base}"
done < <(find "${SUB}/.cursor/rules" -maxdepth 1 -name '*.mdc' -print0)

echo "done."
