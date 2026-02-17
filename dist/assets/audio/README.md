# Audio Asset List

## SFX

Source: local-sfx MCP (`generate_sfx_batch`), pass `v1 + v2 shortlist + v3-soft + v4-soft`, generated on 2026-02-16.
Processing: loudness target `~ -16 LUFS`, true peak `<= -1.0 dBTP`, target-duration alignment per event.
Manifest: `assets/audio/generation_manifest.json`.
Soft-pass notes (A/B): `assets/audio/staging/v1/logs/SFX_SOFT_PASS_NOTES.md`.
Kill-line warning throttle notes: `assets/audio/staging/v1/logs/KILL_WARNING_THROTTLE_NOTES.md`.
Round1 bonus retune candidates: `assets/audio/staging/v1/bonus_retune_round1/logs/ROUND1_OPTIONS.md`.
`bonus_coin_pick.wav` restored raw from previous main commit `1ab99df` (2026-02-17).

- `assets/audio/sfx/drop_whoosh.wav` — сброс/падение фигуры.
- `assets/audio/sfx/impact_first.wav` — первый удар после падения (единожды на фигуру).
- `assets/audio/sfx/chain_burst.wav` — исчезновение цепочки.
- `assets/audio/sfx/bonus_bubble_pop.wav` — лопание пузыря.
- `assets/audio/sfx/bonus_coin_pick.wav` — награда монет из пузыря (после pop).
- `assets/audio/sfx/bonus_points_pick.wav` — награда очков из пузыря (после pop).
- `assets/audio/sfx/bonus_instant_pick.wav` — награда instant‑бонуса (после pop).
- `assets/audio/sfx/bonus_grenade.wav` — срабатывание цветной гранаты.
- `assets/audio/sfx/bonus_hail_fall.wav` — падение дождя фигур (hail).
- `assets/audio/sfx/bonus_gun_shot.wav` — одиночный выстрел автомата.
- `assets/audio/sfx/laser_warning_loop.wav` — предупреждение линии смерти (луп/пульс).
- `assets/audio/sfx/laser_timeout_hit.wav` — срабатывание game over от линии смерти.
- `assets/audio/sfx/game_over.wav` — общий звук проигрыша.
- `assets/audio/sfx/combo_basic.wav` — озвучка обычного комбо.
- `assets/audio/sfx/combo_super.wav` — озвучка супер‑комбо.
- `assets/audio/sfx/combo_mega.wav` — озвучка мега‑комбо.
- `assets/audio/sfx/combo_cosmo.wav` — озвучка космо‑комбо.
- `assets/audio/sfx/level_up.wav` — новый уровень.
- `assets/audio/sfx/cosmo_level_up.wav` — повышение множителя космометра (только при росте вверх, throttle 7s).
- Gameplay note: каждый hail-drop теперь добавляет `x2` энергии космометра относительно обычного drop.

## BGM

- Source track: `assets/audio/bgm/Cosmix music.mp3`.
- Runtime loops (level bands):
  - `assets/audio/bgm/bgm_loop_1.ogg` for levels `1..4`
  - `assets/audio/bgm/bgm_loop_2.ogg` for levels `5..8`
  - `assets/audio/bgm/bgm_loop_3.ogg` for levels `9..12`
  - `assets/audio/bgm/bgm_loop_4.ogg` for levels `13+`
- Legacy alias id `bgm_main_loop` points to `bgm_loop_1`.
- Runtime backend policy: BGM воспроизводится только через WebAudio buffer (без HTMLAudio fallback для музыки).
- Switch behavior: переход между level-bands ставится на конец текущего loop и выполняется с crossfade `2.0s`.
- Pause behavior: при pause/focus-loss музыка мгновенно замолкает и при resume продолжается с текущего места.
- Start behavior: музыка запускается уже в shell/menu (loop_1); первый старт игры из меню не перезапускает loop.
- Restart behavior: retry/restart всегда сбрасывает BGM на `bgm_loop_1` с начала.
- BGM prep report: `assets/audio/staging/v1/logs/BGM_LOOP_PREP_REPORT.md`.
