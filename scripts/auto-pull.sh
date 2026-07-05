#!/bin/zsh
# Auto-pull for Echo Chamber Media.
# Fetches origin/main and fast-forwards the local clone. The running dev server
# (npm run dev) hot-reloads when files change, so the live site updates on its own.
# Fast-forward only: it will never overwrite local changes. If it cannot ff, it
# logs and skips that cycle instead of forcing anything.

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" || exit 1

BEFORE="$(git rev-parse --short HEAD 2>/dev/null)"
git fetch origin main --quiet 2>/dev/null

if git merge --ff-only origin/main --quiet 2>/dev/null; then
  AFTER="$(git rev-parse --short HEAD 2>/dev/null)"
  if [ "$BEFORE" != "$AFTER" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S')  updated $BEFORE -> $AFTER"
  fi
else
  echo "$(date '+%Y-%m-%d %H:%M:%S')  skipped: could not fast-forward (local changes or diverged history)"
fi
