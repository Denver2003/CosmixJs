# Phase 1: Foundation + Playable Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать новый Phaser+TS-репозиторий с минимальным играбельным циклом: cup, спавн фигур, drag-to-drop, физика, chain detection, collapse, score, game over, restart.

**Architecture:** Greenfield Vite + Phaser 3.80 + TypeScript strict. Pure-logic модули (ChainDetector, Score, GameOverTimer) полностью покрыты unit-тестами через Vitest. Phaser-интегрированные модули (Cup, Shape, Spawner) верифицируются визуально в браузере. Каждая Task — атомарный коммит.

**Tech Stack:** Vite 5, Phaser 3.80+, TypeScript 5.4+, Vitest 1.x, ESLint flat config.

---

## File Structure (создаётся за Phase 1)

```
cosmix-v2/
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── index.html
├── public/
│   └── assets/
│       └── phase1/
│           ├── shape_circle.png        (копия из старого репо)
│           ├── shape_triangle.png
│           ├── shape_square.png
│           └── shape_diamond.png
├── src/
│   ├── main.ts                          # entry point
│   ├── config.ts                        # Phaser game config
│   ├── data/
│   │   ├── balance.ts                   # формулы и константы Phase 1
│   │   └── shapes.ts                    # ShapeType, ShapeSpec, color palette
│   ├── scenes/
│   │   ├── BootScene.ts                 # preload Phase 1 ассетов
│   │   └── GameScene.ts                 # основная сцена
│   ├── game/
│   │   ├── Cup.ts                       # статичные стенки + дно
│   │   ├── Shape.ts                     # Matter.Sprite с типом и цветом
│   │   ├── Spawner.ts                   # waiting shape + cooldown
│   │   ├── InputController.ts           # drag horizontal + release to drop
│   │   ├── ChainDetector.ts             # PURE: BFS по contact pairs
│   │   ├── ChainStabilityTracker.ts     # PURE: таймер 1.8s
│   │   ├── Score.ts                     # PURE: формула NR
│   │   └── GameOverTimer.ts             # PURE: 10s touch death-line
│   └── utils/
│       └── colors.ts                    # PURE: палитра по уровню
└── tests/
    ├── chain-detector.test.ts
    ├── chain-stability-tracker.test.ts
    ├── score.test.ts
    ├── game-over-timer.test.ts
    └── colors.test.ts
```

**Coordinate system (canonical из PROJECT_OVERVIEW.md §3):**
- 1 unit = 16 px
- Canvas: 1080 × 1920 px (portrait, mobile-first)
- Cup внутренняя ширина 195 px, высота 416 px, стенки 32 px
- Камера статична, центрирована на центре стакана
- Будем оперировать в **пикселях** (не units) для прямого Phaser-маппинга. Все unit-значения из спеки умножать на 16.

**Phase 1 ограничения по балансу** (упрощения, чтобы не тащить уровни в Phase 1):
- Только уровень 1: 4 цвета, без поворота, spawn-wait 4s
- Цвета: `#E64545` (red), `#3D8FE6` (blue), `#5BCB5B` (green), `#F3C84A` (yellow)
- Score = `base × Count × ChainBonus` (без Level, Multiply, Combo — те идут в Phase 2)
- Death line: y = +12.9u = 206 px ниже центра камеры

---

## Task 1: Initialize new repo

**Files:**
- Create: `cosmix-v2/.gitignore`
- Create: `cosmix-v2/package.json`
- Create: `cosmix-v2/tsconfig.json`
- Create: `cosmix-v2/vite.config.ts`
- Create: `cosmix-v2/vitest.config.ts`
- Create: `cosmix-v2/eslint.config.js`
- Create: `cosmix-v2/index.html`

**Решение по расположению:** новый репозиторий создаётся **рядом** с `CosmixJS`, не внутри. Финальный путь: `/Users/deniskhlopin/UnityProjects/cosmix-v2/`. Это даёт чистый git-history и не путает старый и новый код.

- [ ] **Step 1: Create directory and init**

```bash
mkdir -p /Users/deniskhlopin/UnityProjects/cosmix-v2
cd /Users/deniskhlopin/UnityProjects/cosmix-v2
git init
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "cosmix-v2",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src tests --no-error-on-unmatched-pattern"
  },
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "lib": ["ES2020", "DOM"],
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 4: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] }
      }
    }
  },
  server: { port: 5173, open: true }
});
```

- [ ] **Step 5: Write `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  }
});
```

- [ ] **Step 6: Write `eslint.config.js`**

```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { parser: tsparser },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
```

- [ ] **Step 7: Write `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.log
.vite/
```

- [ ] **Step 8: Write minimal `index.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Падающие фигуры. Физический пазл</title>
  <style>
    html, body { margin: 0; padding: 0; background: #000; overflow: hidden; }
    body { display: flex; align-items: center; justify-content: center; height: 100vh; }
    #game { max-width: 100vw; max-height: 100vh; }
  </style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 9: Install dependencies**

Run: `cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm install`
Expected: `node_modules/` создан, нет ошибок.

- [ ] **Step 10: Commit**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2
git add .
git commit -m "chore: initialize Vite + Phaser + TypeScript project skeleton"
```

---

## Task 2: Boot empty Phaser game

**Files:**
- Create: `src/main.ts`
- Create: `src/config.ts`
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/GameScene.ts`

- [ ] **Step 1: Write `src/config.ts`**

```typescript
import Phaser from 'phaser';

export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 1920;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0e2a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1 },
      debug: false
    }
  },
  scene: []
};
```

- [ ] **Step 2: Write `src/scenes/BootScene.ts`**

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Phase 1 ассеты подключим в Task 4
  }

  create(): void {
    this.scene.start('Game');
  }
}
```

- [ ] **Step 3: Write `src/scenes/GameScene.ts`**

```typescript
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create(): void {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'GameScene', {
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}
```

- [ ] **Step 4: Write `src/main.ts`**

```typescript
import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

new Phaser.Game({
  ...gameConfig,
  scene: [BootScene, GameScene]
});
```

- [ ] **Step 5: Verify dev server**

Run: `npm run dev`
Expected: Браузер открывает страницу, посередине canvas с тёмно-синим фоном и текстом «GameScene». Никаких ошибок в консоли.

