#!/usr/bin/env bash
set -euo pipefail

EXPECTED_SHA="b06635d436db62de2ec6e7a25ef18d076947994b"
RELEASE_NAME="20260711-b06635d"
APP_ROOT="/opt/lasotinhhoa"
CURRENT_DIR="$APP_ROOT/current"
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_NAME"
ARCHIVE_PATH="/tmp/lasotinhhoa-b06635d.tar"
PREVIOUS_RELEASE="$(readlink -f "$CURRENT_DIR" 2>/dev/null || true)"
deploy_succeeded="0"

start_app() {
  local app_dir="$1"
  cd "$app_dir"
  pm2 delete lasotinhhoa >/dev/null 2>&1 || true
  pm2 start node_modules/next/dist/bin/next --name lasotinhhoa -- start -p 4100 -H 127.0.0.1
}

rollback_if_needed() {
  if [ "$deploy_succeeded" = "1" ]; then
    return
  fi

  if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
    ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_DIR"
    start_app "$PREVIOUS_RELEASE"
    pm2 save >/dev/null
  fi
}

trap rollback_if_needed EXIT

mkdir -p "$APP_ROOT/releases"
if [ -e "$RELEASE_DIR" ]; then
  echo "Release already exists: $RELEASE_DIR" >&2
  exit 1
fi
if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "Missing archive: $ARCHIVE_PATH" >&2
  exit 1
fi

mkdir -p "$RELEASE_DIR"
tar -xf "$ARCHIVE_PATH" -C "$RELEASE_DIR"
printf "%s\n" "$EXPECTED_SHA" > "$RELEASE_DIR/.codex-release-commit"

if [ -d "$CURRENT_DIR" ]; then
  for env_file in "$CURRENT_DIR"/.env "$CURRENT_DIR"/.env.*; do
    if [ -f "$env_file" ]; then
      cp "$env_file" "$RELEASE_DIR/"
    fi
  done
fi

cd "$RELEASE_DIR"
npm ci
node scripts/check-production-env.mjs
npm run pseo:seed
npm run seed:interpretations
npm run build

ln -sfn "$RELEASE_DIR" "$CURRENT_DIR"
start_app "$RELEASE_DIR"

healthy="0"
for attempt in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:4100/kien-thuc-tu-vi" >/dev/null &&
     curl -fsS "http://127.0.0.1:4100/kien-thuc-tu-vi/menh-tham-lang-la-gi" >/dev/null; then
    healthy="1"
    break
  fi
  sleep 1
done

if [ "$healthy" != "1" ]; then
  echo "New release failed local health check." >&2
  exit 1
fi

pm2 save
pm2 describe lasotinhhoa
pm2 describe lasotinhhoa | grep -F "$RELEASE_DIR" >/dev/null
readlink -f "$CURRENT_DIR"
echo "DEPLOYED_RELEASE=$RELEASE_DIR"
deploy_succeeded="1"
