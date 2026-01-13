# UI Redesign Spec — Main Menu & Modal Screens (Space Capsule Style)

## Goal
Сделать главное меню и окна (shop/upgrades/settings/leaderboard/pause) визуально цельными с игровым полем: меню должно восприниматься как “капсула/стакан в режиме ожидания”, а не отдельный экран.

Ключевая идея:
**Главное меню = то же игровое поле (капсула), но без физики, с декоративной сценой и UI внутри.**

Приоритеты:
1) Визуальная связь с игровым полем (100%).
2) Читабельность на мобилках/Яндекс Игры.
3) Минимальный риск поломки текущих экранов: reuse existing assets/containers.
4) Компонентный подход: единые UI-элементы для всех окон.

---

## Current Baseline (What we already have)
- Есть готовый стиль игрового поля: стеклянная капсула, неоновая рамка, HUD сверху, космос внутри.
- Есть 2+ набора “рамок фигур” (толстый стеклянный и thin).
- Есть концепция героев/лиц, но меню пока “плоское” и не привязано к капсуле.

---

## New Main Menu — Layout Overview
**Main Menu renders INSIDE the same capsule container as gameplay field.**
Внешний фон экрана — просто тёмный космос с лёгкой виньеткой.

### Structure (inside capsule)
- Top HUD strip (как в игре, но без pause).
- Play Area (внутреннее поле с космосом + декоративные фигуры).
- Primary CTA (PLAY) — внутри поля.
- Bottom Control Panel — внутри поля, над нижним модулем капсулы.

---

## Sizing / Aspect Ratio
Меню должно использовать **точно те же размеры контейнера**, что и игровое поле.

### Implementation approach
- Есть единый компонент/класс `CapsuleContainer` (или аналог), который уже используется в геймплее.
- Главное меню использует тот же контейнер и тот же масштаб/пивот.
- Никаких “full-screen UI blocks” поверх всего экрана, кроме мягкого фона.

### Responsive rules
- `capsuleWidth` = min(viewportWidth, viewportHeight * 0.55) (примерно, подбирается по текущему).
- `capsuleHeight` = `capsuleWidth * (gameFieldAspect)` (использовать текущее соотношение поля).
- Все внутренние отступы и элементы привязывать к `capsuleHeight` (проценты ниже).

---

## Main Menu — Detailed Layout (percent of capsuleHeight)

### 1) Top HUD (≈ 12% of capsuleHeight)
**Purpose:** continuity with gameplay HUD.

Elements:
- Left: Profile chip: avatar circle + nickname (“Guest”)
- Center: Game logo/title (вместо “HOME”)
- Right: Two chips: Coins, Best

Guidelines:
- Chips glass-like (semi-transparent), minimal glow.
- Text white; icons optional (coin icon, trophy).
- No pause button in menu.

Suggested positioning:
- HUD container top padding: 2–3% of capsuleHeight
- Chip height: 5–6% of capsuleHeight
- Horizontal spacing: 2% of capsuleWidth

### 2) Inner Play Area background (≈ 55–60% of capsuleHeight)
**Purpose:** make menu feel like game is already “loaded”.

Content:
- Same starfield as gameplay.
- Subtle moving stars/parallax (optional).
- Decorative pile of 2–4 figures near bottom (static sprites, no physics).
- One “incoming” figure near top center (very slow bobbing).

Rules:
- No clutter: keep opacity 50–70% of real gameplay saturation.
- Maintain the “danger line” (thin horizontal line) at the same Y position as gameplay (optional but good for continuity).

### 3) Primary CTA — PLAY button (≈ 15–18% zone, centered around 62–70% height)
**Purpose:** the main hero element.

Button style:
- Glass capsule button with a thin sci-fi frame style (choose one style: Prism Edge / Pulse Nodes / Laser Cut).
- Soft glow (blue/cyan) but not overpowering.
- Subtle highlight streak (gloss).
- On hover/press: glow intensity +10–15%, slight scale (1.02).

Placement:
- Centered horizontally.
- Vertical position: around 65% of capsuleHeight.
- Button width: 55–65% of capsuleWidth.
- Button height: 9–11% of capsuleHeight.

Text:
- “PLAY” (bold, white).
- Subtext below: “Tap • Stack • Combo” in smaller, muted white (60–70% opacity).
  *No long sentence; quick scan for 10–15 yo.*

