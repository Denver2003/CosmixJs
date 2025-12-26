# Project Notes (CosmixJS Physical Tetris MVP)

## What exists now

- **Matter.js playground** with a centered glass (10x20 units) and wireframe-style render.
- **Spawn/kill lines** drawn as horizontal guides.
- **Spawn flow**: a piece appears above the spawn line, drops to the line, freezes (L1=4.0s; -0.16s per level; min 1.0s), then auto-drops.
- **Spawn wait indicator**: active piece fills from top to bottom while waiting on the control line.
- **Spawn scale**: falling piece scales from 0.5 → 1.0 while moving to spawn line.
- **Controls** (during the descent and 5s wait):
  - Left/Right arrows: smooth horizontal movement.
  - Down arrow: drop immediately and spawn the next piece.
- **Pointer controls**: drag left/right while holding; release to drop (mouse/touch).
- **Random rotation at spawn**; no player rotation.
- **Shapes (grid-based, size by L = UNIT * SHAPE_SCALE)**:
  - Rectangle: 4L x 1L
  - Square: 2L x 2L
  - Triangle: equilateral, side 3L
  - Circle: radius 1.128L
  - Diamond: diagonals 2L and 4L
  - Oval: ellipse area = 4L^2, aspect ratio 1.6
  - Pentagon: regular, area = 4L^2
- **Colors**: 4 random stroke colors per piece; transparent fill.
- **Kill line logic**: any non-waiting piece continuously touching the kill line for 10s triggers game over.
- **Kill line pulse**: always visible (faint red); pulses smoothly once contact timer starts (slow 2-6s, fast 6-10s).
- **Color chains**: if a connected chain of same-color pieces (by collision contacts) reaches 4+ and stays for 1.8s, those pieces disappear instantly.
- **Chain burst**: matched chains now play a 0.5s burst (scatter, scale-by-distance, fade), get a small upward kick, then fall with extra gravity; removed after the burst.
- **Scoring**: collapse score uses NR formula with a chain-size bonus (+10% per piece above 4); level-up grants NLR bonus.
- **Score particles**: per-figure `+N` texts spawn on collapse, burst outward, then magnetize to the SCORE HUD and fade; color matches the collapsed figure.
- **Next preview**: next piece appears at spawn point as a ghost (0.5 scale, fade-in).
- **Levels**: L1=10 required, then `floor(prev * 1.2)` per level; tracks cleared figures.
- **Colors**: start 4, +1 per 5 levels, max 7; palette updated to neon, high-contrast colors.
- **Rotation**: no random rotation for L1-5; L6-9 ramps to max; L10+ capped; a discrete 0/90/180/‑90 offset is always added.
- **Diamond**: one diagonal ~40% shorter than the other.
- **Debug overlay**: optional top-right telemetry (level, cleared, angle, colors).
- **Impact flash**: first collision after a drop triggers a fast full-body fill blink.
- **Combo system**: each collapse opens a 4s window for the next; streak-based multiplier capped at x5 (Combo/Super/Mega/Cosmo).
- **Combo popup**: combo label bursts from collapse center to glass center, blinks on peak (1–4), then floats up and fades; stacked vertically when overlapping.
- **Cosmometer**: energy increases on each drop (internal max 125, visual scale 0–100); energy decays faster at higher charge (x1→x3), thresholds drive game multiplier (x1/x2/x3/x5) and HUD thermometer with color transitions and level popups.
- **Bubbles**: spawn chance uses legacy tables (count+combo); rewards roll on spawn with per-type cooldowns; bubbles pop on tap with VFX + reward icons.
- **Bonuses**: instant Hail drops random shapes from top spawn points; Color Grenade collapses all figures of a color and counts as a normal chain (combo/score/FX); consumables (Touch-to-Kill, Machine Gun) are stored, activate from right panel, show cooldown radial fill, and apply chain removal rules.
- **Bonus persistence**: consumable inventory is saved on game over and loaded on the next session.
- **Auto-fit viewport**: fit-to-height scaling with top (3u) and bottom (wall thickness) reserves; letterbox allowed; iOS-friendly viewport handling.
- **Pause mode**: `P` toggles pause; auto-pause on resize and loss of focus with 3s countdown to resume.
- **HUD layout (prototype)**: top HUD (Score/Coins/Pause), left-border cosmometer, right-side bonus button slots, bottom progress in floor border.
- **Score/Coins HUD**: live score display; coins persist between sessions (saved on game over).

## File layout

- `index.html` — base page, includes Matter.js and loads `main.js` as a module.
- `scripts/main.js` — app bootstrap: engine, renderer, glass, game lifecycle, resize handler.
- `scripts/config.js` — constants/tuning knobs (units, physics params, timings).
- `scripts/glass.js` — playfield walls/floor construction and layout.
- `scripts/shapes.js` — shape creation, colors, random rotation.
- `scripts/view/viewport.js` — viewport sizing + fit-to-height canvas setup.
- `scripts/view/fit.js` — view sizing helpers (fit height/reserves).
- `scripts/game/index.js` — gameplay wiring and orchestration.
- `scripts/game/state.js` — game state container.
- `scripts/game/spawn.js` — spawn, drop, scale-on-fall.
- `scripts/game/preview.js` — next-piece preview and fade-in.
- `scripts/game/controls.js` — keyboard input handling.
- `scripts/game/lines.js` — spawn/kill line drawing.
- `scripts/game/kill.js` — kill-line timer and game over.
- `scripts/game/pause.js` — pause/auto-pause controller.
- `scripts/game/chains/index.js` — chain detection + effects orchestration.
- `scripts/game/chains/detect.js` — chain detection logic.
- `scripts/game/chains/effects.js` — chain fill/burst/flash effects.
- `scripts/game/draw/bonus_ui.js` — bonus buttons + bubble key hint + icon legend draw helpers.
- `scripts/game/draw/overlays.js` — gameplay overlays (touch-to-kill).
- `scripts/game/bonuses/instant.js` — instant bonus logic (hail, grenade).
- `scripts/game/bonuses/consumables.js` — consumable bonus logic (touch, gun).
- `scripts/game/bonuses/gun_marks.js` — machine gun mark VFX.
- `scripts/game/bonuses/index.js` — bonus module exports.
- `scripts/game/bonuses.js` — re-export entrypoint for bonus modules.
- `scripts/game/level_up_popup.js` — level-up popup animation.
- `scripts/game/utils.js` — shared clamp, scale, color helpers.
- `scripts/config.js` — includes `DEBUG_OVERLAY` toggle.
- `scripts/ui/layout.js` — HUD layout helpers (safe area + glass rects).
- `scripts/ui/hud.js` — top HUD layout geometry.

## Tuning hotspots

- `config.js`: physics params, timings, movement speed, scaling.
- `game.js`: kill line behavior and spawn timing.
- `shapes.js`: shape list and geometry.