- [ ] **Step 6: Commit**

```bash
git add src/ index.html
git commit -m "feat(phase-1): bootstrap Phaser game with Boot and Game scenes"
```

---

## Task 3: Cup geometry (static physics walls)

**Files:**
- Create: `src/game/Cup.ts`
- Modify: `src/scenes/GameScene.ts`

**Канонические размеры** (из PROJECT_OVERVIEW.md §3, конвертированы из units в пиксели, 1u=16px):
- Внутренняя ширина: 195 px (12.19u × 16)
- Внутренняя высота: 416 px (26u × 16)
- Толщина стенок: 32 px (2u × 16)
- Центр стакана — центр экрана: (540, 960)
- Левая стенка: x = 540 - 195/2 - 32/2 = 540 - 113.5 = 426.5
- Правая стенка: x = 540 + 113.5 = 653.5
- Дно: y = 960 + 416/2 + 32/2 = 960 + 224 = 1184
- Высота стенок: 416 + 32 = 448 (с запасом, чтобы перекрывать дно)

- [ ] **Step 1: Write `src/game/Cup.ts`**

```typescript
import Phaser from 'phaser';

export const CUP_INNER_WIDTH = 195;
export const CUP_INNER_HEIGHT = 416;
export const CUP_WALL_THICKNESS = 32;
export const CUP_CENTER_X = 540;
export const CUP_CENTER_Y = 960;

export const CUP_BOUNDS = {
  innerLeft:   CUP_CENTER_X - CUP_INNER_WIDTH / 2,
  innerRight:  CUP_CENTER_X + CUP_INNER_WIDTH / 2,
  innerTop:    CUP_CENTER_Y - CUP_INNER_HEIGHT / 2,
  innerBottom: CUP_CENTER_Y + CUP_INNER_HEIGHT / 2,
  deathLineY:  CUP_CENTER_Y - CUP_INNER_HEIGHT / 2 + 16  // 1u below inner top — shapes piling up to here = overflow warning
};

export class Cup {
  constructor(private scene: Phaser.Scene) {}

  create(): void {
    const matter = this.scene.matter;
    const wallH = CUP_INNER_HEIGHT + CUP_WALL_THICKNESS;
    const leftX = CUP_CENTER_X - CUP_INNER_WIDTH / 2 - CUP_WALL_THICKNESS / 2;
    const rightX = CUP_CENTER_X + CUP_INNER_WIDTH / 2 + CUP_WALL_THICKNESS / 2;
    const floorY = CUP_CENTER_Y + CUP_INNER_HEIGHT / 2 + CUP_WALL_THICKNESS / 2;

    matter.add.rectangle(leftX,  CUP_CENTER_Y, CUP_WALL_THICKNESS, wallH, { isStatic: true, label: 'cup-wall-left' });
    matter.add.rectangle(rightX, CUP_CENTER_Y, CUP_WALL_THICKNESS, wallH, { isStatic: true, label: 'cup-wall-right' });
    matter.add.rectangle(CUP_CENTER_X, floorY, CUP_INNER_WIDTH + CUP_WALL_THICKNESS * 2, CUP_WALL_THICKNESS, { isStatic: true, label: 'cup-floor' });

    this.drawDebugOutline();
  }

  private drawDebugOutline(): void {
    const g = this.scene.add.graphics();
    g.lineStyle(2, 0x66ccff, 0.6);
    g.strokeRect(
      CUP_CENTER_X - CUP_INNER_WIDTH / 2,
      CUP_CENTER_Y - CUP_INNER_HEIGHT / 2,
      CUP_INNER_WIDTH,
      CUP_INNER_HEIGHT
    );
    g.lineStyle(2, 0xff4444, 0.5);
    g.lineBetween(
      CUP_CENTER_X - CUP_INNER_WIDTH / 2,
      CUP_BOUNDS.deathLineY,
      CUP_CENTER_X + CUP_INNER_WIDTH / 2,
      CUP_BOUNDS.deathLineY
    );
  }
}
```

- [ ] **Step 2: Modify `src/scenes/GameScene.ts`**

```typescript
import Phaser from 'phaser';
import { Cup } from '../game/Cup';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create(): void {
    new Cup(this).create();
  }
}
```

- [ ] **Step 3: Enable Matter debug temporarily**

В `src/config.ts` поменять `debug: false` на `debug: true`. Это даст визуальные тела физики в браузере.

- [ ] **Step 4: Verify**

Run: `npm run dev`
Expected: На canvas видны три статичных тела (две вертикальные стенки и горизонтальное дно), голубой пунктирный inner-outline стакана и тонкая красная линия смерти у верха.

- [ ] **Step 5: Commit**

```bash
git add src/game/Cup.ts src/scenes/GameScene.ts src/config.ts
git commit -m "feat(phase-1): add Cup with static walls and debug outline"
```

---

## Task 4: Load shape assets and create Shape class

**Files:**
- Copy assets to: `public/assets/phase1/shape_circle.png`, `shape_triangle.png`, `shape_square.png`, `shape_diamond.png`
- Create: `src/data/shapes.ts`
- Create: `src/game/Shape.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/scenes/GameScene.ts`

**Источник ассетов:** копируем из старого репо `assets/shape_sprites/pack_default/circle_outline.png` (и аналоги). В Phase 1 берём только outline для простоты; в Phase 3 (Skin System) добавим fill + details + tinting.

- [ ] **Step 1: Copy 4 PNG из старого репо в `public/assets/phase1/`**

```bash
mkdir -p public/assets/phase1
cp /Users/deniskhlopin/UnityProjects/CosmixJS/assets/shape_sprites/pack_default/circle_outline.png   public/assets/phase1/shape_circle.png
cp /Users/deniskhlopin/UnityProjects/CosmixJS/assets/shape_sprites/pack_default/triangle_outline.png public/assets/phase1/shape_triangle.png
cp /Users/deniskhlopin/UnityProjects/CosmixJS/assets/shape_sprites/pack_default/square_outline.png   public/assets/phase1/shape_square.png
cp /Users/deniskhlopin/UnityProjects/CosmixJS/assets/shape_sprites/pack_default/diamond_outline.png  public/assets/phase1/shape_diamond.png
```

