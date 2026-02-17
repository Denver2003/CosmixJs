# SFX Soft Pass Notes (v3-soft)

Date (UTC): 2026-02-16
Scope: `impact_first`, `drop_whoosh`, `bonus_bubble_pop`, `bonus_coin_pick`, `bonus_points_pick`

## Goal
- Make frequent SFX less fatiguing and less sharp.
- Keep runtime IDs, durations, and anti-spam logic unchanged.

## Processing profile
- Loudness/peak: `loudnorm=I=-16:TP=-1:LRA=11`
- Harshness control: EQ attenuation in 2.5–5 kHz band (`-1.5 .. -2.2 dB`)
- Attack smoothing: in/out fades 10ms
- Duration discipline: pad/trim to target duration per event

## A/B acceptance summary
- Accepted: all 5 events (`impact_first`, `drop_whoosh`, `bonus_bubble_pop`, `bonus_coin_pick`, `bonus_points_pick`).
- Objective A/B report: `assets/audio/staging/v1/soft_pass/logs/SOFT_PASS_AB_REPORT.json`.

## Notes by event
- `impact_first`: metallic edge reduced; softer attack with preserved readability.
- `drop_whoosh`: less hiss and less sharp leading transient.
- `bonus_bubble_pop`: softer top-end click, friendlier repeat behavior.
- `bonus_coin_pick`: initial `coin_pickup` variants were too bright; selected softer candidate from additional pass (`seed=3202`, `preset=error_beep`) due better high-band reduction.
- `bonus_points_pick`: reduced glassy harshness while keeping cue clarity.

## Manual listening checklist (pending in-game pass)
- 30–60s drop cycle: no ear fatigue from `impact_first` + `drop_whoosh`.
- Bubble reward loop: no piercing spikes from `bonus_coin_pick` and `bonus_points_pick`.
- Ensure cues remain readable in gameplay mix.

---

## v4-soft extension (remaining SFX + warning tone)

Date (UTC): 2026-02-16
Scope: `chain_burst`, `bonus_instant_pick`, `bonus_grenade`, `bonus_hail_fall`, `bonus_gun_shot`, `laser_warning_loop`, `laser_timeout_hit`, `game_over`, `combo_basic`, `combo_super`, `combo_mega`, `combo_cosmo`, `level_up`, `cosmo_level_up`, `bonus_coin_pick`

### Outcome
- Accepted: all 15 events.
- Objective report: `assets/audio/staging/v1/soft_pass_v4/logs/SOFT_PASS_V4_REPORT.json`.
- Coin candidate selection: `assets/audio/staging/v1/soft_pass_v4/logs/BONUS_COIN_PICK_SELECTION.json`.

### Notes
- `laser_warning_loop` replaced with softer loop profile (no screeching top end), prepared for delayed trigger logic in kill-line system.
- `game_over` moved to a softer “sad but readable” stinger profile.
- `bonus_coin_pick` reworked again toward “coin ring but soft”; selected candidate is `seed=4202`, `preset=coin_pickup`.
