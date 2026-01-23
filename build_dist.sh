#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT/dist"
ZIP="$ROOT/cosmix_yandex_build.zip"

rm -rf "$DIST"
mkdir -p "$DIST"

cp "$ROOT/index.html" "$DIST/"
cp -R "$ROOT/assets" "$ROOT/css" "$ROOT/scripts" "$ROOT/lib" "$DIST/"

python3 - <<'PY'
import os
import shutil

root = os.path.join(os.path.dirname(__file__), "dist")
copy_name = "sfx\xa0— копия"
copy_path = os.path.join(root, "assets", "audio", copy_name)
if os.path.isdir(copy_path):
    shutil.rmtree(copy_path)

for dirpath, _, filenames in os.walk(root):
    for name in filenames:
        if name == ".DS_Store":
            os.remove(os.path.join(dirpath, name))
PY

(cd "$ROOT" && zip -r "cosmix_yandex_build.zip" "dist" -x "**/.DS_Store")
