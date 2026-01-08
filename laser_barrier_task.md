# Task: Implement "Death Line" Laser Barrier in HTML5 Canvas (no sprites)

## Context
We have a physics-based Tetris-like game rendered in HTML5 Canvas (JavaScript).
There is a "death line" (game over threshold) drawn across the play area.
Current implementation is just a blinking line and is not noticeable due to a noisy background (space) and many bright glass pieces.

We want to replace it with a **sci-fi laser barrier** rendered entirely in Canvas (no image sprites), with strong readability and a clear danger animation as pieces approach the death line.

The game visuals are "glass / crystal" style. SFX will also be glass-like, so visuals should match.

---

## Goals
1. **Always readable** death line on top of any background and stacked pieces.
2. **No sprites**: render using Canvas drawing API (gradients, strokes, additive blending).
3. **Smooth danger escalation**: instead of simple blinking, use:
   - pulsing brightness
   - moving scan highlights along the line
   - optional micro jitter / sparks near critical state
4. Must be lightweight and performant in browser.

---

## Definition of "Danger"
We compute `danger` in `[0..1]`:
- `0` = safe
- `1` = imminent game over

Suggested calculation:
- Let `deathLineY` = y coordinate of the death line.
- Let `highestY` = minimal y (topmost point) among all physics bodies (stacked pieces).
- Define a warning threshold distance: `thresholdPx` (e.g. 150px).
- Compute:
```js
danger = clamp(1 - ((deathLineY - highestY) / thresholdPx), 0, 1)
```
Explanation:
- If top stack is far below the death line: `deathLineY - highestY` large ⇒ danger ~ 0
- If stack touches or crosses near death line: danger → 1

---

## Rendering Requirements (Laser Barrier)
### Layered composition (all drawn each frame):
1. **Dark base strip** behind the laser (soft gradient band)
   - height: ~10–16px
   - gradient alpha peak: ~0.15–0.25 (increase with danger)
   - prevents laser from blending into noisy backgrounds
2. **Glow layer**
   - thicker gradient (e.g. 10px to 30px depending on danger)
   - use additive blending (`globalCompositeOperation = "lighter"`)
3. **Core line**
   - 1–2px bright line
   - mostly white (or tinted) and animated with pulse
4. **Moving scan highlights**
   - several short segments moving horizontally along the line
   - segment count and speed increase with danger
5. **Critical sparks** (only when danger high)
   - small points / micro arcs (random short-lived particles)
   - only when danger > 0.75

### Color / Style
- Main color should be configurable (cyan or magenta-tinted white).
- Default: cyan-ish `rgb(120,220,255)` and white core.
- No star shapes, no large flares.
- No external heavy glow that goes too far outside the band.

---

## Animation Behavior
We want 3 stages:
### Safe (danger < 0.3)
- subtle laser
- slow scan segments
- minimal pulse

### Warning (0.3 <= danger < 0.7)
- increased brightness
- scan speed increases
- visible pulse (smooth, not blinking)

### Critical (danger >= 0.7)
- stronger pulse
- glow thickness increases
- optional slight y jitter (0.5–1px) to feel unstable
- sparks appear on the laser band

---

## API / Integration
Implement a function:

```js
/**
 * Draws the death line laser barrier.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} y - death line y coordinate
 * @param {number} width - playfield width
 * @param {number} timeSec - current time in seconds (or ms, but consistent)
 * @param {number} danger - normalized 0..1
 * @param {{r:number,g:number,b:number}} [color] - optional base tint
 */
function drawLaserBarrier(ctx, y, width, timeSec, danger, color)
```

The function must:
- draw all layers described above
- be self-contained
- not modify global ctx state permanently (use `save()` / `restore()`)

---

## Performance Constraints
- Should run at 60fps on mid devices.
- Avoid per-frame allocations where possible.
- Avoid expensive shadowBlur on large areas.
- Prefer gradients + few strokes.
- Sparks count should be small and scaled with danger.

---

## Optional Enhancement (Micro-shake)
If implemented, do NOT shake the UI.
Only shake the playfield rendering (glass container + pieces).
Shake should be short pulses (0.1s) and low amplitude (max 2px) when danger > 0.7.
But this is optional; main focus is the laser itself.

---

## Acceptance Criteria
- Laser is clearly visible at all times against space background and glass pieces.
- Visual intensity increases as stack approaches death line.
- No obvious blinking; uses pulse + scan segments.
- Works without sprites.
- Clean code, easy to tune (line thickness, band height, colors, thresholds).
- Uses danger parameter to drive all intensity.

---

## Notes
- If the engine has a known playfield X offset, draw from x=0 to x=width inside the playfield layer.
- If using devicePixelRatio scaling, ensure coordinates match scaled canvas.
