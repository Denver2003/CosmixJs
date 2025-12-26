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

General Collaboration Notes
- Keep AGENTS.md project-agnostic; put project facts in PROJECT.md or PROJECT_OVERVIEW.md.
- Ask for confirmation before important steps and large changes.
- Use step-by-step plans with checkboxes for epics; confirm each step before execution.
- Update PROJECT.md when behavior changes; update PROJECT_OVERVIEW.md only with approval.
- Treat newly introduced specs as the source of truth and align behavior accordingly.
- When changing probabilities, cooldowns, or formulas, document the active values and where they are configured.
- Parameterize visual effects and animations via config values for fast tuning.
- When using external assets, verify paths/names and guard against failed loads.
