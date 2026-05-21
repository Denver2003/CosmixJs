# Phase 1.5a — Shape Pack Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить захардкоженные в коде определения фигур (`HITBOXES` в `src/data/shapes.ts`) на data-driven систему: каждая фигура — это директория с `shape.json` + PNG-ассетами; паки объединяют группы фигур через `pack.json`. Класс `Shape` становится `Phaser.GameObjects.Container` с произвольным числом спрайт-слоёв и Matter-телом из vertices (поддержка невыпуклых форм через poly-decomp).

**Architecture:** Greenfield-подсистема внутри существующего `cosmix-v2`. JSON-схема определяет физику (vertices), слои спрайтов (с tinting, anchor, optional sprite-sheet animation) и метаданные. Loader асинхронно загружает manifest пака, fetches каждый `shape.json` + PNG, регистрирует тип в `ShapeRegistry`. Shape-инстанс при создании читает definition из registry. Existing 4 фигуры мигрируются в новый формат; добавляется одна концевая (концавная) форма как доказательство poly-decomp работает.

**Tech Stack:**
- **poly-decomp 0.3.x** — стандартная Matter.js библиотека для декомпозиции невыпуклых полигонов в выпуклые
- **Phaser 3.90** — `GameObjects.Container` + `matter.add.gameObject` для multi-layer + физика
- **Vite 5** — для static-asset резолва из `public/assets/shapes/`
- Существующий TypeScript 5.9 strict, Vitest 1.6, ESLint 9

---

## Source of truth

- Текущее состояние: `cosmix-v2/` repo, commit `7f99e3c` (после фикса display-size)
- Phase 1 закрыта тегом `phase-1-complete`
- PROJECT_OVERVIEW.md осталось как канонический балансовый спек, но геометрия фигур теперь живёт в shape.json (не в нём)

---

## File Structure (создаётся за Phase 1.5a)

```
cosmix-v2/
├── package.json                              # MODIFIED: добавить poly-decomp
├── public/
│   └── assets/
│       ├── phase1/                           # БУДЕТ УДАЛЁН после миграции
│       │   ├── shape_circle.png              (старые PNG, мигрируем в shapes/default/)
│       │   └── ...
│       └── shapes/                           # NEW root для всех паков
│           └── default/                      # пак по умолчанию
│               ├── pack.json                 # манифест пака
│               ├── circle/
│               │   ├── shape.json
│               │   └── outline.png           # копия из phase1/shape_circle.png
│               ├── triangle/
│               │   ├── shape.json
│               │   └── outline.png
│               ├── square/
│               │   ├── shape.json
│               │   └── outline.png
│               ├── diamond/
│               │   ├── shape.json
│               │   └── outline.png
│               └── star/                     # NEW концевая форма для теста poly-decomp
│                   ├── shape.json
│                   └── outline.png           # сгенерируем PNG со звездой
├── src/
│   ├── shapes/                               # NEW package
│   │   ├── ShapeDefinition.ts                # TS types для JSON
│   │   ├── packSchemaValidator.ts            # runtime валидация JSON
│   │   ├── ShapePackLoader.ts                # fetch + register
│   │   ├── ShapeRegistry.ts                  # in-memory регистр
│   │   ├── decompositionSetup.ts             # poly-decomp глобальная инициализация
│   │   └── textureKeys.ts                    # генерация ключей текстур
│   ├── game/
│   │   └── Shape.ts                          # MAJOR REFACTOR: Container + multi-layer
│   ├── data/
│   │   └── shapes.ts                         # SIMPLIFIED: остаются только ShapeColor + COLOR_HEX
│   ├── scenes/
│   │   ├── BootScene.ts                      # MODIFIED: грузит pack через loader
│   │   └── GameScene.ts                      # MODIFIED: новые типы из registry
│   └── game/
│       └── Spawner.ts                        # MODIFIED: использует registry для random shape
└── tests/
    ├── shape-definition-validator.test.ts    # NEW
    ├── shape-registry.test.ts                # NEW
    └── shape-pack-loader.test.ts             # NEW (с моком fetch)
```

---

## JSON Schemas

### `pack.json` (pack manifest)

```json
{
  "id": "default",
  "name": "Classic",
  "version": "1.0.0",
  "shapes": ["circle", "triangle", "square", "diamond", "star"]
}
```

### `shape.json` (per-shape definition)

```json
{
  "id": "circle",
  "physics": {
    "vertices": [
      [70, 0], [49.5, 49.5], [0, 70], [-49.5, 49.5],
      [-70, 0], [-49.5, -49.5], [0, -70], [49.5, -49.5]
    ],
    "friction": 0.4,
    "frictionAir": 0.01,
    "bounce": 0.15,
    "density": 0.001
  },
  "layers": [
    {
      "id": "outline",
      "source": "outline.png",
      "z": 0,
      "tintable": true,
      "anchor": [0, 0]
    }
  ]
}
```

### `shape.json` with animation (future-ready example, not in default pack)

```json
{
  "id": "blinking-blob",
  "physics": {
    "vertices": [[0, -60], [50, -20], [40, 40], [-40, 40], [-50, -20]]
  },
  "layers": [
    { "id": "fill", "source": "fill.png", "z": 0, "tintable": true },
    { "id": "outline", "source": "outline.png", "z": 1, "tintable": false },
    {
      "id": "eyes",
      "source": "eyes.png",
      "z": 2,
      "tintable": false,
      "anchor": [0, -20],
      "animation": {
        "frameWidth": 64,
        "frameHeight": 32,
        "frames": [0, 1, 2, 1, 0],
        "fps": 4,
        "loop": true
      }
    }
  ]
}
```

---

## TypeScript Types

```typescript
// src/shapes/ShapeDefinition.ts

export interface PackManifest {
  id: string;
  name: string;
  version: string;
  shapes: string[];
}

export interface ShapeDefinition {
  id: string;
  physics: ShapePhysics;
  layers: ShapeLayer[];
}

export interface ShapePhysics {
  vertices: [number, number][];
  friction?: number;
  frictionAir?: number;
  bounce?: number;
  density?: number;
}

export interface ShapeLayer {
  id: string;
  source: string;
  z: number;
  tintable: boolean;
  anchor?: [number, number];
  animation?: SpriteSheetAnimation;
}

export interface SpriteSheetAnimation {
  frameWidth: number;
  frameHeight: number;
  frames: number[];
  fps: number;
  loop: boolean;
}
```

---

## Task 1: Install poly-decomp + global Matter setup

**Files:**
- Modify: `cosmix-v2/package.json`
- Create: `cosmix-v2/src/shapes/decompositionSetup.ts`
- Modify: `cosmix-v2/src/main.ts`

**Goal:** poly-decomp подключён и зарегистрирован как глобальный `decomp` ДО создания первого Phaser.Game. Matter.js автоматически использует глобальный `decomp` при `fromVertices` для невыпуклых форм.

