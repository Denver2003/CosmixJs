# PLAN_EPIC_AUDIO_REPLACEMENT_ELEVENLABS — Full Audio Replacement via ElevenLabs

- [x] Шаг 1: Подготовить production-спеку аудио (style guide, duration targets, loudness targets, anti-spam и loop-правила) и зафиксировать таблицу `event -> file -> prompt -> duration/role`.
- [ ] Шаг 2: Сгенерировать v1 пакет через MCP ElevenLabs (`text_to_sound_effects` для 19 SFX, `compose_music` для 1 BGM) в staging-папку без перезаписи production.
- [ ] Шаг 3: Выполнить техобработку v1 (конвертация/нормализация/подрезка loop), сохранить текущие форматы (`.wav` SFX, `.ogg` BGM).
- [ ] Шаг 4: Интегрировать v1 в `assets/audio/*` и выполнить локальный smoke по ключевым сценариям.
- [ ] Шаг 5: Сделать целевую v2-регенерацию проблемных звуков, повторить обработку и smoke-test.
- [ ] Шаг 6: Выполнить cleanup лишних аудиофайлов, добавить generation manifest, обновить `assets/audio/README.md` и `PROJECT.md`.

## Status notes

- Step 2 is currently blocked by ElevenLabs API limits on 2026-02-11:
  - SFX generation: `401 detected_unusual_activity`.
  - BGM generation: `402 limited_access` (Music API requires paid plan).
- Detailed log: `assets/audio/staging/v1/logs/STEP2_BLOCKER.md`.
