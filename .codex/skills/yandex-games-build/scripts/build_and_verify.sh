#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
BUILD_CMD="./build_dist_obf.sh"
APP_MIN_JS="$ROOT_DIR/dist/app.min.js"
RELEASE_ZIP="$ROOT_DIR/cosmix_yandex_build_obf.zip"
BUILD_LOG="$(mktemp -t yandex-build-log.XXXXXX)"

cleanup() {
  rm -f "$BUILD_LOG"
}
trap cleanup EXIT

format_mtime() {
  local path="$1"
  if stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S %z" "$path" >/dev/null 2>&1; then
    stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S %z" "$path"
  else
    stat -c "%y" "$path" 2>/dev/null || echo "unknown"
  fi
}

format_bytes() {
  local path="$1"
  wc -c <"$path" | tr -d ' '
}

run_build() {
  (
    cd "$ROOT_DIR"
    "$BUILD_CMD"
  ) >"$BUILD_LOG" 2>&1
}

build_status="success"
if ! run_build; then
  build_status="failed"
fi

missing=()
for artifact in "$APP_MIN_JS" "$RELEASE_ZIP"; do
  if [[ ! -f "$artifact" ]]; then
    missing+=("$artifact")
  fi
done

warnings="$(grep -E '(^▲ \[WARNING\])|(^WARNING:)|(^warning:)|(\[WARNING\])' "$BUILD_LOG" || true)"

ready_for_upload="yes"
if [[ "$build_status" != "success" || "${#missing[@]}" -gt 0 ]]; then
  ready_for_upload="no"
fi

echo "Build command: (cd \"$ROOT_DIR\" && $BUILD_CMD)"
echo "Build status: $build_status"
echo "Artifacts:"
echo "  - dist/app.min.js: $APP_MIN_JS"
echo "  - cosmix_yandex_build_obf.zip: $RELEASE_ZIP"
echo "Artifact sizes:"
if [[ -f "$APP_MIN_JS" ]]; then
  echo "  - dist/app.min.js: $(format_bytes "$APP_MIN_JS") bytes"
else
  echo "  - dist/app.min.js: MISSING"
fi
if [[ -f "$RELEASE_ZIP" ]]; then
  echo "  - cosmix_yandex_build_obf.zip: $(format_bytes "$RELEASE_ZIP") bytes"
else
  echo "  - cosmix_yandex_build_obf.zip: MISSING"
fi
echo "Last modified times:"
if [[ -f "$APP_MIN_JS" ]]; then
  echo "  - dist/app.min.js: $(format_mtime "$APP_MIN_JS")"
else
  echo "  - dist/app.min.js: MISSING"
fi
if [[ -f "$RELEASE_ZIP" ]]; then
  echo "  - cosmix_yandex_build_obf.zip: $(format_mtime "$RELEASE_ZIP")"
else
  echo "  - cosmix_yandex_build_obf.zip: MISSING"
fi
echo "Warnings:"
if [[ -n "$warnings" ]]; then
  printf '%s\n' "$warnings"
else
  echo "none"
fi

if [[ "$build_status" != "success" ]]; then
  echo "Build output (last 40 lines):"
  tail -n 40 "$BUILD_LOG"
fi
if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "Missing artifacts:"
  for path in "${missing[@]}"; do
    echo "  - $path"
  done
fi

echo "Ready for upload: $ready_for_upload"

if [[ "$ready_for_upload" != "yes" ]]; then
  exit 1
fi
