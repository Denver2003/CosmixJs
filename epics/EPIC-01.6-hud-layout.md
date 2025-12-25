# EPIC-01.6 HUD Layout (Prototype)

Goal: implement the HUD layout described in `ui_layout_spec.md` without changing gameplay logic.

Scope
- Top HUD: Score (left), Coins + Pause (right), outside tank.
- Left tank border: embedded Cosmometer bar.
- Right side: 3 bonus buttons outside tank, aligned to tank.
- Bottom tank border: Level + progress embedded in border.
- Keep playfield clear; avoid bubble tap zone.

Non-goals
- Scoring/coins logic, bonus behaviors, or shop UI.
- Gameplay or physics changes.