### 4) Bottom Control Panel (≈ 10–12% of capsuleHeight, anchored above bottom module)
**Purpose:** navigation actions within same design language.

Panel:
- Semi-transparent glass bar inside capsule, above the bottom bezel.
- 3–4 icon buttons (recommended 4): Shop, Upgrades, Skins, Settings.
- Use icon-only or icon+tiny label.

Layout:
- Panel width: 80–90% of capsuleWidth.
- Panel height: 8–10% of capsuleHeight.
- Bottom offset: 3–4% of capsuleHeight from inner bottom.

Buttons:
- Circular or rounded-square icon holders.
- Thin frame style consistent with menu frame style.
- Press animation: scale 0.96 + quick glow pulse.

---

## Visual Style Guidelines (UI)
### Color palette
- Primary: white text (#FFFFFF)
- Accent glow: soft cyan/blue (moderate), avoid oversaturation.
- Glass: translucent blue-gray (10–20% opacity) with blur if supported.

### Do / Don’t
DO:
- Keep glows soft and controlled.
- Use consistent corner radii.
- Use 1–2 highlights only, no excessive particles.

DON’T:
- Add dark/black internal strokes inside frames.
- Add ground shadows under frames (assets must be clean).
- Overuse bright cyan everywhere (only on accents).

---

## Shared Components (for other windows)
Define reusable UI components:

1) `GlassPanel`
- Rounded rectangle, translucent fill, subtle inner highlight.
- Optional thin frame overlay.

2) `HudChip`
- Small pill with icon + value.
- Same as coins/best.

3) `IconButton`
- Small circle/rounded-square.
- Frame style overlay + press animation.

4) `PrimaryButton`
- Used for PLAY/CONFIRM.
- Larger, glassy, consistent.

---

## Modal Windows (Shop / Upgrades / Settings / Leaders / Pause)
All windows should appear as **modal inside capsule**, not separate full-screen pages.

### Modal behavior
- Dim background inside capsule slightly (dark overlay 25–35%).
- Modal card centered inside capsule (glass panel).

### Modal sizing
- Width: 80–90% of capsuleWidth
- Height: 55–70% of capsuleHeight (depending on content)
- Title row at top with close button.

### Navigation
- Back/Close in top-right of modal.
- Keep HUD chips optionally visible or hide them per modal.

---

## Animation & Micro-interactions
### Main Menu idle
- Stars: very slow drift (optional).
- Decorative figures: tiny bob (1–2px) or none.
- Mascot (optional): blink every 2–5s; small “breathing” scale.

### Buttons
- Hover (desktop): glow up + slight scale.
- Press: quick scale down + “click” sound.

### Sound (optional but recommended)
- Soft sci-fi click for UI.
- “Whoosh” for opening modals.
- Subtle ambient hum in menu.

---

## Integration Plan (Do not break existing screens)
### Minimal-risk approach
- Keep existing gameplay rendering intact.
- Create `MenuMode` that uses:
  - same `CapsuleContainer`
  - same background assets
  - disables physics and spawner
  - renders static decorative shapes instead

### Suggested architecture
- `AppState = MENU | GAMEPLAY | MODAL_*`
- `CapsuleContainer` always mounted
- Content changes based on state:
  - MENU: `MenuSceneRenderer`
  - GAMEPLAY: `GameplayRenderer`
  - MODAL: `ModalOverlayRenderer` on top of MENU or GAMEPLAY

### Asset reuse
- Reuse capsule frame, HUD style from gameplay.
- Use existing shape outlines and thin frames as UI accents.
- Decorative shapes can reuse existing sprites (lower opacity).

---

## Acceptance Criteria
Menu should:
- match gameplay capsule size exactly
- feel like part of the same world
- have one clear CTA (PLAY)
- have clean bottom navigation inside capsule
- avoid dark inner strokes and ground shadows on frames
- be readable on small screens

---

## Open Decisions (need confirmation)
1) Which frame style is the “signature” for UI components?
   - Selected: Prism Edge
2) Bottom nav: 3 buttons or 4 buttons (recommended 4: Shop/Upgrades/Skins/Settings).
   - Selected: 3 buttons (Shop/Leaders/Settings)
3) Do we show mascot character in menu or keep purely geometric?
   - Pending
4) Modals: keep DOM overlays or render inside capsule via canvas?
   - Selected: Move modals to canvas (test transitions)
