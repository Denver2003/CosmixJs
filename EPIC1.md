# Physical Tetris — MVP Prototype Specification

## 1. Goal

Create a minimal playable prototype of a **2D physics-based Tetris-like game** to experiment with:
- physics stability
- object stacking behavior
- gravity tuning
- collision and settling logic

The prototype must:
- use **simple geometric shapes only**
- render **everything using lines / wireframe**
- focus on **physics correctness**, not visuals
- be implemented in **JavaScript** (HTML5 Canvas or similar)
- use a **2D physics engine** (e.g. Matter.js, Planck.js, Box2D port)

This is an **MVP for physics research**, not a production game.

---

## 2. Core Concept

The game is a **vertical playfield ("glass")** where:
- 2D physical objects fall under gravity
- objects collide with each other and with the playfield walls
- stacking is emergent from physics, not from a grid
- after settling, objects may optionally be snapped to a grid (future phase)

The feel should resemble:
- Tetris stacking
- but with **real mass, inertia, friction**
- minimal bouncing
- high stability

---

## 3. Coordinate System & Units

- World is 2D (X horizontal, Y vertical)
- Y axis points **down**
- Units are arbitrary but consistent
- Recommended:
  - Playfield width: 10 units
  - Playfield height: 20 units
- Gravity is constant and vertical

---

## 4. Playfield ("Glass")

### 4.1 Geometry

The playfield consists of:
- Left wall
- Right wall
- Bottom floor
- Open top (no ceiling)

Walls form a **single continuous boundary**.

### 4.2 Physics Properties

- Static bodies
- High friction (≈ 0.8–1.0)
- Very low restitution (≈ 0–0.05)
- No movement, no rotation

---

## 5. Zones (Logical Only)

Define horizontal reference lines:

- **Spawn Line**
  - Near the top of the playfield
  - New objects appear here

- **Kill Line**
  - Slightly below the spawn line
  - If any settled object crosses this line → game over

These lines:
- have NO physical collision
- are used for logic checks only
- are rendered as simple horizontal lines

---

## 6. Falling Objects (Blocks)

### 6.1 Shapes (MVP)

Use only simple convex shapes:
- rectangle (1x1, 2x1, 3x1)
- square
- L-shape (optional, composed of multiple rectangles or a polygon)

No complex meshes.

### 6.2 Physics Properties

Each falling object:
- Dynamic body
- Affected by gravity
- Moderate mass
- High angular damping
- Some linear damping
- Low restitution

Goal:
- minimal bouncing
- fast settling
- no jitter when resting

---

## 7. Object Lifecycle

1. Spawn object at Spawn Line
2. Object falls under gravity
3. Object collides with:
   - walls
   - floor
   - other objects
4. Player may optionally:
   - move object left/right
   - rotate object (discrete steps)
5. When object:
   - has very low linear & angular velocity
   - remains stable for a short time
   → it is considered **settled**

---

## 8. Settling & Stability Logic

An object is "settled" when:
- linear velocity magnitude < threshold
- angular velocity < threshold
- condition holds for N frames

After settling:
- object remains physical
- no grid snapping in MVP
- contributes to future collisions

---

## 9. Game Loop

Each frame:
1. Step physics simulation
2. Update object states
3. Check for newly settled objects
4. Check Kill Line condition
5. Render debug wireframe

---

## 10. Controls (Optional MVP)

- Left / Right: apply small horizontal impulse
- Rotate: instant rotation around center
- Drop: temporarily increase gravity or downward velocity

Controls are optional but helpful for testing.

---

## 11. Rendering Requirements

- No sprites
- No textures
- Use:
  - lines
  - rectangles
  - outlines only
- Different colors for:
  - playfield
  - active falling object
  - settled objects
  - spawn line
  - kill line

This is a **debug visualization**, not final art.

---

## 12. Non-Goals (Explicitly Out of Scope)

- No scoring system
- No line clearing
- No combos
- No animations
- No sound
- No UI polish

---

## 13. Key Technical Focus Areas

The prototype must allow easy experimentation with:
- gravity strength
- friction
- restitution
- mass
- damping
- collision stability
- jitter elimination

These values should be easy to tweak.

---

## 14. Desired Outcome

A sandbox prototype where:
- objects fall naturally
- stacking feels heavy and stable
- no jitter or shaking occurs at rest
- physics parameters can be tuned quickly

This prototype is the foundation for:
- future grid snapping
- hybrid physics + classic Tetris mechanics
- porting behavior to another engine (e.g. Unity)

---

## End of Specification