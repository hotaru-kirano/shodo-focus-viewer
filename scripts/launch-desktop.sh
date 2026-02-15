#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/desktop-dist"
STAMP_FILE="$DIST_DIR/.build-stamp"

required_items=(
  "desktop-viewer.html"
  "css"
  "js"
  "img"
  "kanjivg"
)

source_paths=(
  "$ROOT_DIR/desktop-viewer.html"
  "$ROOT_DIR/css"
  "$ROOT_DIR/js"
  "$ROOT_DIR/img"
  "$ROOT_DIR/kanjivg"
)

needs_build=0
build_reason=""

for item in "${required_items[@]}"; do
  if [[ ! -e "$DIST_DIR/$item" ]]; then
    needs_build=1
    build_reason="desktop-dist is missing required files"
    break
  fi
done

if [[ "$needs_build" -eq 0 && ! -f "$STAMP_FILE" ]]; then
  needs_build=1
  build_reason="build stamp is missing"
fi

if [[ "$needs_build" -eq 0 ]]; then
  for source in "${source_paths[@]}"; do
    if find "$source" -type f -newer "$STAMP_FILE" -print -quit | grep -q .; then
      needs_build=1
      build_reason="source files changed since last build"
      break
    fi
  done
fi

cd "$ROOT_DIR"

if [[ "$needs_build" -eq 1 ]]; then
  echo "$build_reason. Building assets..."
  npm run desktop:prepare
  touch "$STAMP_FILE"
else
  echo "desktop-dist is up to date. Skipping build."
fi

echo "Launching app..."
npm exec -- neu run