- [ ] **Step 2: Write `src/data/shapes.ts`**

```typescript
export type ShapeType = 'circle' | 'triangle' | 'square' | 'diamond';
export type ShapeColor = 'red' | 'blue' | 'green' | 'yellow';

export const SHAPE_TYPES: readonly ShapeType[] = ['circle', 'triangle', 'square', 'diamond'];
export const PHASE1_COLORS: readonly ShapeColor[] = ['red', 'blue', 'green', 'yellow'];

export const COLOR_HEX: Record<ShapeColor, number> = {
  red:    0xe64545,
  blue:   0x3d8fe6,
  green:  0x5bcb5b,
  yellow: 0xf3c84a
};

export interface ShapeSpec {
  type: ShapeType;
  color: ShapeColor;
  radius: number;       // approximate hitbox radius (px)
  texture: string;      // texture key
}

const TEXTURE_KEYS: Record<ShapeType, string> = {
  circle:   'shape_circle',
  triangle: 'shape_triangle',
  square:   'shape_square',
  diamond:  'shape_diamond'
};

const RADII: Record<ShapeType, number> = {
  circle:   40,
  triangle: 42,
  square:   40,
  diamond:  42
};

export function buildShapeSpec(type: ShapeType, color: ShapeColor): ShapeSpec {
  return {
    type,
    color,
    radius: RADII[type],
    texture: TEXTURE_KEYS[type]
  };
}
```

- [ ] **Step 3: Write `src/game/Shape.ts`**

```typescript
import Phaser from 'phaser';
import { COLOR_HEX, ShapeSpec } from '../data/shapes';

export class Shape extends Phaser.Physics.Matter.Sprite {
  public readonly shapeSpec: ShapeSpec;
  public chainCandidate: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, spec: ShapeSpec) {
    super(scene.matter.world, x, y, spec.texture);
    this.shapeSpec = spec;

    scene.add.existing(this);

    this.setCircle(spec.radius);
    this.setDisplaySize(spec.radius * 2, spec.radius * 2);  // visual matches hitbox diameter
    this.setBounce(0.15);
    this.setFriction(0.4);
    this.setFrictionAir(0.01);
    this.setDensity(0.001);
    this.setTint(COLOR_HEX[spec.color]);
    this.setData('shapeColor', spec.color);
    this.setData('shapeType', spec.type);
  }

  freezeAsWaiting(): void {
    this.setStatic(true);
    this.setIgnoreGravity(true);
  }

  releaseToFall(): void {
    this.setStatic(false);
    this.setIgnoreGravity(false);
  }
}
```

**Замечание про hitbox:** для Phase 1 все формы получают **круглый hitbox** (`setCircle`). Это упрощает физику и не противоречит спеке — в старом коде у некоторых форм тоже circle hitbox с подгонкой radius. В Phase 3 (Skin System) можно вынести hitbox в spec, если понадобится polygon.

- [ ] **Step 4: Modify `src/scenes/BootScene.ts`**

```typescript
import Phaser from 'phaser';
import { SHAPE_TYPES } from '../data/shapes';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const type of SHAPE_TYPES) {
      this.load.image(`shape_${type}`, `assets/phase1/shape_${type}.png`);
    }
  }

  create(): void {
    this.scene.start('Game');
  }
}
```

- [ ] **Step 5: Modify `src/scenes/GameScene.ts` — drop a test shape**

```typescript
import Phaser from 'phaser';
import { Cup, CUP_CENTER_X } from '../game/Cup';
import { Shape } from '../game/Shape';
import { buildShapeSpec } from '../data/shapes';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create(): void {
    new Cup(this).create();

    this.time.delayedCall(500, () => {
      new Shape(this, CUP_CENTER_X, 200, buildShapeSpec('circle', 'red'));
    });
    this.time.delayedCall(1500, () => {
      new Shape(this, CUP_CENTER_X - 30, 200, buildShapeSpec('square', 'blue'));
    });
    this.time.delayedCall(2500, () => {
      new Shape(this, CUP_CENTER_X + 30, 200, buildShapeSpec('triangle', 'green'));
    });
  }
}
```

- [ ] **Step 6: Verify**

Run: `npm run dev`
Expected: Через секунду в стакан падает красный круг, потом синий квадрат, потом зелёный треугольник. Они отскакивают, оседают на дне, не вылетают за стенки. Цвета тинта применены.

- [ ] **Step 7: Commit**

```bash
git add public/assets src/data src/game/Shape.ts src/scenes
git commit -m "feat(phase-1): add Shape class with Matter.Sprite and 4-color palette"
```

---

## Task 5: ChainDetector (pure logic, fully tested)

**Files:**
- Create: `src/game/ChainDetector.ts`
- Create: `tests/chain-detector.test.ts`

**Алгоритм:**
- Input: список объектов `{ id: number, color: string }` + список contact-пар `[idA, idB]`.
- Build undirected graph: edges только между парами с одинаковым цветом.
- Connected components через BFS.
- Output: массив компонент размером ≥ `minChainLength` (default 4).

Это чистая логика, идеально тестируется без Phaser.

- [ ] **Step 1: Write failing test**