- [ ] **Step 1: Install dependency**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm install poly-decomp@^0.3.0
```

Expected: `package.json` обновлён с `"poly-decomp": "^0.3.0"` в dependencies.

- [ ] **Step 2: Write `src/shapes/decompositionSetup.ts`**

```typescript
import decomp from 'poly-decomp';

/**
 * Register poly-decomp globally so Matter.js can decompose
 * non-convex polygons automatically during fromVertices.
 *
 * Must be called BEFORE any Phaser.Game is constructed.
 */
export function setupPolyDecomp(): void {
  (globalThis as unknown as { decomp: typeof decomp }).decomp = decomp;
}
```

- [ ] **Step 3: Modify `src/main.ts` to call setup first**

```typescript
import Phaser from 'phaser';
import { setupPolyDecomp } from './shapes/decompositionSetup';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

setupPolyDecomp();

new Phaser.Game({
  ...gameConfig,
  scene: [BootScene, GameScene]
});
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm run lint
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vite build
```
Expected: All exit 0. Bundle includes poly-decomp.

- [ ] **Step 5: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add package.json package-lock.json src/main.ts src/shapes/decompositionSetup.ts
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): install poly-decomp and register globally"
```

---

## Task 2: Define ShapeDefinition TypeScript types

**Files:**
- Create: `cosmix-v2/src/shapes/ShapeDefinition.ts`

**Goal:** Все типы JSON-схемы в одном файле, экспортируемые для использования валидатором, лоадером и Shape-классом.

- [ ] **Step 1: Write `src/shapes/ShapeDefinition.ts`**

```typescript
export interface PackManifest {
  id: string;
  name: string;
  version: string;
  shapes: string[];
}

export interface ShapeDefinition {
  id: string;
  physics: ShapePhysics;
  layers: ShapeLayer[];
}

export interface ShapePhysics {
  vertices: [number, number][];
  friction?: number;
  frictionAir?: number;
  bounce?: number;
  density?: number;
}

export interface ShapeLayer {
  id: string;
  source: string;
  z: number;
  tintable: boolean;
  anchor?: [number, number];
  animation?: SpriteSheetAnimation;
}

export interface SpriteSheetAnimation {
  frameWidth: number;
  frameHeight: number;
  frames: number[];
  fps: number;
  loop: boolean;
}

export const PHYSICS_DEFAULTS = {
  friction: 0.4,
  frictionAir: 0.01,
  bounce: 0.15,
  density: 0.001
} as const;
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
```
Expected: exit 0. No runtime tests yet — types are imported by later tasks.

- [ ] **Step 3: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add src/shapes/ShapeDefinition.ts
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): add ShapeDefinition TypeScript types"
```

---

## Task 3: Pack schema validator (pure logic, TDD)

**Files:**
- Create: `cosmix-v2/tests/shape-definition-validator.test.ts`
- Create: `cosmix-v2/src/shapes/packSchemaValidator.ts`

**Goal:** Чистая функция, валидирующая JSON. На вход — unknown, на выходе — либо `{ ok: true, value: ShapeDefinition }` либо `{ ok: false, errors: string[] }`. Защищает рантайм от плохо сформированных паков.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/shape-definition-validator.test.ts
import { describe, it, expect } from 'vitest';
import { validateShapeDefinition, validatePackManifest } from '../src/shapes/packSchemaValidator';

describe('validateShapeDefinition', () => {
  it('accepts a minimal valid definition', () => {
    const input = {
      id: 'circle',
      physics: { vertices: [[1, 0], [0, 1], [-1, 0]] },
      layers: [{ id: 'main', source: 'a.png', z: 0, tintable: true }]
    };
    const result = validateShapeDefinition(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe('circle');
  });

  it('rejects missing id', () => {
    const input = {
      physics: { vertices: [[1, 0], [0, 1], [-1, 0]] },
      layers: []
    };
    const result = validateShapeDefinition(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/id/);
  });

  it('rejects fewer than 3 vertices', () => {
    const input = {
      id: 'bad',
      physics: { vertices: [[1, 0], [0, 1]] },
      layers: [{ id: 'a', source: 'a.png', z: 0, tintable: true }]
    };
    const result = validateShapeDefinition(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/vertices/);
  });

  it('rejects layer without source', () => {
    const input = {
      id: 'bad',
      physics: { vertices: [[1, 0], [0, 1], [-1, 0]] },
      layers: [{ id: 'a', z: 0, tintable: true }]
    };
    const result = validateShapeDefinition(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/source/);
  });

  it('accepts optional animation block', () => {
    const input = {
      id: 'animated',
      physics: { vertices: [[1, 0], [0, 1], [-1, 0]] },
      layers: [{
        id: 'eyes', source: 'eyes.png', z: 1, tintable: false,
        animation: { frameWidth: 32, frameHeight: 32, frames: [0, 1], fps: 4, loop: true }
      }]
    };
    expect(validateShapeDefinition(input).ok).toBe(true);
  });

  it('rejects animation without frameWidth', () => {
    const input = {
      id: 'bad',
      physics: { vertices: [[1, 0], [0, 1], [-1, 0]] },
      layers: [{
        id: 'eyes', source: 'eyes.png', z: 0, tintable: false,
        animation: { frameHeight: 32, frames: [0], fps: 4, loop: true }
      }]
    };
    expect(validateShapeDefinition(input).ok).toBe(false);
  });
});

describe('validatePackManifest', () => {
  it('accepts a minimal valid manifest', () => {
    const input = { id: 'default', name: 'Classic', version: '1.0.0', shapes: ['a', 'b'] };
    const result = validatePackManifest(input);
    expect(result.ok).toBe(true);
  });

  it('rejects missing shapes array', () => {
    const input = { id: 'default', name: 'Classic', version: '1.0.0' };
    expect(validatePackManifest(input).ok).toBe(false);
  });

  it('rejects empty shapes array', () => {
    const input = { id: 'default', name: 'Classic', version: '1.0.0', shapes: [] };
    expect(validatePackManifest(input).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run tests/shape-definition-validator.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/shapes/packSchemaValidator.ts`**

