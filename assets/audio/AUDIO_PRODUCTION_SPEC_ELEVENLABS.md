# CosmixJS Audio Production Spec (ElevenLabs)

## Scope and constraints

- Replace all runtime-used audio only (19 SFX + 1 BGM).
- Keep current runtime IDs and file names from `scripts/audio/index.js`.
- Keep current formats: SFX as `.wav`, BGM as `.ogg`.
- Style: Arcade Sci-Fi.
- Voice: disabled (no spoken words/callouts).
- BGM: one loop track.
- Acceptance priority: in-game feel first.

## Mix and technical targets

- SFX target loudness: around `-16 LUFS` integrated, true peak <= `-1.0 dBTP`.
- BGM target loudness: around `-20 LUFS` integrated, true peak <= `-1.0 dBTP`.
- SFX spectral focus: clear transient attack, short tails, low masking in 1-4 kHz with HUD/gameplay cues.
- BGM spectral focus: supportive, avoid masking key SFX (especially combo/kill-line cues).
- Keep runtime anti-spam/min interval behavior from `scripts/audio/index.js` unchanged.

## Loop rules

- `laser_warning_loop.wav`: seamless short loop, no click at wrap, no long release tail.
- `bgm_main_loop.ogg`: seamless music loop, no click, no abrupt harmonic jump.

## Event table (source of truth for generation)

| Event ID | File | Tool | Target Duration | Role | Prompt |
|---|---|---|---|---|---|
| drop_whoosh | `assets/audio/sfx/drop_whoosh.wav` | text_to_sound_effects | 0.35s | piece drop impulse | "Arcade sci-fi short downward whoosh, tight transient, no voice, no reverb tail, game UI SFX" |
| impact_first | `assets/audio/sfx/impact_first.wav` | text_to_sound_effects | 0.20s | first landing impact | "Arcade sci-fi metallic impact tick, punchy attack, very short decay, no voice" |
| chain_burst | `assets/audio/sfx/chain_burst.wav` | text_to_sound_effects | 0.55s | chain collapse burst | "Arcade sci-fi energy burst for chain collapse, bright transient then short airy decay, no voice" |
| bonus_bubble_pop | `assets/audio/sfx/bonus_bubble_pop.wav` | text_to_sound_effects | 0.18s | bubble pop | "Clean sci-fi bubble pop, snappy and light, very short, no voice" |
| bonus_coin_pick | `assets/audio/sfx/bonus_coin_pick.wav` | text_to_sound_effects | 0.16s | coin reward | "Arcade sci-fi coin pickup blip, positive high-pitched ping, short and clean" |
| bonus_points_pick | `assets/audio/sfx/bonus_points_pick.wav` | text_to_sound_effects | 0.18s | points reward | "Arcade sci-fi score pickup tone, glassy upward chirp, short and clear" |
| bonus_instant_pick | `assets/audio/sfx/bonus_instant_pick.wav` | text_to_sound_effects | 0.24s | instant bonus reward | "Arcade sci-fi powerup pickup, bright layered blip with tiny rise, no voice" |
| bonus_grenade | `assets/audio/sfx/bonus_grenade.wav` | text_to_sound_effects | 0.60s | color grenade trigger | "Arcade sci-fi energy grenade burst, controlled explosion feel, strong transient, short tail" |
| bonus_hail_fall | `assets/audio/sfx/bonus_hail_fall.wav` | text_to_sound_effects | 0.65s | hail bonus trigger | "Arcade sci-fi multi-object drop cue, clustered descending ticks and whoosh, compact" |
| bonus_gun_shot | `assets/audio/sfx/bonus_gun_shot.wav` | text_to_sound_effects | 0.11s | machine gun shot | "Arcade sci-fi blaster shot, dry punchy zap, ultra short, repeat-safe" |
| laser_warning_loop | `assets/audio/sfx/laser_warning_loop.wav` | text_to_sound_effects | 0.80s | danger loop warning | "Arcade sci-fi danger alarm loop, pulsing laser warning tone, seamless loop, no voice" |
| laser_timeout_hit | `assets/audio/sfx/laser_timeout_hit.wav` | text_to_sound_effects | 0.45s | kill-line timeout hit | "Arcade sci-fi critical fail hit, sharp impact plus low tail, dramatic but short" |
| game_over | `assets/audio/sfx/game_over.wav` | text_to_sound_effects | 1.20s | game over sting | "Arcade sci-fi game over stinger, descending synth failure motif, no voice" |
| combo_basic | `assets/audio/sfx/combo_basic.wav` | text_to_sound_effects | 0.35s | combo x2 cue | "Arcade sci-fi combo cue level 1, upbeat synth stab, short celebratory" |
| combo_super | `assets/audio/sfx/combo_super.wav` | text_to_sound_effects | 0.42s | combo x3 cue | "Arcade sci-fi combo cue level 2, brighter and stronger than basic, short" |
| combo_mega | `assets/audio/sfx/combo_mega.wav` | text_to_sound_effects | 0.50s | combo x4 cue | "Arcade sci-fi combo cue level 3, energetic layered synth hit, short" |
| combo_cosmo | `assets/audio/sfx/combo_cosmo.wav` | text_to_sound_effects | 0.60s | combo x5+ cue | "Arcade sci-fi combo cue max tier, triumphant cosmic synth flourish, compact" |
| level_up | `assets/audio/sfx/level_up.wav` | text_to_sound_effects | 0.70s | level progression cue | "Arcade sci-fi level up stinger, positive rising synth, medium short, no voice" |
| cosmo_level_up | `assets/audio/sfx/cosmo_level_up.wav` | text_to_sound_effects | 0.75s | multiplier increase cue | "Arcade sci-fi multiplier up cue, bright ascending arpeggio, celebratory and clear" |
| bgm_main_loop | `assets/audio/bgm/bgm_main_loop.ogg` | compose_music | 75s | main gameplay loop | "Arcade sci-fi game background music loop, energetic but non-intrusive, steady groove, no vocals, optimized under action SFX" |

## v1 -> v2 iteration policy

- Pass 1 (v1): generate full set and integrate after technical processing.
- Playtest and log issues by event: masking, harshness, weak readability, annoying repetition, loop artifacts.
- Pass 2 (v2): regenerate only failing events; keep good events untouched.

## Required generation artifact

Create `assets/audio/generation_manifest.json` with one record per event:

- `event_id`
- `file`
- `tool` (`text_to_sound_effects` or `compose_music`)
- `prompt`
- `requested_duration_sec`
- `output_format_before_post`
- `post_processing` (ffmpeg filters/trim/loop notes)
- `final_duration_sec`
- `timestamp_utc`
- `pass` (`v1` or `v2`)

## Post-processing guidance (implementation step)

- Use ffmpeg for format conversion and loudness normalization.
- Prefer transparent processing, avoid over-compression.
- Validate outputs with ffprobe duration and quick artifact scan.