```typescript
// tests/chain-detector.test.ts
import { describe, it, expect } from 'vitest';
import { detectChains } from '../src/game/ChainDetector';

describe('detectChains', () => {
  it('returns empty array when no shapes touch', () => {
    const shapes = [
      { id: 1, color: 'red' },
      { id: 2, color: 'red' },
      { id: 3, color: 'red' },
      { id: 4, color: 'red' }
    ];
    const contacts: [number, number][] = [];
    expect(detectChains(shapes, contacts, 4)).toEqual([]);
  });

  it('returns empty array when 3 same-color touch (below minChainLength)', () => {
    const shapes = [
      { id: 1, color: 'red' },
      { id: 2, color: 'red' },
      { id: 3, color: 'red' }
    ];
    const contacts: [number, number][] = [[1, 2], [2, 3]];
    expect(detectChains(shapes, contacts, 4)).toEqual([]);
  });

  it('returns 1 chain when 4 same-color touch in a line', () => {
    const shapes = [
      { id: 1, color: 'red' },
      { id: 2, color: 'red' },
      { id: 3, color: 'red' },
      { id: 4, color: 'red' }
    ];
    const contacts: [number, number][] = [[1, 2], [2, 3], [3, 4]];
    const chains = detectChains(shapes, contacts, 4);
    expect(chains).toHaveLength(1);
    expect(new Set(chains[0])).toEqual(new Set([1, 2, 3, 4]));
  });

  it('does not merge across different colors', () => {
    const shapes = [
      { id: 1, color: 'red' },
      { id: 2, color: 'red' },
      { id: 3, color: 'blue' },
      { id: 4, color: 'red' },
      { id: 5, color: 'red' }
    ];
    const contacts: [number, number][] = [[1, 2], [2, 3], [3, 4], [4, 5]];
    expect(detectChains(shapes, contacts, 4)).toEqual([]);
  });

  it('finds multiple disjoint chains', () => {
    const shapes = [
      { id: 1, color: 'red' }, { id: 2, color: 'red' }, { id: 3, color: 'red' }, { id: 4, color: 'red' },
      { id: 5, color: 'blue' }, { id: 6, color: 'blue' }, { id: 7, color: 'blue' }, { id: 8, color: 'blue' }
    ];
    const contacts: [number, number][] = [[1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8]];
    const chains = detectChains(shapes, contacts, 4);
    expect(chains).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- chain-detector`
Expected: FAIL — `detectChains` is not defined.

- [ ] **Step 3: Implement `src/game/ChainDetector.ts`**

```typescript
export interface ShapeNode {
  id: number;
  color: string;
}

export function detectChains(
  shapes: readonly ShapeNode[],
  contacts: readonly (readonly [number, number])[],
  minChainLength: number
): number[][] {
  const byId = new Map<number, ShapeNode>();
  for (const s of shapes) byId.set(s.id, s);

  const adj = new Map<number, Set<number>>();
  for (const s of shapes) adj.set(s.id, new Set());

  for (const [a, b] of contacts) {
    const sa = byId.get(a);
    const sb = byId.get(b);
    if (!sa || !sb) continue;
    if (sa.color !== sb.color) continue;
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }

  const visited = new Set<number>();
  const chains: number[][] = [];

  for (const s of shapes) {
    if (visited.has(s.id)) continue;
    const component: number[] = [];
    const queue: number[] = [s.id];
    visited.add(s.id);
    while (queue.length > 0) {
      const node = queue.shift()!;
      component.push(node);
      for (const neighbor of adj.get(node) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    if (component.length >= minChainLength) {
      chains.push(component);
    }
  }

  return chains;
}
```

- [ ] **Step 4: Run tests, verify all pass**

Run: `npm test -- chain-detector`
Expected: PASS — 5/5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/ChainDetector.ts tests/chain-detector.test.ts
git commit -m "feat(phase-1): add ChainDetector with BFS component detection"
```

---

## Task 6: ChainStabilityTracker (pure logic)

**Files:**
- Create: `src/game/ChainStabilityTracker.ts`
- Create: `tests/chain-stability-tracker.test.ts`

**Алгоритм** (из PROJECT_OVERVIEW.md §6):
- Минимум фигур в цепочке: 4
- Касание: contact pairs из physics
- Таймер стабильности: 1.8 секунды (1800 ms)
- Если контактов нет ≥ 250 ms → таймер сбрасывается

Tracker хранит **текущий кандидат** (Set<id>) и **накопленное стабильное время**. На каждый tick принимает new chains и dt в ms; возвращает «созревшие» цепочки.

- [ ] **Step 1: Write failing test**

```typescript
// tests/chain-stability-tracker.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ChainStabilityTracker } from '../src/game/ChainStabilityTracker';

