#!/usr/bin/env bash
# Shared helpers for the benchmark scripts. Sourced, not executed.
set -euo pipefail

# Repo root = parent of the scripts/ dir, regardless of where we're called from.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export REPO_ROOT

# --- gum: pretty interactive prompts, with plain-shell fallbacks ----------------
HAS_GUM=0
if command -v gum >/dev/null 2>&1; then HAS_GUM=1; fi

say() { # say <text...>  — a styled heading
  if [ "$HAS_GUM" -eq 1 ]; then
    gum style --foreground 212 --bold "$*"
  else
    printf '\n=== %s ===\n' "$*"
  fi
}

info() { printf '  %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }
die()  { printf '  ✗ %s\n' "$*" >&2; exit 1; }

ask() { # ask <prompt> [default]  -> echoes the answer
  local prompt="$1" default="${2:-}"
  if [ "$HAS_GUM" -eq 1 ]; then
    gum input --prompt "$prompt: " --placeholder "$default" --value "$default"
  else
    local ans
    read -r -p "$prompt [${default}]: " ans
    printf '%s' "${ans:-$default}"
  fi
}

choose() { # choose <prompt> <opt1> <opt2> ...  -> echoes the chosen option
  local prompt="$1"; shift
  if [ "$HAS_GUM" -eq 1 ]; then
    gum choose --header "$prompt" "$@"
  else
    local PS3="$prompt "
    local opt
    select opt in "$@"; do
      [ -n "$opt" ] && { printf '%s' "$opt"; return; }
    done
  fi
}

confirm() { # confirm <prompt>  -> exit 0 if yes
  if [ "$HAS_GUM" -eq 1 ]; then
    gum confirm "$1"
  else
    local ans; read -r -p "$1 [y/N]: " ans
    [[ "$ans" =~ ^[Yy]$ ]]
  fi
}

# Lowercase + replace anything non-alphanumeric with a single dash; trim dashes.
slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}
