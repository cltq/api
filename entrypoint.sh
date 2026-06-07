#!/bin/sh
set -e

if git rev-parse --git-dir > /dev/null 2>&1; then
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  remote=$(git remote get-url origin 2>/dev/null || true)
  if [ -n "$remote" ]; then
    echo "Checking for updates from $remote ..."
    if git fetch origin "$branch" 2>/dev/null; then
      behind=$(git rev-list --count HEAD.."origin/$branch" 2>/dev/null || echo 0)
      if [ "$behind" -gt 0 ]; then
        echo "New commits found ($behind behind). Pulling..."
        git pull origin "$branch" && bun install --frozen-lockfile --production
      else
        echo "Already up to date."
      fi
    else
      echo "Warning: could not fetch updates (no network or auth issue). Continuing with current code."
    fi
  fi
fi

exec bun run src/server.ts
