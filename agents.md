AGENTS.md

Scope
- Project root: /Users/deniskhlopin/UnityProjects/CosmixJS
- Runtime: JS + Matter.js (no bundler by default)

Startup Routine
1) Read PROJECT_OVERVIEW.md and PROJECT.md before any work.
2) Read relevant epic(s) in epics/ and the active plan in plans/.
3) If the requested change touches canon, check PROJECT_OVERVIEW.md and ask before altering it.

Workflow: Epics and Plans
- Each epic has a plan in plans/ (PLAN_EPIC_*.md).
- Build a step-by-step plan with checkboxes.
- Confirm each step with the user before executing it.
- After finishing a step, mark it checked in the plan.

Change Logging Rules
- Always update PROJECT.md when new functionality or behavior changes are introduced.
- Update PROJECT_OVERVIEW.md only after asking for approval.

Communication Rules (from this chat)
- Ask for confirmation before important steps and before large changes.
- Keep edits minimal and focused; clarify formulas and parameters when ambiguous.
- Use consistent project wording and keep docs synced with code.

Current Agreements / Canon (from this chat)
- Level progression: L1 = 10, then ToNextLevel = floor(prev * 1.2).
- Colors: start 4, +1 every 5 levels, max 7; neon palette.
- Rotation: random range 0 for L1–5; ramps to max by L10; discrete 0/90/180/-90 always applied.
- Chains: CHAIN_MIN = 4; stability 1.8s; grace 250ms; fill pulse max alpha 0.8.
- Spawn wait: L1 = 4.0s, -0.16s per level, min 1.0s.
- Shapes: rectangle 4Lx1L, square 2Lx2L, triangle (side 3L), circle (r=1.128L), diamond (diag 2L/4L), oval (area 4L^2, ratio 1.6), pentagon (area 4L^2).
- Wait indicator: active piece fills top-to-bottom while waiting.