```typescript
import { ShapeDefinition, PackManifest, ShapeLayer, ShapePhysics, SpriteSheetAnimation } from './ShapeDefinition';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(s => typeof s === 'string');
}

function isVertexArray(v: unknown): v is [number, number][] {
  return Array.isArray(v) && v.every(p =>
    Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number'
  );
}

function validatePhysics(v: unknown, errors: string[]): ShapePhysics | null {
  if (!isObject(v)) { errors.push('physics must be an object'); return null; }
  if (!isVertexArray(v.vertices)) { errors.push('physics.vertices must be array of [x,y] pairs'); return null; }
  if (v.vertices.length < 3) { errors.push('physics.vertices must have at least 3 points'); return null; }
  const out: ShapePhysics = { vertices: v.vertices };
  for (const key of ['friction', 'frictionAir', 'bounce', 'density'] as const) {
    if (key in v) {
      if (typeof v[key] !== 'number') { errors.push(`physics.${key} must be a number`); return null; }
      out[key] = v[key] as number;
    }
  }
  return out;
}

function validateAnimation(v: unknown, errors: string[]): SpriteSheetAnimation | null {
  if (!isObject(v)) { errors.push('animation must be an object'); return null; }
  for (const key of ['frameWidth', 'frameHeight', 'fps'] as const) {
    if (typeof v[key] !== 'number') { errors.push(`animation.${key} must be a number`); return null; }
  }
  if (!Array.isArray(v.frames) || !v.frames.every(f => typeof f === 'number')) {
    errors.push('animation.frames must be number[]');
    return null;
  }
  if (typeof v.loop !== 'boolean') { errors.push('animation.loop must be boolean'); return null; }
  return {
    frameWidth: v.frameWidth as number,
    frameHeight: v.frameHeight as number,
    frames: v.frames,
    fps: v.fps as number,
    loop: v.loop
  };
}

function validateLayer(v: unknown, errors: string[]): ShapeLayer | null {
  if (!isObject(v)) { errors.push('layer must be an object'); return null; }
  if (typeof v.id !== 'string') { errors.push('layer.id must be a string'); return null; }
  if (typeof v.source !== 'string') { errors.push('layer.source must be a string'); return null; }
  if (typeof v.z !== 'number') { errors.push('layer.z must be a number'); return null; }
  if (typeof v.tintable !== 'boolean') { errors.push('layer.tintable must be boolean'); return null; }
  const layer: ShapeLayer = { id: v.id, source: v.source, z: v.z, tintable: v.tintable };
  if ('anchor' in v) {
    if (!Array.isArray(v.anchor) || v.anchor.length !== 2 ||
        typeof v.anchor[0] !== 'number' || typeof v.anchor[1] !== 'number') {
      errors.push('layer.anchor must be [x,y]'); return null;
    }
    layer.anchor = [v.anchor[0], v.anchor[1]];
  }
  if ('animation' in v) {
    const anim = validateAnimation(v.animation, errors);
    if (!anim) return null;
    layer.animation = anim;
  }
  return layer;
}

export function validateShapeDefinition(input: unknown): ValidationResult<ShapeDefinition> {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ['root must be an object'] };
  if (typeof input.id !== 'string') errors.push('id must be a string');
  const physics = validatePhysics(input.physics, errors);
  if (!Array.isArray(input.layers)) errors.push('layers must be an array');
  const layers: ShapeLayer[] = [];
  if (Array.isArray(input.layers)) {
    for (let i = 0; i < input.layers.length; i++) {
      const l = validateLayer(input.layers[i], errors);
      if (l) layers.push(l);
    }
  }
  if (errors.length > 0 || !physics) return { ok: false, errors };
  return { ok: true, value: { id: input.id as string, physics, layers } };
}

export function validatePackManifest(input: unknown): ValidationResult<PackManifest> {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ['root must be an object'] };
  if (typeof input.id !== 'string') errors.push('id must be a string');
  if (typeof input.name !== 'string') errors.push('name must be a string');
  if (typeof input.version !== 'string') errors.push('version must be a string');
  if (!isStringArray(input.shapes)) errors.push('shapes must be string[]');
  else if (input.shapes.length === 0) errors.push('shapes must be non-empty');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: {
    id: input.id as string,
    name: input.name as string,
    version: input.version as string,
    shapes: input.shapes as string[]
  }};
}
```

- [ ] **Step 4: Run tests, verify all pass**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run tests/shape-definition-validator.test.ts
```
Expected: 9/9 pass.

- [ ] **Step 5: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add src/shapes/packSchemaValidator.ts tests/shape-definition-validator.test.ts
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): add shape JSON schema validators with tests"
```

---

## Task 4: ShapeRegistry (in-memory, TDD)

**Files:**
- Create: `cosmix-v2/tests/shape-registry.test.ts`
- Create: `cosmix-v2/src/shapes/ShapeRegistry.ts`

**Goal:** Простой Map-обёртка для зарегистрированных определений фигур. Поддерживает `register`, `get`, `has`, `ids` (для случайного выбора в Spawner).

- [ ] **Step 1: Write failing tests**

```typescript
// tests/shape-registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ShapeRegistry } from '../src/shapes/ShapeRegistry';
import { ShapeDefinition } from '../src/shapes/ShapeDefinition';

function make(id: string): ShapeDefinition {
  return {
    id,
    physics: { vertices: [[1, 0], [0, 1], [-1, 0]] },
    layers: [{ id: 'main', source: `${id}.png`, z: 0, tintable: true }]
  };
}

describe('ShapeRegistry', () => {
  let r: ShapeRegistry;
  beforeEach(() => { r = new ShapeRegistry(); });

  it('starts empty', () => {
    expect(r.ids()).toEqual([]);
    expect(r.has('x')).toBe(false);
  });

  it('registers and retrieves a definition', () => {
    const def = make('circle');
    r.register(def);
    expect(r.has('circle')).toBe(true);
    expect(r.get('circle')).toBe(def);
    expect(r.ids()).toEqual(['circle']);
  });

  it('overwrites existing id on re-register', () => {
    r.register(make('circle'));
    const updated = make('circle');
    r.register(updated);
    expect(r.get('circle')).toBe(updated);
  });

  it('returns undefined for unknown id', () => {
    expect(r.get('missing')).toBeUndefined();
  });

  it('lists all ids in registration order', () => {
    r.register(make('a'));
    r.register(make('b'));
    r.register(make('c'));
    expect(r.ids()).toEqual(['a', 'b', 'c']);
  });

  it('clear empties the registry', () => {
    r.register(make('a'));
    r.clear();
    expect(r.ids()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run failing**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run tests/shape-registry.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/shapes/ShapeRegistry.ts`**

```typescript
import { ShapeDefinition } from './ShapeDefinition';

export class ShapeRegistry {
  private readonly defs = new Map<string, ShapeDefinition>();

  register(def: ShapeDefinition): void {
    this.defs.set(def.id, def);
  }

  get(id: string): ShapeDefinition | undefined {
    return this.defs.get(id);
  }

  has(id: string): boolean {
    return this.defs.has(id);
  }

  ids(): string[] {
    return [...this.defs.keys()];
  }

  clear(): void {
    this.defs.clear();
  }
}
```

- [ ] **Step 4: Verify pass**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run tests/shape-registry.test.ts
```
Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add src/shapes/ShapeRegistry.ts tests/shape-registry.test.ts
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): add ShapeRegistry with insertion-order ids"
```