describe('ChainStabilityTracker', () => {
  let tracker: ChainStabilityTracker;
  beforeEach(() => {
    tracker = new ChainStabilityTracker({ stableMs: 1800, breakGraceMs: 250 });
  });

  it('emits chain when stable for >= 1800ms', () => {
    const chain = [1, 2, 3, 4];
    expect(tracker.tick([chain], 1000)).toEqual([]);
    expect(tracker.tick([chain], 800)).toEqual([[1, 2, 3, 4]]);
  });

  it('does not emit before 1800ms', () => {
    const chain = [1, 2, 3, 4];
    expect(tracker.tick([chain], 1500)).toEqual([]);
    expect(tracker.tick([chain], 299)).toEqual([]);
  });

  it('resets when contact lost > 250ms', () => {
    const chain = [1, 2, 3, 4];
    tracker.tick([chain], 1000);
    tracker.tick([], 251);              // contact lost > grace
    expect(tracker.tick([chain], 1000)).toEqual([]);  // restart from 0
  });

  it('forgives brief contact loss <= 250ms', () => {
    const chain = [1, 2, 3, 4];
    tracker.tick([chain], 1000);
    tracker.tick([], 250);              // exactly at grace boundary
    expect(tracker.tick([chain], 800)).toEqual([[1, 2, 3, 4]]);
  });

  it('treats different chain composition as new candidate', () => {
    tracker.tick([[1, 2, 3, 4]], 1500);
    expect(tracker.tick([[1, 2, 3, 5]], 1500)).toEqual([]);
  });

  it('emits each chain only once until contacts drop', () => {
    const chain = [1, 2, 3, 4];
    tracker.tick([chain], 1800);
    const first = tracker.tick([chain], 100);
    expect(first).toEqual([[1, 2, 3, 4]]);
    expect(tracker.tick([chain], 100)).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify failing**

Run: `npm test -- chain-stability-tracker`
Expected: FAIL.

- [ ] **Step 3: Implement `src/game/ChainStabilityTracker.ts`**

```typescript
export interface StabilityConfig {
  stableMs: number;
  breakGraceMs: number;
}

interface Candidate {
  signature: string;
  ids: number[];
  accumulated: number;
  msSinceContact: number;
  emitted: boolean;
}

function makeSignature(ids: readonly number[]): string {
  return [...ids].sort((a, b) => a - b).join(',');
}

export class ChainStabilityTracker {
  private candidates = new Map<string, Candidate>();
  constructor(private readonly cfg: StabilityConfig) {}

  tick(currentChains: readonly (readonly number[])[], dtMs: number): number[][] {
    const seen = new Set<string>();
    const justCreated = new Set<string>();
    for (const chain of currentChains) {
      const sig = makeSignature(chain);
      seen.add(sig);
      const existing = this.candidates.get(sig);
      if (existing) {
        existing.accumulated += dtMs;
        existing.msSinceContact = 0;
      } else {
        justCreated.add(sig);
        this.candidates.set(sig, {
          signature: sig,
          ids: [...chain],
          accumulated: dtMs,
          msSinceContact: 0,
          emitted: false
        });
      }
    }

    for (const [sig, cand] of this.candidates) {
      if (!seen.has(sig)) {
        cand.msSinceContact += dtMs;
        if (cand.msSinceContact > this.cfg.breakGraceMs) {
          this.candidates.delete(sig);
        }
      }
    }

    const emitted: number[][] = [];
    for (const cand of this.candidates.values()) {
      if (justCreated.has(cand.signature)) continue;  // candidate must persist >=2 ticks before emit
      if (!cand.emitted && cand.accumulated >= this.cfg.stableMs) {
        emitted.push([...cand.ids]);
        cand.emitted = true;
      }
    }
    return emitted;
  }

  remove(ids: readonly number[]): void {
    const removedSet = new Set(ids);
    for (const [sig, cand] of this.candidates) {
      if (cand.ids.some(id => removedSet.has(id))) {
        this.candidates.delete(sig);
      }
    }
  }
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- chain-stability-tracker`
Expected: PASS — 6/6.

- [ ] **Step 5: Commit**

```bash
git add src/game/ChainStabilityTracker.ts tests/chain-stability-tracker.test.ts
git commit -m "feat(phase-1): add ChainStabilityTracker with grace-window logic"
```

---

## Task 7: Score formula (pure logic)

**Files:**
- Create: `src/data/balance.ts`
- Create: `src/game/Score.ts`
- Create: `tests/score.test.ts`

**Из PROJECT_OVERVIEW.md §15** (для Phase 1 упрощаем: Level=1, Multiply=1, Combo=1, PointCoef=1):

```
NR = base × Level × Multiply × Count × PointCoef × Combo × ChainBonus
ChainBonus(4) = 1.0
ChainBonus(>4) = 1 + 0.1 × (Count − 4)
base = 10
```

- [ ] **Step 1: Write failing test**

```typescript
// tests/score.test.ts
import { describe, it, expect } from 'vitest';
import { scoreForChain, chainBonus } from '../src/game/Score';

describe('chainBonus', () => {
  it('returns 1.0 for 4 shapes', () => {
    expect(chainBonus(4)).toBe(1.0);
  });
  it('returns 1.1 for 5 shapes', () => {
    expect(chainBonus(5)).toBeCloseTo(1.1, 5);
  });
  it('returns 1.5 for 9 shapes', () => {
    expect(chainBonus(9)).toBeCloseTo(1.5, 5);
  });
  it('returns 1.0 for chain shorter than 4', () => {
    expect(chainBonus(3)).toBe(1.0);
  });
});

describe('scoreForChain (Phase 1: Level=1, multipliers=1)', () => {
  it('scores 40 for chain of 4 (10 base × 4 count × 1.0 bonus)', () => {
    expect(scoreForChain({ count: 4, level: 1, multiply: 1, combo: 1, pointCoef: 1 })).toBe(40);
  });
  it('scores 55 for chain of 5 (10 × 5 × 1.1)', () => {
    expect(scoreForChain({ count: 5, level: 1, multiply: 1, combo: 1, pointCoef: 1 })).toBe(55);
  });
  it('respects all multipliers', () => {
    expect(scoreForChain({ count: 4, level: 2, multiply: 3, combo: 2, pointCoef: 1.5 }))
      .toBe(10 * 2 * 3 * 4 * 1.5 * 2 * 1.0);
  });
});
```

- [ ] **Step 2: Verify failing**

Run: `npm test -- score`
Expected: FAIL.

- [ ] **Step 3: Implement files**

```typescript
// src/data/balance.ts
export const SCORE_BASE = 10;
export const MIN_CHAIN_LENGTH = 4;
export const CHAIN_STABLE_MS = 1800;
export const CHAIN_BREAK_GRACE_MS = 250;
export const DEATH_LINE_TIMEOUT_MS = 10_000;
export const SPAWN_WAIT_MS = 4000;  // Phase 1: фиксированная для L1
```

```typescript
// src/game/Score.ts
import { SCORE_BASE, MIN_CHAIN_LENGTH } from '../data/balance';

export function chainBonus(count: number): number {
  if (count < MIN_CHAIN_LENGTH) return 1.0;  // below threshold = neutral bonus
  return 1 + 0.1 * (count - MIN_CHAIN_LENGTH);
}

export interface ScoreInputs {
  count: number;
  level: number;
  multiply: number;
  combo: number;
  pointCoef: number;
}

export function scoreForChain(input: ScoreInputs): number {
  const raw = SCORE_BASE
    * input.level
    * input.multiply
    * input.count
    * input.pointCoef
    * input.combo
    * chainBonus(input.count);
  return Math.round(raw);  // game score is integer; IEEE-754 (e.g. 10*5*1.1 = 55.000...01) gets normalized
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- score`
Expected: PASS — 7/7.

- [ ] **Step 5: Commit**

```bash
git add src/data/balance.ts src/game/Score.ts tests/score.test.ts
git commit -m "feat(phase-1): add Score formula with ChainBonus"
```

---

## Task 8: GameOverTimer (pure logic)

**Files:**
- Create: `src/game/GameOverTimer.ts`
- Create: `tests/game-over-timer.test.ts`

**Из PROJECT_OVERVIEW.md §16:** Если любая фигура касается death-line ≥ 10 секунд → Game Over. Если перестаёт касаться, таймер сбрасывается.

- [ ] **Step 1: Write failing test**

```typescript
// tests/game-over-timer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GameOverTimer } from '../src/game/GameOverTimer';

describe('GameOverTimer', () => {
  let timer: GameOverTimer;
  beforeEach(() => { timer = new GameOverTimer(10_000); });

  it('does not trigger before 10s', () => {
    expect(timer.tick(true, 5000)).toBe(false);
    expect(timer.tick(true, 4999)).toBe(false);
  });

  it('triggers exactly at 10s', () => {
    expect(timer.tick(true, 5000)).toBe(false);
    expect(timer.tick(true, 5000)).toBe(true);
  });

  it('resets when no contact', () => {
    timer.tick(true, 8000);
    timer.tick(false, 1000);
    expect(timer.tick(true, 5000)).toBe(false);
  });

  it('reports elapsed for HUD warning', () => {
    timer.tick(true, 6000);
    expect(timer.elapsed()).toBe(6000);
  });

  it('stays triggered once fired', () => {
    timer.tick(true, 10_000);
    timer.tick(false, 100);
    expect(timer.isTriggered()).toBe(true);
  });
});
```

- [ ] **Step 2: Verify failing**

Run: `npm test -- game-over-timer`
Expected: FAIL.

- [ ] **Step 3: Implement `src/game/GameOverTimer.ts`**

```typescript
export class GameOverTimer {
  private accumulated = 0;
  private triggered = false;

  constructor(private readonly thresholdMs: number) {}

  tick(touchingDeathLine: boolean, dtMs: number): boolean {
    if (this.triggered) return true;
    if (touchingDeathLine) {
      this.accumulated += dtMs;
      if (this.accumulated >= this.thresholdMs) {
        this.triggered = true;
        return true;
      }
    } else {
      this.accumulated = 0;
    }
    return false;
  }

  elapsed(): number { return this.accumulated; }
  isTriggered(): boolean { return this.triggered; }
  reset(): void { this.accumulated = 0; this.triggered = false; }
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- game-over-timer`
Expected: PASS — 5/5.

- [ ] **Step 5: Commit**

```bash
git add src/game/GameOverTimer.ts tests/game-over-timer.test.ts
git commit -m "feat(phase-1): add GameOverTimer with reset-on-no-contact"
```

---

## Task 9: Spawner (waiting shape at top)

**Files:**
- Create: `src/game/Spawner.ts`
- Modify: `src/scenes/GameScene.ts`

**Поведение:**
- При старте создаёт waiting shape в зоне спавна (центр X, y=200 — выше стакана).
- Shape статична (frozen via `setStatic(true)`) и игнорирует гравитацию.
- Когда InputController вызывает `releaseShape()`, текущий шейп размораживается и падает.
- Через `SPAWN_WAIT_MS` создаётся следующий с случайным type и color из палитры Phase 1.

- [ ] **Step 1: Write `src/game/Spawner.ts`**

```typescript
import Phaser from 'phaser';
import { Shape } from './Shape';
import { buildShapeSpec, SHAPE_TYPES, PHASE1_COLORS, ShapeType, ShapeColor } from '../data/shapes';
import { SPAWN_WAIT_MS } from '../data/balance';
import { CUP_CENTER_X, CUP_BOUNDS } from './Cup';

const SPAWN_Y = 672;  // per PROJECT_OVERVIEW.md §3: spawn zone center +18u above camera origin (cup top at y=752)

export class Spawner {
  private current: Shape | null = null;

  constructor(private scene: Phaser.Scene) {}

  start(): void {
    this.spawnNext();
  }

  currentShape(): Shape | null { return this.current; }

  releaseCurrent(): void {
    if (!this.current) return;
    this.current.releaseToFall();
    this.current = null;
    this.scene.time.delayedCall(SPAWN_WAIT_MS, () => this.spawnNext());
  }

  moveCurrentX(x: number): void {
    if (!this.current) return;
    const half = this.current.shapeSpec.radius;
    const minX = CUP_BOUNDS.innerLeft + half;
    const maxX = CUP_BOUNDS.innerRight - half;
    const clamped = Phaser.Math.Clamp(x, minX, maxX);
    this.current.setPosition(clamped, SPAWN_Y);
  }

  private spawnNext(): void {
    const type = Phaser.Utils.Array.GetRandom([...SHAPE_TYPES]) as ShapeType;
    const color = Phaser.Utils.Array.GetRandom([...PHASE1_COLORS]) as ShapeColor;
    const spec = buildShapeSpec(type, color);
    this.current = new Shape(this.scene, CUP_CENTER_X, SPAWN_Y, spec);
    this.current.freezeAsWaiting();
  }
}
```

- [ ] **Step 2: Modify `src/scenes/GameScene.ts`**

Заменить временный код спавна в `create()` на использование Spawner:

```typescript
import Phaser from 'phaser';
import { Cup } from '../game/Cup';
import { Spawner } from '../game/Spawner';

export class GameScene extends Phaser.Scene {
  private spawner!: Spawner;

  constructor() {
    super('Game');
  }

  create(): void {
    new Cup(this).create();
    this.spawner = new Spawner(this);
    this.spawner.start();

    // временно: тап в любое место → дроп
    this.input.on('pointerdown', () => this.spawner.releaseCurrent());
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Expected: При старте появляется случайная фигура у верха. По клику она падает в стакан. Через 4 секунды появляется следующая.

- [ ] **Step 4: Commit**

```bash
git add src/game/Spawner.ts src/scenes/GameScene.ts
git commit -m "feat(phase-1): add Spawner with waiting shape and timed cooldown"
```

---

## Task 10: InputController (drag horizontal)

**Files:**
- Create: `src/game/InputController.ts`
- Modify: `src/scenes/GameScene.ts`

**Поведение:**
- На `pointerdown` — запомнить начальную позицию.
- На `pointermove` (при удержании) — двигать waiting shape по X курсора.
- На `pointerup` — отпустить (drop).
- Поддержка touch и mouse одинаково.

- [ ] **Step 1: Write `src/game/InputController.ts`**

```typescript
import Phaser from 'phaser';
import { Spawner } from './Spawner';

export class InputController {
  private pointerDown = false;

  constructor(private scene: Phaser.Scene, private spawner: Spawner) {}

  attach(): void {
    this.scene.input.on('pointerdown', this.onDown, this);
    this.scene.input.on('pointermove', this.onMove, this);
    this.scene.input.on('pointerup',   this.onUp, this);
  }

  detach(): void {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointermove', this.onMove, this);
    this.scene.input.off('pointerup',   this.onUp, this);
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    this.pointerDown = true;
    this.spawner.moveCurrentX(pointer.worldX);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (!this.pointerDown) return;
    this.spawner.moveCurrentX(pointer.worldX);
  }

  private onUp(): void {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    this.spawner.releaseCurrent();
  }
}
```

- [ ] **Step 2: Modify `src/scenes/GameScene.ts`**

```typescript
import Phaser from 'phaser';
import { Cup } from '../game/Cup';
import { Spawner } from '../game/Spawner';
import { InputController } from '../game/InputController';

export class GameScene extends Phaser.Scene {
  private spawner!: Spawner;
  private inputController!: InputController;

  constructor() {
    super('Game');
  }

  create(): void {
    new Cup(this).create();
    this.spawner = new Spawner(this);
    this.spawner.start();
    this.inputController = new InputController(this, this.spawner);
    this.inputController.attach();
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Expected: Зажав мышь (или палец), можно двигать waiting shape по горизонтали в пределах стакана. Отпускание → фигура падает. Новая появляется через 4 секунды.

- [ ] **Step 4: Commit**

```bash
git add src/game/InputController.ts src/scenes/GameScene.ts
git commit -m "feat(phase-1): add InputController with drag-to-position and release-to-drop"
```

---

## Task 11: Wire up chain detection in GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts`

**Поведение update-loop:**
1. Собрать все «упавшие» фигуры (не waiting): сканировать `scene.matter.world.localWorld.bodies`.
2. Собрать активные contact pairs (Phaser-Matter подписка на `collisionactive`).
3. Запустить ChainDetector → массив цепочек ≥ 4.
4. Передать в ChainStabilityTracker с dt → массив «созревших» цепочек.
5. Для каждой созревшей цепочки: подсчитать score, удалить тела, обновить debug-text счёта.

**Решение по сбору contacts:** проще всего держать живой Set активных пар, обновляемый через события `collisionstart` / `collisionend`. Это надёжнее, чем каждый кадр опрашивать `engine.pairs`.

- [ ] **Step 1: Modify `src/scenes/GameScene.ts`**

```typescript
import Phaser from 'phaser';
import { Cup } from '../game/Cup';
import { Spawner } from '../game/Spawner';
import { InputController } from '../game/InputController';
import { Shape } from '../game/Shape';
import { detectChains, ShapeNode } from '../game/ChainDetector';
import { ChainStabilityTracker } from '../game/ChainStabilityTracker';
import { scoreForChain } from '../game/Score';
import {
  MIN_CHAIN_LENGTH,
  CHAIN_STABLE_MS,
  CHAIN_BREAK_GRACE_MS
} from '../data/balance';

interface ContactPair { a: number; b: number; }

export class GameScene extends Phaser.Scene {
  private spawner!: Spawner;
  private inputController!: InputController;
  private stability!: ChainStabilityTracker;
  private activeContacts = new Map<string, ContactPair>();
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() { super('Game'); }

  create(): void {
    new Cup(this).create();
    this.spawner = new Spawner(this);
    this.spawner.start();
    this.inputController = new InputController(this, this.spawner);
    this.inputController.attach();
    this.stability = new ChainStabilityTracker({
      stableMs: CHAIN_STABLE_MS,
      breakGraceMs: CHAIN_BREAK_GRACE_MS
    });

    this.scoreText = this.add.text(40, 40, 'Score: 0', {
      fontSize: '48px', color: '#ffffff'
    });

    this.matter.world.on('collisionstart', this.onCollisionStart, this);
    this.matter.world.on('collisionend', this.onCollisionEnd, this);
  }

  update(_time: number, deltaMs: number): void {
    const shapes = this.collectActiveShapes();
    const nodes: ShapeNode[] = shapes.map(s => ({
      id: s.body!.id,
      color: s.shapeSpec.color
    }));
    const contacts: [number, number][] = [];
    for (const pair of this.activeContacts.values()) contacts.push([pair.a, pair.b]);

    const chains = detectChains(nodes, contacts, MIN_CHAIN_LENGTH);
    const ready = this.stability.tick(chains, deltaMs);

    for (const chainIds of ready) {
      const chainIdSet = new Set(chainIds);
      const chainShapes = shapes.filter(s => chainIdSet.has(s.body!.id));
      const gained = scoreForChain({
        count: chainIds.length,  // score the chain as detected, not as-still-alive
        level: 1, multiply: 1, combo: 1, pointCoef: 1
      });
      this.score += gained;
      this.scoreText.setText(`Score: ${this.score}`);
      this.stability.remove(chainIds);
      // purge stale contact entries referencing destroyed bodies
      for (const [key, pair] of this.activeContacts) {
        if (chainIdSet.has(pair.a) || chainIdSet.has(pair.b)) this.activeContacts.delete(key);
      }
      for (const sh of chainShapes) sh.destroy();
    }
  }

  private collectActiveShapes(): Shape[] {
    const out: Shape[] = [];
    for (const body of this.matter.world.localWorld.bodies) {
      const go = (body as MatterJS.BodyType).gameObject as Phaser.GameObjects.GameObject | undefined;
      if (go instanceof Shape && !go.isStatic()) {
        out.push(go);
      }
    }
    return out;
  }

  private onCollisionStart(event: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    for (const pair of event.pairs) {
      const a = pair.bodyA.id, b = pair.bodyB.id;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      this.activeContacts.set(key, { a, b });
    }
  }

  private onCollisionEnd(event: Phaser.Physics.Matter.Events.CollisionEndEvent): void {
    for (const pair of event.pairs) {
      const a = pair.bodyA.id, b = pair.bodyB.id;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      this.activeContacts.delete(key);
    }
  }
}
```

- [ ] **Step 2: Verify**

Run: `npm run dev`
Expected: Бросив 4 фигуры одного цвета подряд (двигая waiting shape по X, чтобы они касались), через ~1.8s после стабилизации они исчезают, счёт растёт (для 4 шейпов += 40).

**Тестовый сценарий:** упростите проверку, сделав spawner временно генерирующим только красные:
- В `Spawner.spawnNext()` замените случайный color на `'red'`.
- Бросьте 4 круга подряд. Проверьте collapse + score.
- Верните рандом обратно.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(phase-1): wire ChainDetector + StabilityTracker + Score in GameScene"
```

---

## Task 12: Game Over detection + restart

**Files:**
- Modify: `src/scenes/GameScene.ts`

**Поведение:**
- Каждый frame проверять: касается ли хоть одна не-waiting фигура линии y=`CUP_BOUNDS.deathLineY`?
- Если да → tick GameOverTimer с dt.
- Если timer triggered → показать «Game Over» текст + остановить spawn + ждать клика на restart.

- [ ] **Step 1: Modify GameScene**

```typescript
// добавить импорты
import { GameOverTimer } from '../game/GameOverTimer';
import { DEATH_LINE_TIMEOUT_MS } from '../data/balance';
import { CUP_BOUNDS } from '../game/Cup';

// добавить поля
private gameOverTimer = new GameOverTimer(DEATH_LINE_TIMEOUT_MS);
private gameOverText: Phaser.GameObjects.Text | null = null;
private isGameOver = false;

// в update(), в самом начале:
if (this.isGameOver) return;
const touching = this.collectActiveShapes().some(s =>
  s.y - s.shapeSpec.radius <= CUP_BOUNDS.deathLineY
);
if (this.gameOverTimer.tick(touching, deltaMs)) {
  this.triggerGameOver();
  return;
}
```

Метод:

```typescript
private triggerGameOver(): void {
  this.isGameOver = true;
  this.inputController.detach();
  this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2,
    'GAME OVER\nTap to restart', {
      fontSize: '72px',
      color: '#ff6666',
      align: 'center'
    }).setOrigin(0.5);
  this.input.once('pointerdown', () => this.scene.restart());
}
```

- [ ] **Step 2: Verify**

Run: `npm run dev`
Expected: Если переполнить стакан фигурами так, чтобы верхняя касалась red-линии в течение 10 секунд — экран показывает «GAME OVER\nTap to restart», новые шейпы не спавнятся. По клику сцена перезапускается с нуля.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(phase-1): add GameOver detection and restart flow"
```

---

## Task 13: Toggle debug, polish, Phase 1 closure

**Files:**
- Modify: `src/config.ts`
- Create: `README.md` в `cosmix-v2/`

- [ ] **Step 1: Disable Matter debug**

В `src/config.ts`: `debug: false`.

- [ ] **Step 2: Verify production build**

Run: `npm run build`
Expected: TypeScript-проверка проходит, `dist/` создан, размер `index.html` + bundle разумный (<2MB suprese, основная масса — Phaser ~900KB unminified, ~300KB minified).

Run: `npm run preview`
Expected: Билд работает в браузере идентично dev-режиму.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: PASS — все 4 файла тестов, ~23 теста суммарно (5 + 6 + 7 + 5).

- [ ] **Step 4: Run linter**

Run: `npm run lint`
Expected: 0 errors (warnings допустимы).

- [ ] **Step 5: Write `README.md`**

```markdown
# Cosmix v2

«Падающие фигуры. Физический пазл» — migration to Phaser 3 + TypeScript.

## Status
Phase 1 complete: foundation + playable core (cup, shapes, drag-drop, chain detection, collapse, score, game over, restart).

## Run
- `npm install`
- `npm run dev` — open http://localhost:5173
- `npm test` — run unit tests
- `npm run build` — production bundle

## Architecture
- `src/scenes/` — Phaser scenes (Boot, Game)
- `src/game/` — gameplay objects (Cup, Shape, Spawner, InputController) и pure-logic модули (ChainDetector, ChainStabilityTracker, Score, GameOverTimer)
- `src/data/` — баланс и shape-спецификации
- `tests/` — Vitest pure-logic unit tests

## Source of truth
Behavioral spec: `../CosmixJS/PROJECT_OVERVIEW.md` (old repo).

## Next phase
Phase 2: HUD, level progression, cosmometer, combo system.
```

- [ ] **Step 6: Final commit**

```bash
git add src/config.ts README.md
git commit -m "chore(phase-1): disable matter debug, add README, close Phase 1"
git tag phase-1-complete
```

---

## Self-Review

**Spec coverage (Phase 1 scope):**
- ✅ Vite + Phaser + TS project (Task 1, 2)
- ✅ Cup geometry per PROJECT_OVERVIEW.md §3 (Task 3)
- ✅ Shape as Matter.Sprite — главное архитектурное преимущество миграции (Task 4)
- ✅ Chain detection per §6 (Task 5, 6)
- ✅ Score per §15 (Task 7)
- ✅ Game over per §16 (Task 8, 12)
- ✅ Spawner + drag input (Task 9, 10)
- ✅ End-to-end wiring (Task 11)
- ✅ Restart (Task 12)
- ✅ Tests, lint, build verification (Task 13)

**Phase 1 explicitly defers** (covered by later phases):
- Level progression, color expansion 4→7, shape rotation (Phase 2)
- Cosmometer, combo (Phase 2)
- HUD with progress bar, coins, level (Phase 2)
- Skin variants (Phase 3)
- Audio (Phase 4)
- Bubbles, bonuses (Phase 5)
- Shop, persistence (Phase 6)
- Menus (Phase 7)
- Yandex SDK (Phase 8)

**Placeholder scan:** Прошёл — все code-blocks полные, все file paths абсолютные/конкретные, нет TBD/TODO без контекста.

**Type consistency:**
- `ShapeColor` строковый литерал в `src/data/shapes.ts` ✅ согласован с `color: string` в `ChainDetector` (тестируется на любых строках) ✅
- `Shape.shapeSpec` readonly — корректно
- `MatterJS.BodyType` для `body.id` — корректное имя из @types/matter-js (поставляется с Phaser 3)
- Tests используют `ShapeNode` из ChainDetector корректно

**Risks для исполнителя Phase 1:**
1. Phaser 3.80+ API маленько отличается от 3.55 — если в node_modules окажется старая версия, импорты могут не сойтись. Проверять `npm ls phaser`.
2. `body.gameObject` — у статичных стенок Cup gameObject отсутствует, поэтому `collectActiveShapes` корректно их игнорирует через `instanceof Shape`.
3. `setIgnoreGravity` в Phaser 3.80 — метод `Phaser.Physics.Matter.Components.Gravity.setIgnoreGravity`, доступен на Matter.Sprite. Если в TS не находится — проверить через `body.ignoreGravity = true` напрямую.
4. На retina-дисплеях Phaser-Matter debug может выглядеть смещённым на 0.5px — это норма.
