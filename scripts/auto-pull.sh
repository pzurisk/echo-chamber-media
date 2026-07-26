#!/bin/zsh
# Auto-pull for Echo Chamber Media.
# Fetches origin/main and fast-forwards the local clone. The running dev server
# (npm run dev) hot-reloads when files change, so the live site updates on its own.
# Fast-forward only: it will never overwrite local changes. If it cannot ff, it
# logs and skips that cycle instead of forcing anything.
#
# Errors are LOGGED, never discarded. A previous version sent stderr to /dev/null,
# so a broken job looked identical to a working one and the mini silently fell
# 22 commits behind for three weeks. Do not reintroduce that.

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG_STAMP="$(date '+%Y-%m-%d %H:%M:%S')"
HEARTBEAT="$REPO/.auto-pull-heartbeat"
ERRFILE="$REPO/.auto-pull-err"

log() { echo "$LOG_STAMP  $1" }

cd "$REPO" || { log "ERROR: cannot cd into $REPO"; exit 1 }

# Confirm the repo is actually readable from this process before touching git.
# Under launchd this is the step that fails when the agent lacks Full Disk
# Access to the Desktop folder, and git reports it as a confusing
# "not a git repository". Check it explicitly so the log names the real cause.
if ! git rev-parse --git-dir >/dev/null 2>"$ERRFILE"; then
  log "ERROR: cannot read the git repo at $REPO. Most likely launchd lacks Full Disk Access for the Desktop folder. Detail: $(cat "$ERRFILE" 2>/dev/null)"
  rm -f "$ERRFILE"
  exit 1
fi
rm -f "$ERRFILE"

BEFORE="$(git rev-parse --short HEAD)"

if ! FETCH_ERR="$(git fetch origin main --quiet 2>&1)"; then
  log "ERROR: fetch failed. $FETCH_ERR"
  exit 1
fi

if MERGE_ERR="$(git merge --ff-only origin/main --quiet 2>&1)"; then
  AFTER="$(git rev-parse --short HEAD)"
  if [ "$BEFORE" != "$AFTER" ]; then
    log "updated $BEFORE -> $AFTER"
  fi
  # Always record that the job ran, even when there was nothing to pull, so a
  # dead job is distinguishable from a quiet one. Single line, overwritten.
  echo "$LOG_STAMP  ok, at $AFTER" > "$HEARTBEAT"
else
  log "skipped: could not fast-forward (local changes or diverged history). $MERGE_ERR"
  echo "$LOG_STAMP  skipped, at $BEFORE" > "$HEARTBEAT"
fi