---

## Task 5: textureKeys helper

**Files:**
- Create: `cosmix-v2/src/shapes/textureKeys.ts`

**Goal:** Единая функция генерации ключей текстур Phaser (`pack/shape/layer` → строковый ключ). Нужна и в loader (для регистрации текстур) и в Shape (для чтения). Без чистой функции — рискуем рассогласовать ключи.

- [ ] **Step 1: Write `src/shapes/textureKeys.ts`**

```typescript
/**
 * Generate Phaser texture key for a shape layer.
 * Format: shape:<packId>/<shapeId>/<layerId>
 */
export function layerTextureKey(packId: string, shapeId: string, layerId: string): string {
  return `shape:${packId}/${shapeId}/${layerId}`;
}

/**
 * Generate Phaser animation key for an animated layer.
 * Format: anim:<packId>/<shapeId>/<layerId>
 */
export function layerAnimationKey(packId: string, shapeId: string, layerId: string): string {
  return `anim:${packId}/${shapeId}/${layerId}`;
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add src/shapes/textureKeys.ts
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): add textureKeys helpers for layer/anim Phaser keys"
```

---

## Task 6: Migrate 4 existing shapes to pack JSON

**Files:**
- Create: `cosmix-v2/public/assets/shapes/default/pack.json`
- Create: `cosmix-v2/public/assets/shapes/default/circle/shape.json`
- Create: `cosmix-v2/public/assets/shapes/default/circle/outline.png` (copy from `public/assets/phase1/shape_circle.png`)
- Create: `cosmix-v2/public/assets/shapes/default/triangle/shape.json` + `outline.png`
- Create: `cosmix-v2/public/assets/shapes/default/square/shape.json` + `outline.png`
- Create: `cosmix-v2/public/assets/shapes/default/diamond/shape.json` + `outline.png`

**Goal:** Существующие 4 фигуры с теми же физическими параметрами, но описанные в JSON-формате.

- [ ] **Step 1: Create directories and copy PNGs**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2
mkdir -p public/assets/shapes/default/circle public/assets/shapes/default/triangle public/assets/shapes/default/square public/assets/shapes/default/diamond
cp public/assets/phase1/shape_circle.png   public/assets/shapes/default/circle/outline.png
cp public/assets/phase1/shape_triangle.png public/assets/shapes/default/triangle/outline.png
cp public/assets/phase1/shape_square.png   public/assets/shapes/default/square/outline.png
cp public/assets/phase1/shape_diamond.png  public/assets/shapes/default/diamond/outline.png
```

- [ ] **Step 2: Write `public/assets/shapes/default/pack.json`**

```json
{
  "id": "default",
  "name": "Classic",
  "version": "1.0.0",
  "shapes": ["circle", "triangle", "square", "diamond"]
}
```

- [ ] **Step 3: Write `public/assets/shapes/default/circle/shape.json`**

Octagon-approximated circle (r=70). 8 vertices for smooth-looking but still polygon-based circle:

```json
{
  "id": "circle",
  "physics": {
    "vertices": [
      [70, 0],
      [49.497, 49.497],
      [0, 70],
      [-49.497, 49.497],
      [-70, 0],
      [-49.497, -49.497],
      [0, -70],
      [49.497, -49.497]
    ],
    "friction": 0.4,
    "frictionAir": 0.01,
    "bounce": 0.15,
    "density": 0.001
  },
  "layers": [
    { "id": "outline", "source": "outline.png", "z": 0, "tintable": true }
  ]
}
```

- [ ] **Step 4: Write `public/assets/shapes/default/triangle/shape.json`**

Equilateral triangle inscribed in circle r=100, apex up:

```json
{
  "id": "triangle",
  "physics": {
    "vertices": [
      [0, -100],
      [86.603, 50],
      [-86.603, 50]
    ],
    "friction": 0.4,
    "frictionAir": 0.01,
    "bounce": 0.15,
    "density": 0.001
  },
  "layers": [
    { "id": "outline", "source": "outline.png", "z": 0, "tintable": true }
  ]
}
```

- [ ] **Step 5: Write `public/assets/shapes/default/square/shape.json`**

```json
{
  "id": "square",
  "physics": {
    "vertices": [
      [-60, -60],
      [60, -60],
      [60, 60],
      [-60, 60]
    ],
    "friction": 0.4,
    "frictionAir": 0.01,
    "bounce": 0.15,
    "density": 0.001
  },
  "layers": [
    { "id": "outline", "source": "outline.png", "z": 0, "tintable": true }
  ]
}
```

- [ ] **Step 6: Write `public/assets/shapes/default/diamond/shape.json`**

Kite/diamond (taller than wide):

```json
{
  "id": "diamond",
  "physics": {
    "vertices": [
      [0, -120],
      [60, 0],
      [0, 120],
      [-60, 0]
    ],
    "friction": 0.4,
    "frictionAir": 0.01,
    "bounce": 0.15,
    "density": 0.001
  },
  "layers": [
    { "id": "outline", "source": "outline.png", "z": 0, "tintable": true }
  ]
}
```

- [ ] **Step 7: Verify all files exist and JSON parses**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2
for f in public/assets/shapes/default/pack.json public/assets/shapes/default/*/shape.json; do
  echo "$f: $(node -e "console.log(JSON.parse(require('fs').readFileSync('$f','utf8')).id)")"
done
```
Expected: prints pack id `default` and shape ids `circle`, `triangle`, `square`, `diamond`.

- [ ] **Step 8: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add public/assets/shapes/default
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): migrate 4 existing shapes to JSON pack format"
```

---

## Task 7: ShapePackLoader

**Files:**
- Create: `cosmix-v2/tests/shape-pack-loader.test.ts`
- Create: `cosmix-v2/src/shapes/ShapePackLoader.ts`

**Goal:** Класс, который через `scene.load.json` + `scene.load.image` загружает manifest пака, валидирует каждый `shape.json`, регистрирует определения в `ShapeRegistry`, и регистрирует Phaser-текстуры под нужными ключами. Имеет async-метод `loadPack(scene, packId)` возвращающий Promise.

**Тестирование:** Полную интеграцию с Phaser в Vitest сделать сложно (нужен браузерный загрузчик). Тестируем pure-logic части: путь-строитель URLs, маппинг JSON→registry calls.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/shape-pack-loader.test.ts
import { describe, it, expect } from 'vitest';
import { buildManifestPath, buildShapePath, buildLayerSourcePath } from '../src/shapes/ShapePackLoader';

describe('ShapePackLoader path builders', () => {
  it('builds manifest path', () => {
    expect(buildManifestPath('default')).toBe('assets/shapes/default/pack.json');
  });

  it('builds shape.json path', () => {
    expect(buildShapePath('default', 'circle')).toBe('assets/shapes/default/circle/shape.json');
  });

  it('builds layer source path (relative)', () => {
    expect(buildLayerSourcePath('default', 'circle', 'outline.png'))
      .toBe('assets/shapes/default/circle/outline.png');
  });

  it('layer paths respect nested filenames', () => {
    expect(buildLayerSourcePath('default', 'blob', 'frames/eye-0.png'))
      .toBe('assets/shapes/default/blob/frames/eye-0.png');
  });
});
```

