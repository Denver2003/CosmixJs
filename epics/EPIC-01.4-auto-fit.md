# EPIC-01.4 Auto Fit (Screen Scaling)

Goal: fit the game to screen height (iOS Safari friendly) while keeping canonical world sizes.

Scope
- Fit-to-height scaling so the entire glass is always visible.
- Reserve a small top margin for HUD (level/score/coins).
- Allow letterboxing as needed.
- Handle iOS Safari viewport changes (address bar, orientation).
- Keep physics/world units unchanged; only rendering/view is adjusted.

Non-goals
- Changing canonical sizes in PROJECT_OVERVIEW.md.
- UI/HUD implementation (next task).
