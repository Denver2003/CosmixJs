# EPIC-01 Gameplay Core+

## Goal
Extend the core gameplay with levels, difficulty scaling, color growth, and rotation rules.

## Scope
- Level progression (Level 1+)
- ToNextLevel = Level * 20
- Color count growth (start 4, +1 every 5 levels, max 7)
- Rotation rules by level (no rotation for L1-5, random rotation from L6+ with expanding range)
- Chain detection rules align with overview (contact and reset behavior)

## Out of scope
- Scoring, combos, rewards
- Bubbles and bonuses
- Shop/progression/meta

## Deliverables
- Level system state and transitions
- Difficulty parameters wired to level
- Color count scaling rules
- Rotation range scaling rules
- Updated debug overlays/telemetry (if needed)
