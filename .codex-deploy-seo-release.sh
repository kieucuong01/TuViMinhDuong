#!/usr/bin/env bash
set -euo pipefail

SHA="${1:?missing sha}"
ARCHIVE="${2:?missing archive path}"

TS="$(date +%Y%m%d%H%M%S)"
REL="/opt/lasotinhhoa/releases/${TS}-${SHA}"
CUR="$(readlink -f /opt/lasotinhhoa/current)"

mkdir -p "$REL"
tar -xzf "$ARCHIVE" -C "$REL"

shopt -s nullglob dotglob
for f in "$CUR"/.env*; do
  [ -f "$f" ] && cp "$f" "$REL"/
done

cd "$REL"
npm ci
npm run build

ln -sfn "$REL" /opt/lasotinhhoa/current
pm2 restart lasotinhhoa --update-env

if ! pm2 describe lasotinhhoa | grep -F "$REL" >/dev/null; then
  cd /opt/lasotinhhoa/current
  pm2 delete lasotinhhoa || true
  pm2 start npm --name lasotinhhoa -- start -- --hostname 127.0.0.1 --port 4100
  pm2 save
fi

pm2 describe lasotinhhoa
