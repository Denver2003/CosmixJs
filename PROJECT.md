# Project Notes (CosmixJS Physical Tetris MVP)

## What exists now

- **Matter.js playground** with a centered glass (10x20 units) and wireframe-style render.
- **Spawn/kill lines** drawn as horizontal guides.
- **Spawn flow**: a piece appears above the spawn line, drops to the line, freezes for 5s, then auto-drops.
- **Spawn scale**: falling piece scales from 0.5 → 1.0 while moving to spawn line.
- **Controls** (during the 5s wait):
  - Left/Right arrows: smooth horizontal movement.
  - Down arrow: drop immediately and spawn the next piece.
- **Random rotation at spawn**; no player rotation.
- **Shapes (area ~ constant, scaled down ~20%)**:
  - Rectangle 4x1 (scaled)
  - Square 2x2 (scaled)
  - Triangle
  - Circle
  - L-shape (composite)
- **Colors**: 4 random stroke colors per piece; transparent fill.
- **Kill line logic**: any non-waiting piece continuously touching the kill line for 10s triggers game over.
- **Kill line pulse**: always visible (faint red); pulses smoothly once contact timer starts (slow 2-6s, fast 6-10s).
- **Color chains**: if a connected chain of same-color pieces (by collision contacts) reaches 5+ and stays for 1.8s, those pieces disappear instantly.
- **Next preview**: next piece appears at spawn point as a ghost (0.5 scale, fade-in).

## File layout

- `index.html` — base page, includes Matter.js and loads `main.js` as a module.
- `scripts/main.js` — app bootstrap: engine, renderer, glass, game lifecycle, resize handler.
- `scripts/config.js` — constants/tuning knobs (units, physics params, timings).
- `scripts/glass.js` — playfield walls/floor construction and layout.
- `scripts/shapes.js` — shape creation, colors, random rotation.
- `scripts/game.js` — gameplay loop, input, spawn/drop logic, kill line checks, debug rendering.

## Tuning hotspots

- `config.js`: physics params, timings, movement speed, scaling.
- `game.js`: kill line behavior and spawn timing.
- `shapes.js`: shape list and geometry.