- [ ] **Step 2: Run failing**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run tests/shape-pack-loader.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/shapes/ShapePackLoader.ts`**

```typescript
import Phaser from 'phaser';
import { ShapeRegistry } from './ShapeRegistry';
import { ShapeDefinition, PackManifest } from './ShapeDefinition';
import { validateShapeDefinition, validatePackManifest } from './packSchemaValidator';
import { layerTextureKey, layerAnimationKey } from './textureKeys';

export function buildManifestPath(packId: string): string {
  return `assets/shapes/${packId}/pack.json`;
}

export function buildShapePath(packId: string, shapeId: string): string {
  return `assets/shapes/${packId}/${shapeId}/shape.json`;
}

export function buildLayerSourcePath(packId: string, shapeId: string, source: string): string {
  return `assets/shapes/${packId}/${shapeId}/${source}`;
}

export class ShapePackLoader {
  constructor(private readonly registry: ShapeRegistry) {}

  /**
   * Two-phase load:
   *   Phase A: fetch manifest + all shape.json files
   *   Phase B: queue Phaser asset loads (PNG + sprite-sheets) and resolve when LOADER_COMPLETE
   *
   * Must be called from a Scene's preload context (uses scene.load).
   */
  async loadPack(scene: Phaser.Scene, packId: string): Promise<PackManifest> {
    const manifest = await this.fetchManifest(packId);
    const shapeDefs: ShapeDefinition[] = [];
    for (const shapeId of manifest.shapes) {
      const def = await this.fetchShape(packId, shapeId);
      shapeDefs.push(def);
      this.registry.register(def);
    }
    await this.queuePhaserAssets(scene, packId, shapeDefs);
    return manifest;
  }

  private async fetchManifest(packId: string): Promise<PackManifest> {
    const res = await fetch(buildManifestPath(packId));
    if (!res.ok) throw new Error(`Pack manifest fetch failed: ${packId} (${res.status})`);
    const json: unknown = await res.json();
    const validation = validatePackManifest(json);
    if (!validation.ok) throw new Error(`Pack ${packId} manifest invalid: ${validation.errors.join('; ')}`);
    return validation.value;
  }

  private async fetchShape(packId: string, shapeId: string): Promise<ShapeDefinition> {
    const res = await fetch(buildShapePath(packId, shapeId));
    if (!res.ok) throw new Error(`Shape fetch failed: ${packId}/${shapeId} (${res.status})`);
    const json: unknown = await res.json();
    const validation = validateShapeDefinition(json);
    if (!validation.ok) throw new Error(`Shape ${packId}/${shapeId} invalid: ${validation.errors.join('; ')}`);
    return validation.value;
  }

  private queuePhaserAssets(scene: Phaser.Scene, packId: string, defs: ShapeDefinition[]): Promise<void> {
    for (const def of defs) {
      for (const layer of def.layers) {
        const url = buildLayerSourcePath(packId, def.id, layer.source);
        const texKey = layerTextureKey(packId, def.id, layer.id);
        if (layer.animation) {
          scene.load.spritesheet(texKey, url, {
            frameWidth: layer.animation.frameWidth,
            frameHeight: layer.animation.frameHeight
          });
        } else {
          scene.load.image(texKey, url);
        }
      }
    }
    return new Promise(resolve => {
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        for (const def of defs) {
          for (const layer of def.layers) {
            if (!layer.animation) continue;
            const animKey = layerAnimationKey(packId, def.id, layer.id);
            const texKey = layerTextureKey(packId, def.id, layer.id);
            scene.anims.create({
              key: animKey,
              frames: scene.anims.generateFrameNumbers(texKey, { frames: layer.animation.frames }),
              frameRate: layer.animation.fps,
              repeat: layer.animation.loop ? -1 : 0
            });
          }
        }
        resolve();
      });
      scene.load.start();
    });
  }
}
```

- [ ] **Step 4: Verify path-builder tests pass**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run tests/shape-pack-loader.test.ts
```
Expected: 4/4 pass.

Also full project:
```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm run lint
```
Expected: All exit 0. Total tests 38 (23 from Phase 1 + 9 validator + 6 registry + 4 loader = 42 actually; recount).

Actually count: 23 (Phase 1) + 9 (validator: 6 shape + 3 manifest) + 6 (registry) + 4 (loader paths) = 42.

- [ ] **Step 5: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add src/shapes/ShapePackLoader.ts tests/shape-pack-loader.test.ts
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): add ShapePackLoader with manifest + shape.json fetch and Phaser asset queue"
```

---

## Task 8: Refactor Shape class to Container with multi-layer

**Files:**
- Modify: `cosmix-v2/src/game/Shape.ts` — complete rewrite
- Modify: `cosmix-v2/src/data/shapes.ts` — strip down to ShapeColor + COLOR_HEX only

**Goal:** Shape extends Container; принимает `ShapeDefinition` + `ShapeColor`; добавляет физическое тело через `matter.add.gameObject` с vertices из definition; добавляет дочерние спрайты по слоям с правильными tint/anchor/animation.

- [ ] **Step 1: Modify `src/data/shapes.ts` — simplified to color-only**

Replace entire contents:

```typescript
export type ShapeColor = 'red' | 'blue' | 'green' | 'yellow';

export const PHASE1_COLORS: readonly ShapeColor[] = ['red', 'blue', 'green', 'yellow'];

export const COLOR_HEX: Record<ShapeColor, number> = {
  red:    0xe64545,
  blue:   0x3d8fe6,
  green:  0x5bcb5b,
  yellow: 0xf3c84a
};
```

- [ ] **Step 2: Replace `src/game/Shape.ts`**

```typescript
import Phaser from 'phaser';
import { ShapeColor, COLOR_HEX } from '../data/shapes';
import { ShapeDefinition, PHYSICS_DEFAULTS } from '../shapes/ShapeDefinition';
import { layerTextureKey, layerAnimationKey } from '../shapes/textureKeys';

export class Shape extends Phaser.GameObjects.Container {
  public readonly definition: ShapeDefinition;
  public readonly color: ShapeColor;
  public readonly packId: string;
  public readonly halfWidth: number;
  public readonly halfHeight: number;
  public chainCandidate: boolean = false;

