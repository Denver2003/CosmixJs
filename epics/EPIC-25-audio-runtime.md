# EPIC-25 Audio Runtime Integration

## Goal
Подключить реальное воспроизведение звуков (SFX/BGM) и расширить набор игровых аудио‑событий.

## Scope
- Реальный AudioManager (load/cache/play/loop, громкости music/sfx, mute).
- Подключение событий:
  - bubble pop → reward (coin/points/instant) в нужном порядке.
  - chain burst → combo (включая обычное combo).
  - falling shapes (hail).
  - kill‑line warning + timeout.
  - базовые spawn/drop/impact/bonus/cosmo/level up.
- Обновление `assets/audio/README.md` с полным списком и описанием.

## Out of scope
- Финальный саунд‑дизайн/мастеринг.

## Done when
- Все игровые SFX и BGM воспроизводятся, порядок соблюден.
- Настройки music/sfx/mute работают.
- README по аудио актуален.
