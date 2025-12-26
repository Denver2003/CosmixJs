# EPIC-01.5 Refactor & Structure

Goal: reduce file size and improve maintainability without changing behavior.

Scope
- Move viewport/fit logic into dedicated `scripts/view/` modules.
- Isolate pause/auto-pause logic into `scripts/game/pause.js`.
- Split chain detection vs. visual effects into separate files.
- Keep current behavior and tuning intact.

Non-goals
- Gameplay changes.
- Visual redesign.