  // Matter mixin will inject these methods at runtime via scene.matter.add.gameObject
  declare body: MatterJS.BodyType;
  declare setStatic: (value: boolean) => this;
  declare setIgnoreGravity: (value: boolean) => this;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    packId: string,
    definition: ShapeDefinition,
    color: ShapeColor
  ) {
    super(scene, x, y);
    this.definition = definition;
    this.color = color;
    this.packId = packId;

    // Bounding box from physics vertices
    const xs = definition.physics.vertices.map(v => v[0]);
    const ys = definition.physics.vertices.map(v => v[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    this.halfWidth = width / 2;
    this.halfHeight = height / 2;

    // Add child sprites sorted by z
    const sortedLayers = [...definition.layers].sort((a, b) => a.z - b.z);
    for (const layer of sortedLayers) {
      const texKey = layerTextureKey(packId, definition.id, layer.id);
      const anchor = layer.anchor ?? [0, 0];
      const sprite = scene.add.sprite(anchor[0], anchor[1], texKey);
      sprite.setDisplaySize(width, height);
      if (layer.tintable) sprite.setTint(COLOR_HEX[color]);
      if (layer.animation) {
        sprite.play(layerAnimationKey(packId, definition.id, layer.id));
      }
      this.add(sprite);
    }

    scene.add.existing(this);

    // Attach Matter body using vertices
    const physics = definition.physics;
    const verts = physics.vertices.map(v => ({ x: v[0], y: v[1] }));
    scene.matter.add.gameObject(this, {
      shape: { type: 'fromVerts', verts: [verts], flagInternal: true },
      friction: physics.friction ?? PHYSICS_DEFAULTS.friction,
      frictionAir: physics.frictionAir ?? PHYSICS_DEFAULTS.frictionAir,
      restitution: physics.bounce ?? PHYSICS_DEFAULTS.bounce,
      density: physics.density ?? PHYSICS_DEFAULTS.density
    } as Phaser.Types.Physics.Matter.MatterBodyConfig);

    this.setData('shapeColor', color);
    this.setData('shapeType', definition.id);
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

**Important notes:**
- `shape: { type: 'fromVerts', verts: [verts], flagInternal: true }` — the `verts` field expects an array-of-arrays (each inner array is one polygon's vertices); for a single polygon wrap in `[verts]`.
- If `fromVerts` doesn't accept this exact shape in 3.90, fallback option is to use the lower-level `Phaser.Physics.Matter.Matter.Bodies.fromVertices` and assign via `setExistingBody`. Implementer may need to verify Phaser 3.90 API.
- `sprite.setDisplaySize(width, height)` makes each layer cover the physics bounding box. If a layer should be smaller (e.g., eyes inside the body), the anchor + layer's own intrinsic dimensions handle it — but for v1 we cover the full bbox to mimic existing behavior.

If `width` or `height` is wider/taller than the source PNG, Phaser stretches. For our existing 4 shapes the PNGs are large enough.

- [ ] **Step 3: Verify build (will fail later compilation in BootScene/Spawner — fix in next tasks)**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
```

Expected: ERRORS. Compilation will break because Spawner and GameScene still reference old `buildShapeSpec` etc. That's fine — Tasks 9-11 fix them. **Do not commit yet** — atomic refactor requires all callers updated.

If tsc errors are ONLY in Spawner.ts, GameScene.ts, BootScene.ts referencing missing symbols — proceed to Task 9. If errors are in Shape.ts or shapes.ts themselves, fix Shape.ts before proceeding.

---

## Task 9: Update BootScene to load default pack

**Files:**
- Modify: `cosmix-v2/src/scenes/BootScene.ts`

**Goal:** BootScene использует `ShapePackLoader` для загрузки `default` пака; передаёт зарегистрированную `ShapeRegistry` дальше через `scene.registry.set('shapeRegistry', ...)` для доступа из GameScene.

- [ ] **Step 1: Replace `src/scenes/BootScene.ts`**

```typescript
import Phaser from 'phaser';
import { ShapeRegistry } from '../shapes/ShapeRegistry';
import { ShapePackLoader } from '../shapes/ShapePackLoader';

export const ACTIVE_PACK_ID = 'default';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  async create(): Promise<void> {
    const registry = new ShapeRegistry();
    this.registry.set('shapeRegistry', registry);
    this.registry.set('activePackId', ACTIVE_PACK_ID);

    const loader = new ShapePackLoader(registry);
    try {
      await loader.loadPack(this, ACTIVE_PACK_ID);
    } catch (err) {
      console.error('Failed to load shape pack:', err);
      this.add.text(this.scale.width / 2, this.scale.height / 2,
        `Failed to load pack ${ACTIVE_PACK_ID}\n${(err as Error).message}`,
        { fontSize: '32px', color: '#ff4444', align: 'center' })
        .setOrigin(0.5);
      return;
    }
    this.scene.start('Game');
  }
}
```

**Note:** No `preload()` method — pack loading is async and happens in `create()`. `scene.load` is invoked from inside the loader via `loadPack`. This works because Phaser allows `scene.load.start()` outside `preload`.

**Note:** `this.registry` is Phaser's `Game.registry` (shared across scenes). We use it to pass the ShapeRegistry to GameScene.

- [ ] **Step 2: Verify build improvement**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
```

Expected: BootScene compiles. GameScene/Spawner errors remain — Tasks 10-11 fix them.

---

## Task 10: Update Spawner to use ShapeRegistry

**Files:**
- Modify: `cosmix-v2/src/game/Spawner.ts`

**Goal:** Spawner получает `ShapeRegistry` + `packId` через конструктор; `spawnNext()` берёт случайный `ShapeDefinition` из registry и случайный `ShapeColor`; конструктор Shape принимает новые аргументы.

- [ ] **Step 1: Replace `src/game/Spawner.ts`**

```typescript
import Phaser from 'phaser';
import { Shape } from './Shape';
import { ShapeColor, PHASE1_COLORS } from '../data/shapes';
import { SPAWN_WAIT_MS } from '../data/balance';
import { CUP_CENTER_X, CUP_BOUNDS } from './Cup';
import { ShapeRegistry } from '../shapes/ShapeRegistry';

const SPAWN_Y = 280;  // inside cup, near top (cup inner top at y=210, ~70px below)

export class Spawner {
  private current: Shape | null = null;

  constructor(
    private scene: Phaser.Scene,
    private registry: ShapeRegistry,
    private packId: string
  ) {}

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
    const half = this.current.halfWidth;
    const minX = CUP_BOUNDS.innerLeft + half;
    const maxX = CUP_BOUNDS.innerRight - half;
    const clamped = Phaser.Math.Clamp(x, minX, maxX);
    this.current.setPosition(clamped, SPAWN_Y);
  }

  private spawnNext(): void {
    const shapeIds = this.registry.ids();
    if (shapeIds.length === 0) {
      console.error('Spawner: shape registry is empty');
      return;
    }
    const shapeId = Phaser.Utils.Array.GetRandom([...shapeIds]) as string;
    const def = this.registry.get(shapeId)!;
    const color = Phaser.Utils.Array.GetRandom([...PHASE1_COLORS]) as ShapeColor;
    this.current = new Shape(this.scene, CUP_CENTER_X, SPAWN_Y, this.packId, def, color);
    this.current.freezeAsWaiting();
  }
}
```

- [ ] **Step 2: Verify tsc only complains about GameScene now**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
```

---

## Task 11: Update GameScene for new Shape interface

**Files:**
- Modify: `cosmix-v2/src/scenes/GameScene.ts`

**Goal:** GameScene получает registry из Phaser.Game.registry, передаёт в Spawner, читает Shape-инстансы из физического мира (тип фильтра через `instanceof Shape` остаётся валидным).

- [ ] **Step 1: Modify `src/scenes/GameScene.ts`**

Find the line:
```typescript
this.spawner = new Spawner(this);
```
Replace with:
```typescript
const shapeRegistry = this.registry.get('shapeRegistry') as ShapeRegistry;
const packId = this.registry.get('activePackId') as string;
this.spawner = new Spawner(this, shapeRegistry, packId);
```

Add imports at top (alongside existing imports):
```typescript
import { ShapeRegistry } from '../shapes/ShapeRegistry';
```

The chain emission filter currently uses `(s.body as MatterJS.BodyType).id`. Since `Shape` is now a Container (not Matter.Sprite), `s.body` is still set by `matter.add.gameObject`, so this should still work. Verify in tsc.

The `s.shapeSpec.color` references should become `s.color` (we removed shapeSpec from Shape). Find:
```typescript
const nodes: ShapeNode[] = shapes.map(s => ({
  id: (s.body as MatterJS.BodyType).id,
  color: s.shapeSpec.color
}));
```
Replace with:
```typescript
const nodes: ShapeNode[] = shapes.map(s => ({
  id: (s.body as MatterJS.BodyType).id,
  color: s.color
}));
```

Same for the death-line check — already uses `s.halfHeight` which is still present.

- [ ] **Step 2: Verify full compilation + tests**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm run lint
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vite build
```
Expected: all clean. Total tests 42 (no test changes from Phase 1, plus new validator/registry/loader tests).

- [ ] **Step 3: Manual visual verification**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm run dev
```
Open browser. Expected:
- Cup outline visible
- A waiting shape (random of 4 types, random of 4 colors) appears at SPAWN_Y inside the cup
- Drag-and-drop works
- Shapes form chains and collapse after 1.8s
- Score updates

If any visual or runtime error: STOP and report what failed.

- [ ] **Step 4: Commit (atomic refactor — Shape + Spawner + BootScene + GameScene + data/shapes.ts together)**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add src/game/Shape.ts src/game/Spawner.ts src/scenes/BootScene.ts src/scenes/GameScene.ts src/data/shapes.ts
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "refactor(phase-1.5a): Shape becomes Container with pack-loaded multi-layer + registry-driven spawn"
```

---

## Task 12: Concave shape as integration test

**Files:**
- Create: `cosmix-v2/public/assets/shapes/default/star/shape.json`
- Create: `cosmix-v2/public/assets/shapes/default/star/outline.png` (use existing diamond outline as placeholder — visually wrong but proves the pipeline)
- Modify: `cosmix-v2/public/assets/shapes/default/pack.json` to include 'star'

**Goal:** Доказать, что poly-decomp работает: добавить 5-конечную звезду (явно невыпуклая) в пак, и убедиться что она спавнится без рантайм-ошибок про "не выпуклый полигон".

5-pointed star vertices (10 vertices alternating outer/inner radius, starting from top):
- Outer radius: 100
- Inner radius: 40

```
angle_outer_i = -π/2 + i * (2π/5)
angle_inner_i = -π/2 + (i + 0.5) * (2π/5)
```

- [ ] **Step 1: Compute and write `public/assets/shapes/default/star/shape.json`**

Precomputed vertices (alternating outer 100 / inner 40, apex up):

```json
{
  "id": "star",
  "physics": {
    "vertices": [
      [0, -100],
      [11.756, -32.361],
      [80.902, -32.361],
      [25.000, 12.361],
      [47.553, 80.902],
      [0, 40.000],
      [-47.553, 80.902],
      [-25.000, 12.361],
      [-80.902, -32.361],
      [-11.756, -32.361]
    ],
    "friction": 0.4,
    "frictionAir": 0.01,
    "bounce": 0.15,
    "density": 0.001
  },
  "layers": [
    { "id": "outline", "source": "outline.png", "z": 0, "tintable": true }
  ]
}
```

- [ ] **Step 2: Copy placeholder PNG (using diamond outline for now)**

```bash
mkdir -p /Users/deniskhlopin/UnityProjects/cosmix-v2/public/assets/shapes/default/star
cp /Users/deniskhlopin/UnityProjects/cosmix-v2/public/assets/shapes/default/diamond/outline.png \
   /Users/deniskhlopin/UnityProjects/cosmix-v2/public/assets/shapes/default/star/outline.png
```

NOTE for engineer: this is a placeholder PNG. Phase 1.5b editor will produce a proper star sprite. Visual will be a stretched diamond inside the star's bounding box — acceptable for proving poly-decomp.

- [ ] **Step 3: Update `pack.json` to include star**

Replace the contents of `/Users/deniskhlopin/UnityProjects/cosmix-v2/public/assets/shapes/default/pack.json` with:

```json
{
  "id": "default",
  "name": "Classic",
  "version": "1.0.0",
  "shapes": ["circle", "triangle", "square", "diamond", "star"]
}
```

- [ ] **Step 4: Verify**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm run lint
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vite build
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm run dev
```

In browser: drop shapes until a star spawns. Expected:
- Star spawns and falls
- NO console error "decomposition fail" or "Body.fromVertices: vertices must be convex"
- Star physics behaves like a star (concave parts make it stack interestingly with other shapes)
- Stretched diamond visual inside the star bbox (placeholder, OK)

If console errors: poly-decomp setup failed. Verify `globalThis.decomp` is set before `new Phaser.Game`.

- [ ] **Step 5: Commit**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add public/assets/shapes/default/star public/assets/shapes/default/pack.json
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "feat(phase-1.5a): add star shape proving concave polygon support via poly-decomp"
```

---

## Task 13: Cleanup old `phase1/` assets + README update

**Files:**
- Delete: `cosmix-v2/public/assets/phase1/` (whole directory — assets migrated to shapes/default/)
- Modify: `cosmix-v2/README.md` — update with pack system info

**Goal:** Удалить старые PNG из `phase1/` (теперь живут в `shapes/default/*/`), обновить документацию проекта.

- [ ] **Step 1: Verify no code references `phase1/`**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && grep -r "phase1" src/ tests/
```

Expected: NO matches (after Phase 1.5a all references should go through ShapePackLoader). If any matches found: STOP and report.

- [ ] **Step 2: Remove old assets**

```bash
rm -rf /Users/deniskhlopin/UnityProjects/cosmix-v2/public/assets/phase1
```

- [ ] **Step 3: Update README.md**

Replace `/Users/deniskhlopin/UnityProjects/cosmix-v2/README.md` contents with:

```markdown
# Cosmix v2

«Падающие фигуры. Физический пазл» — Phaser 3 + TypeScript + Vite + data-driven shape packs.

## Status

**Phase 1.5a complete**: shape packs runtime + 5-shape default pack (circle, triangle, square, diamond, star with concave physics).

- Cup geometry with static Matter walls
- Shapes defined in JSON packs at `public/assets/shapes/<pack>/<shape>/shape.json`
- Multi-layer sprites per shape (tintable, with optional sprite-sheet animations)
- Non-convex polygon support via poly-decomp
- Drag-and-release input, chain detection, collapse, score, game over

## Run

- `npm install`
- `npm run dev` — open http://localhost:5173
- `npm test` — unit tests for pure-logic and validation modules
- `npm run build` — production bundle
- `npm run lint` — ESLint check

## Architecture

- `src/scenes/` — Phaser scenes (Boot, Game). BootScene loads the active shape pack.
- `src/shapes/` — pack system: ShapePackLoader, ShapeRegistry, ShapeDefinition types, schema validator, decomposition setup
- `src/game/` — gameplay objects (Cup, Shape, Spawner, InputController) and pure-logic modules (ChainDetector, ChainStabilityTracker, Score, GameOverTimer)
- `src/data/` — balance constants, color palette
- `public/assets/shapes/<pack>/` — shape pack data (pack.json + per-shape directories)
- `tests/` — Vitest unit tests

## Adding a new shape

1. Create directory `public/assets/shapes/default/<shape-id>/`
2. Add PNG sprites (`outline.png`, `fill.png`, etc.)
3. Write `shape.json` with `id`, `physics.vertices` (≥3 points), and `layers`
4. Add `<shape-id>` to `shapes` array in `pack.json`
5. Restart dev server. New shape appears in random rotation.

Polygon vertices can be non-convex — poly-decomp handles decomposition automatically.

## Source of truth

Behavioral spec (formulas, timings, balance): `../CosmixJS/PROJECT_OVERVIEW.md`. Shape geometry, however, lives in pack JSON, not in the spec.

## Next phase

Phase 1.5b: Shape Editor (Vite app at `tools/shape-editor/`). Then Phase 2 (HUD, levels, cosmometer).
```

- [ ] **Step 4: Verify**

```bash
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx tsc --noEmit
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npm run lint
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vitest run
cd /Users/deniskhlopin/UnityProjects/cosmix-v2 && npx vite build
```

All exit 0 / 42 tests pass.

- [ ] **Step 5: Commit and tag**

```bash
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 add -A
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 commit -m "chore(phase-1.5a): remove obsolete phase1 assets, update README"
git -C /Users/deniskhlopin/UnityProjects/cosmix-v2 tag phase-1.5a-complete
```

---

## Self-Review

**1. Spec coverage:**
- ✅ JSON-based shape definitions (Task 2, 3, 6)
- ✅ Multi-layer sprites with z-order, tinting, anchor (Task 8)
- ✅ Sprite-sheet animations (Task 7 queueing + Task 8 playing)
- ✅ Non-convex polygon support via poly-decomp (Task 1 + Task 12)
- ✅ Pack manifest concept (Task 6 pack.json + Task 7 manifest loading)
- ✅ Folder-based pack structure ready for editor to write into (Task 6 + Task 13 doc)
- ✅ Migration of existing 4 shapes (Task 6)
- ✅ Integration test with concave star (Task 12)
- ⏳ Editor — out of scope, Phase 1.5b

**2. Placeholder scan:** Прошёл — все code blocks полные, все file paths абсолютные, нет TBD/TODO.

**3. Type consistency:**
- `ShapeDefinition`, `ShapeLayer`, `PackManifest`, `SpriteSheetAnimation`, `ShapePhysics` все определены в Task 2 и используются единообразно в Tasks 3, 4, 7, 8.
- `layerTextureKey(packId, shapeId, layerId)` сигнатура одинакова в Tasks 5, 7, 8.
- `ShapeRegistry.register(def)`, `.get(id)`, `.ids()`, `.has(id)`, `.clear()` — все методы перечислены в Task 4, использованы в Tasks 7, 9, 10.
- `Shape` constructor: `(scene, x, y, packId, definition, color)` — определена в Task 8, использована в Task 10 Spawner.

**4. Risks для исполнителя:**
1. Phaser 3.90 API для `matter.add.gameObject` с `shape: { type: 'fromVerts', verts: [...] }` — точная сигнатура может варьироваться. Если `fromVerts` не работает, нужен fallback на `Bodies.fromVertices` + `setExistingBody`. Implementer должен проверить через node_modules/phaser/types.
2. `scene.load.start()` вне `preload()` — должно работать в Phaser 3.x, но если возникнет race condition между двумя последовательными `loadPack` вызовами, нужно подождать `LOADER_COMPLETE` между ними.
3. `Container` + `setStatic` — Matter mixin добавляется через `matter.add.gameObject`. Если методы не появляются на типе — нужны declare-блоки (уже в коде Task 8) или явный кастинг.
4. `setDisplaySize` на child sprite внутри Container — display size масштабирует только этот sprite, а не Container. Это правильное поведение, но если sprite source PNG меньше bbox, он растянется.

**5. Risk register for Phase 1.5b** (informational, not in this plan):
- File System Access API недоступен в Firefox — нужен ZIP-download fallback
- Concave polygon validation — нужно убедиться что edges не пересекаются
- Sprite anchor — UI должен поддерживать drag-and-drop позиционирование слоёв

---

## Total scope summary

- 13 tasks
- ~3-5 дней работы соло
- 5 новых файлов в `src/shapes/`
- 3 новых тестовых файла, +19 unit-тестов (42 total после фазы)
- 5 директорий фигур в `public/assets/shapes/default/`
- Major refactor `Shape.ts`, `Spawner.ts`, `GameScene.ts`, `BootScene.ts`, `data/shapes.ts`
- Удаление `public/assets/phase1/`
- Тег `phase-1.5a-complete`

После этой фазы:
- Архитектура геометрии = одна точка правды (JSON)
- Phase 3 (Skin System) больше не нужна как отдельная — она уже в этой
- Phase 2 (HUD/levels/cosmometer) строится на надёжной базе
- Phase 1.5b (editor) производит данные, которые runtime уже умеет потреблять
