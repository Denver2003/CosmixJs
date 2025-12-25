# UI Layout Spec (Prototype HUD) — Copy/Paste for Codex

> Goal: keep the playfield максимально чистым (особенно нижняя треть + зона пузырей), а весь HUD вынести в безопасные зоны: верх экрана + бортики стакана + нижний бортик.

---

## ✅ High-level rules

1. **No interactive UI inside the playfield** (внутри стакана), кроме самих пузырей/объектов игры.  
2. **Top HUD** (очки/монеты/пауза) — **outside** tank bounds, фиксировано к экрану.  
3. **Left border of tank** — **Cosmometer/thermometer** is embedded **into the tank border** (не отдельная колонка рядом).  
4. **Right side** — бонус-кнопки **outside tank**, but aligned to tank (не перекрывают стакан).  
5. **Bottom border of tank** — Level + progress is embedded **into the bottom frame** of the tank.

---

## 📐 Coordinate assumptions

- Screen origin: `(0,0)` top-left.
- Use **safe-area insets** for iOS.
- Tank (playfield container) has:
  - `tankFrame`: CGRect inside the screen with left/right borders and bottom border.
  - Inside tank, physics objects & bubbles live.
- All HUD is relative either to `screenSafeArea` or `tankFrame`.

---

## 🧭 Schematic layout (ASCII)

```
┌───────────────────────────────────────────────┐  ← Safe Area Top
│  SCORE                           COINS  PAUSE │  ← Top HUD (outside tank)
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │▌                                        │  │
│  │▌   (gameplay area / falling shapes)     │  │
│  │▌                                        │  │
│  │▌                     [BONUS 1]          │  │
│  │▌                     [BONUS 2]          │  │
│  │▌                     [BONUS 3]          │  │
│  │▌                                        │  │
│  │▌   (bubble tap zone ≈ above lower 1/3)  │  │
│  │▌                                        │  │
│  └───────────[ LVL 9  ███████░░░  16/37 ]──┘  │  ← Progress embedded in bottom border
└───────────────────────────────────────────────┘
   ↑
   └─ Left tank border contains Cosmometer (thermometer) embedded
```

Legend:
- `▌` = **Left tank border** with embedded **Cosmometer**
- BONUS buttons are **outside tank**, aligned to tank right edge.

---

## 🧩 UI Elements (what/where/how)

### 1) **Top HUD (outside tank)**

#### A) Score
- **Anchor:** `screenSafeArea.topLeft`
- **Position:** top-left
- **Content:**
  - Large number (e.g. `12450`)
  - Optional small label `SCORE`
- **Sizing:**
  - number font: `28–34`
  - label font: `10–12`
- **Hit-test:** none (display-only)

#### B) Coins
- **Anchor:** `screenSafeArea.topRight` (to the left of Pause)
- **Content:** `coinIcon + value`
- **Sizing:**
  - font: `16–18`
  - icon: `18–20`
- **Hit-test:** optional (open shop), but can be display-only.

#### C) Pause/Menu
- **Anchor:** `screenSafeArea.topRight`
- **Hit area:** at least `44x44`
- **Icon:** `⏸` or `☰`
- **Behavior:** pauses gameplay / opens menu.

**Recommended horizontal row order (right side):**
`[COINS]  [PAUSE]`

---

### 2) **Cosmometer / Thermometer (embedded in LEFT tank border)**

> Requirement: "вместить в левый бортик" — meaning: it is drawn/placed **inside the border thickness**, not taking extra space outside the tank.

#### Placement
- **Anchor:** `tankFrame.leftBorderRect` (a rect representing the left border thickness)
- **Vertical position:** centered vertically in the tank.
- **Height:** `35–45%` of `tankFrame.height`
- **Width:** match border thickness (or slightly inset), typically `10–14pt` visible.

#### Visual design
- A vertical bar with 3 segments (levels):
  - Level 1: `x1`
  - Level 2: `x2`
  - Level 3: `x3`
- Prefer **no text** always visible; instead:
  - show small `x1/x2/x3` badge on level change (1 sec)
  - or keep tiny labels **inside** the border near segment markers.

#### Interaction
- Display-only.
- On level-up:
  - flash / pulse the bar
  - show floating `x2` / `x3` label near the bar.

---

### 3) **Bonus buttons (3 buttons on the RIGHT, outside tank)**

#### Placement
- **Anchor:** `tankFrame.topRight` with an offset **outside** tank.
- **Vertical location:** start slightly above middle (`tankFrame.midY - 0.15*h`)
- Stack vertically: Bonus1, Bonus2, Bonus3
- **Button size:** `44–52pt` (recommend 48)
- **Spacing:** `10–14pt`

#### Safety margin (important)
- Keep a gap between tank right edge and buttons:
  - `touchGap = 12–16pt`
- This prevents accidental hits during swipes inside tank.

---

### 4) **Level + Progress (embedded in BOTTOM tank border)**

> Requirement: "левел + прогресс в нижний бортик" — place the progress bar **within** the bottom frame area of the tank, not overlapping physics area.

#### Placement
- **Anchor:** `tankFrame.bottomBorderRect` (the bottom border thickness rect)
- Center horizontally.
- **Layout:**
  - Left: `LVL 9`
  - Center: progress bar
  - Right: `16/37`
- **Progress bar:**
  - width: `55–65%` of tank width
  - height: `8–10pt`
  - corner radius: `6–8`

#### Text
- Font: `12–14`
- Ensure contrast with background.

---

## 🫧 Bubble Tap Zone constraints (gameplay input)

- Bubble tap zone appears around: `tankFrame.height * 0.60 ... 0.82` (пример)
- Keep **all UI** out of this region **inside the tank**.
- Only bubbles and gameplay objects should be there.

---

## 🔧 Implementation notes (Codex-friendly)

### Define frames
1. Compute `tankFrame` (full tank including borders).
2. Define border rects:
   - `leftBorderRect`
   - `bottomBorderRect`
3. Place HUD elements:
   - Top HUD relative to safe area.
   - Thermometer inside `leftBorderRect`.
   - Progress inside `bottomBorderRect`.
   - Bonus buttons to the right of `tankFrame.maxX + touchGap`.

### Z-order
- Gameplay (shapes, bubbles) below.
- HUD always above, but avoid overlap with interactive zones.

### Sizing defaults (good starting point)
- `pauseButtonSize = 44`
- `bonusButtonSize = 48`
- `hudTopPadding = 12–16`
- `touchGap = 12–16`
- `thermoWidthVisible = 12`
- `progressBarHeight = 9`

---

## ✅ Checklist

- [ ] Score visible top-left
- [ ] Coins + Pause visible top-right
- [ ] Thermometer fits **inside** left border thickness (no extra column)
- [ ] Bonus buttons outside tank with 12–16pt gap
- [ ] Level+Progress inside bottom border (not inside physics area)
- [ ] Bubble tap zone has no UI overlap

---

If you want, I can also provide a **SwiftUI / UIKit layout pseudo-code** block matching this spec (with frames + constraints). 
