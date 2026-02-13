---
name: yandex-games-build
description: Build and verify the local Yandex Games release bundle for CosmixJS. Use when the user asks to build a Yandex release, prepare yandex zip, or verify that dist/app.min.js and cosmix_yandex_build_obf.zip are ready for upload.
---

# Yandex Games Build

Run local Build + Verify workflow for Yandex Games release artifacts.

## Workflow

1. Run `scripts/build_and_verify.sh`.
2. Use the script output as the primary result.
3. If `Ready for upload` is `no`, report failure and include missing artifacts or build errors.
4. If `Ready for upload` is `yes`, report success and include artifact sizes and timestamps.

## Contract

The report must include:

- `Build command`
- `Build status`
- `Artifacts`
- `Artifact sizes`
- `Last modified times`
- `Warnings`
- `Ready for upload`

## Notes

- Canonical build command is `./build_dist_obf.sh`.
- Canonical release archive is `cosmix_yandex_build_obf.zip`.
- This skill does not upload files to Yandex Games; it only builds and verifies local artifacts.
