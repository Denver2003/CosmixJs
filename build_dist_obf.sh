#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT/dist"
ZIP="$ROOT/cosmix_yandex_build_obf.zip"
ESBUILD="$ROOT/node_modules/.bin/esbuild"

if [[ ! -x "$ESBUILD" ]]; then
  echo "esbuild not found. Run: npm install" >&2
  exit 1
fi

rm -rf "$DIST"
mkdir -p "$DIST"

cp -R "$ROOT/assets" "$ROOT/css" "$ROOT/lib" "$DIST/"

"$ESBUILD" "$ROOT/scripts/main.js" \
  --bundle \
  --minify \
  --format=iife \
  --target=es2018 \
  --outfile="$DIST/app.min.js"

python3 - <<'PY'
import os
import pathlib
import shutil

root = pathlib.Path(__file__).resolve().parent
dist = root / "dist"

src = (root / "index.html").read_text(encoding="utf-8")
old = '<script type="module" src="./scripts/main.js"></script>'
new = '<script src="./app.min.js"></script>'
if old not in src:
    raise SystemExit("index.html missing expected module script")
(dist / "index.html").write_text(src.replace(old, new), encoding="utf-8")

copy_name = "sfx\u00a0\u2014 \u043a\u043e\u043f\u0438\u044f"
copy_path = dist / "assets" / "audio" / copy_name
if copy_path.is_dir():
    shutil.rmtree(copy_path)

audio_readme = dist / "assets" / "audio" / "README.md"
if audio_readme.is_file():
    audio_readme.unlink()

for dirpath, _, filenames in os.walk(dist):
    for name in filenames:
        if name == ".DS_Store":
            os.remove(os.path.join(dirpath, name))
PY

(cd "$ROOT" && zip -r "cosmix_yandex_build_obf.zip" "dist" -x "**/.DS_Store")
