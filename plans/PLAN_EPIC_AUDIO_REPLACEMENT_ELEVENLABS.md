# PLAN_EPIC_AUDIO_REPLACEMENT_ELEVENLABS — Full Audio Replacement via ElevenLabs

- [x] Шаг 1: Подготовить production-спеку аудио (style guide, duration targets, loudness targets, anti-spam и loop-правила) и зафиксировать таблицу `event -> file -> prompt -> duration/role`.
- [x] Шаг 2: Сгенерировать v1 пакет через local MCP `generate_sfx_batch` для 19 SFX в staging-папку (`assets/audio/staging/v1/sfx_raw`) без перезаписи BGM.
- [x] Шаг 3: Выполнить техобработку SFX-only v1 (`.wav`): loudness/peak нормализация, trim/fade, проверка loop-кандидата, сохранить результаты в `assets/audio/staging/v1/sfx_processed`.
- [x] Шаг 4: Интегрировать обработанные SFX в `assets/audio/sfx/*.wav` и выполнить локальный smoke (runtime coverage + ffprobe валидность).
- [x] Шаг 5: Сделать целевую v2-регенерацию shortlist проблемных SFX, повторить обработку и smoke-test.
- [x] Шаг 6: Выполнить cleanup/логирование генерации, добавить `assets/audio/generation_manifest.json`, обновить `assets/audio/README.md` и `PROJECT.md`.

## Status notes

- Step 2 is currently blocked by ElevenLabs API limits on 2026-02-11:
  - SFX generation: `401 detected_unusual_activity`.
  - BGM generation: `402 limited_access` (Music API requires paid plan).
- Detailed log: `assets/audio/staging/v1/logs/STEP2_BLOCKER.md`.
- On 2026-02-16 execution path switched to local-sfx MCP for SFX generation due ElevenLabs API blockers.
- This pass is SFX-only by decision; `assets/audio/bgm/bgm_main_loop.ogg` is deferred and unchanged.
