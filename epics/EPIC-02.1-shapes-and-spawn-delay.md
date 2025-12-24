# EPIC-02.1 Shapes & Spawn Delay

## Goal
Align shape set and visuals with the project canon, normalize shape areas, and make spawn wait time scale with level.

## Scope
- Shape set matches document (including Diamond and T-shape)
- Shapes rendered as single-outline silhouettes (avoid composite look on L-shape)
- Normalize areas across all shapes (target equal area)
- Slightly reduce overall shape size (tune final scale)
- Spawn wait time computed from level (replacing fixed WAIT_DURATION_MS)

## Out of scope
- Scoring, rewards, combos
- Bubbles and bonuses
- Progression/shop/meta

## Deliverables
- Updated shape definitions and rendering style
- Area normalization and size tuning
- Level-based spawn wait formula and wiring
- Updated docs/config notes for new shape/size rules
