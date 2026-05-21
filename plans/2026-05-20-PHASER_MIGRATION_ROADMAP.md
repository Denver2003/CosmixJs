# Phaser+TS Migration — Master Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each phase plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести игру «Падающие фигуры. Физический пазл» (Cosmix) с vanilla JS + Matter.js на Phaser 3 + TypeScript + Vite. Цель миграции — не функциональные улучшения для игрока, а **скорость разработки в agent-driven workflow**: унифицировать тело и спрайт в одном `Matter.Sprite`, ввести data-driven скин-систему и привести стек в соответствие с другими проектами автора.

**Архитектура:** Greenfield-проект в отдельном репозитории (`cosmix-v2/`). Старый репозиторий остаётся как **референс поведения**, не как шаблон. Canonical-спецификация баланса и геймплея — `PROJECT_OVERVIEW.md` (не меняется). Каждая фаза заканчивается работающим, тестируемым артефактом, который можно показать в браузере.

**Tech Stack:**
- **Runtime:** Phaser 3.80+ с Matter.js (встроенный плагин)
- **Language:** TypeScript 5.x, strict mode
- **Build:** Vite 5.x
- **Tests:** Vitest для pure logic; manual visual verification для Phaser-scenes
- **Lint:** ESLint flat config + `@typescript-eslint`
- **Target:** Yandex Games (canvas 1080×1920 portrait, mobile-first)

---

## Source of truth

| Документ | Роль |
|---|---|
| `PROJECT_OVERVIEW.md` (старый репо) | **Canonical spec** — формулы, геометрия, баланс, тайминги. НЕ менять. |
| `ADS_AND_REWARDS_SPEC.md` | Спецификация рекламы и наград |
| `inapp.md` | Спецификация IAP-каталога |
| `screens_specs.md` | Спецификация экранов |
| Старый код (`scripts/`) | Референс поведения, не образец архитектуры |

---

## Phase Map

```
Phase 1:   Foundation + Playable Core        [1 неделя]  ✅ COMPLETE (tag phase-1-complete)
   │
Phase 1.5a: Shape Pack Runtime               [3-5 дней]  ← следующая
   │
Phase 1.5b: Shape Editor (Vite app)          [1 неделя]
   │
   ├─→ Phase 2: HUD, Progression, Combo      [3-5 дней]
   │      │
   │      └─→ Phase 4: Audio                 [2-3 дня]
   │
   ├─→ Phase 5: Bubbles & Bonuses            [1 неделя]
   │
   ├─→ Phase 6: Shop & Persistence           [3-5 дней]
   │      │
   │      └─→ Phase 7: Menu Scenes           [3-5 дней]
   │
   ├─→ Phase 8: Yandex SDK Integration       [1 неделя]
   │      │
   │      └─→ Phase 9: Localization          [1-2 дня]
   │
   └─→ Phase 10: Production Build & Submit   [1-2 дня]
```

**Critical path** (минимальный билд под Yandex без скинов и пузырей): Phase 1 → 2 → 6 → 7 → 8 → 10. ~3 недели.

**Полный паритет со старой игрой**: все фазы. ~6-7 недель соло.

---

## Phase 1: Foundation + Playable Core

**Outcome:** В браузере открывается окно, в нём стакан, сверху появляются цветные фигуры, игрок водит мышью/пальцем, отпускает — фигуры падают, формируют группы, при цепочке 4+ одного цвета группа исчезает, счётчик растёт. Game Over по линии смерти. Restart кликом.

**Файл с детальным планом:** `plans/2026-05-20-PHASER_MIGRATION_PHASE_1_FOUNDATION.md`

**Что в скоупе:**
- Vite + Phaser + TS-скелет
- Matter physics конфиг
- Cup (статичные стенки + дно)
- Shape (`Matter.Sprite` с типом + цветом)
- Spawner (waiting-shape в зоне спавна, следует за курсором)
- InputController (drag horizontal, release to drop)
- ChainDetector (BFS по contact pairs, цепочка 4+, стабильность 1.8s)
- Collapse (удаление тел + эмит события)
- Game Over (death line touch ≥10s)
- Базовый счётчик очков (formula из PROJECT_OVERVIEW.md §15)
- Restart-flow

**Что НЕ в скоупе Phase 1** (откладываем):
- HUD (только debug-text для score)
- Уровни и cosmometer (только уровень 1, 4 цвета, без поворота)
- Combo system
- Bubbles
- Bonuses
- Shop
- Звук
- Menu scenes
- Yandex SDK
- Локализация
- Скины (используется одна жёстко зашитая палитра)

---

## Phase 2: HUD, Progression, Combo

**Outcome:** Игра показывает score/coins/level в HUD; уровни сменяются по триггеру `ToNextLevel = floor(prev × 1.2)` (L1=10); добавляются цвета (4→7) и поворот фигур (L6+); Cosmometer-шкала с energy и множителем ×1/×2/×3/×5; combo-окна (×2…×5) детектируются и показываются как floating-text.

**Файлы (будущие, на этапе планирования):**
- `src/game/Level.ts` — текущий уровень, прогресс, переходы
- `src/game/Cosmometer.ts` — energy/multiplier state machine
- `src/game/Combo.ts` — combo windows, multiplier
- `src/ui/HUD.ts` — Phaser Container, score/coins/level/progress
- `src/ui/CosmometerBar.ts` — термометр-шкала
- `src/data/balance.ts` — все константы из PROJECT_OVERVIEW.md §8-9
- `tests/level.test.ts`, `tests/cosmometer.test.ts`, `tests/combo.test.ts`

**Что переносится из PROJECT_OVERVIEW.md:**
- §5 Colors (4 на старте, +1 каждые 5 уровней, cap=7)
- §8 Levels & Difficulty (формула + влияние)
- §9 Cosmometer (energy rules, thresholds)
- §7 Combo Windows (2-5 цепочек в окнах 3/6/9/12 сек)
- §15 Scoring formulas (NR, ChainBonus, NLR)

---

## Phase 3: Skin System — ПОГЛОЩЕНО Phase 1.5

> Идея «менять только текстуры по скину» расширена до полной data-driven системы фигур: каждая фигура определяется JSON-файлом со спрайт-слоями + физикой + анимациями. См. `2026-05-21-PHASE_1_5A_SHAPE_PACK_RUNTIME.md` и `2026-05-21-PHASE_1_5B_SHAPE_EDITOR.md`. Phase 3 как отдельный этап удаляется.

### Old (deprecated) outcome description:
Все визуальные ассеты (спрайты фигур, стакан, фон, иконки бонусов) подгружаются через JSON-манифест скина. Смена скина = одна строка `SkinSystem.apply('neon')` → все объекты перерисовываются с новых текстур без рестарта сцены. Минимум 2 готовых скина в репозитории (`default`, `neon`).

**Файлы (будущие):**
- `src/systems/SkinSystem.ts` — singleton, активный скин, swap-логика
- `src/data/skins/default.json` — манифест дефолтного скина
- `src/data/skins/neon.json` — манифест неонового скина
- `public/assets/skins/default/...` — PNG (портированы из `assets/shape_sprites/pack_default/`)
- `public/assets/skins/neon/...` — новые PNG
- `tests/skin-system.test.ts`

**JSON-схема скина:**
```json
{
  "id": "default",
  "name": "Classic",
  "shapes": {
    "circle":   { "texture": "shape_circle",   "scale": 1.0 },
    "triangle": { "texture": "shape_triangle", "scale": 1.0 },
    "square":   { "texture": "shape_square",   "scale": 1.0 },
    "...": "..."
  },
  "cup": { "texture": "cup_glass_blue" },
  "background": { "texture": "bg_space" },
  "particles": { "tint": "0x66ccff" }
}
```

**Преимущество для agent-driven dev:** добавить новый скин = положить PNG + JSON. Агент не трогает движковый код.

---

## Phase 4: Audio

**Outcome:** При входе в игру играет BGM уровня (level-banded: 1-4 / 5-8 / 9-12 / 13+), переключение по уровню через crossfade; 28 SFX из старого проекта подключены к событиям (спавн, drop, impact, chain, combo, level-up, game-over); WebAudio unlock-flow для Safari; mute/volume сохраняются в localStorage.

**Файлы (будущие):**
- `src/audio/AudioManager.ts` — обёртка над Phaser sound с unlock-flow
- `src/audio/MusicPlayer.ts` — crossfade, level-bands
- `src/data/audio-manifest.ts` — список треков, маппинг event→sfx
- `public/assets/audio/bgm/` — 4 ogg-vorbis (портированы 1:1)
- `public/assets/audio/sfx/` — 28 файлов

---

## Phase 5: Bubbles & Bonuses

**Outcome:** После collapse цепочки с шансом базовых вероятностей появляются пузыри, плывут вверх волнообразно, лопаются по тапу, дают reward (40% монет / 45% очков / 12% instant / 0.1%×level consumable). Instant bonuses: Hail of Shapes, Color Grenade. Consumable bonuses: Touch-to-Kill (10s), Machine Gun (~10 выстрелов). Кулдаун consumable — 5 мин, состояние сохраняется.

**Файлы (будущие):**
- `src/game/bubbles/Bubble.ts`
- `src/game/bubbles/BubbleSpawner.ts`
- `src/game/bubbles/RewardDistributor.ts`
- `src/game/bonuses/Hail.ts`
- `src/game/bonuses/ColorGrenade.ts`
- `src/game/bonuses/TouchToKill.ts`
- `src/game/bonuses/MachineGun.ts`
- `src/data/bubbles.ts`, `src/data/bonuses.ts`
- `tests/reward-distributor.test.ts`

**Спецификация:** PROJECT_OVERVIEW.md §10-13 + `BUBBLES_SYSTEM.md`.

---

## Phase 6: Shop & Persistence

**Outcome:** Магазин с 4 апгрейдами (Coin Multiplier, Score Multiplier, Bonus Drop Chance, Bonus Upgrade) по геометрической цене 100→200→500→1000→2000→5000→10000; покупка consumable bonuses за монеты; всё сохраняется в localStorage (а после Phase 8 — в Yandex Cloud). При запуске игры состояние восстанавливается.

**Файлы (будущие):**
- `src/shop/ShopModel.ts` — состояние апгрейдов, цены, применение
- `src/shop/Persistence.ts` — save/load в localStorage (с throttle 10s)
- `src/data/shop-catalog.ts` — данные апгрейдов и IAP
- `tests/shop-model.test.ts`, `tests/persistence.test.ts`

**Спецификация:** PROJECT_OVERVIEW.md §14, `inapp.md`.

---

## Phase 7: Menu Scenes

**Outcome:** Phaser scenes: `MenuScene` (Home — Play/Shop/Settings/Leaderboards), `ShopScene` (UI магазина), `SettingsScene` (язык, звук), `LeaderboardScene` (топ-10). Tutorial-overlay в `GameScene` для первой сессии (палец, стрелки, инструкция). Pause/GameOver overlay в `GameScene`.

**Файлы (будущие):**
- `src/scenes/MenuScene.ts`, `src/scenes/ShopScene.ts`, `src/scenes/SettingsScene.ts`, `src/scenes/LeaderboardScene.ts`
- `src/ui/Tutorial.ts`
- `src/ui/PauseOverlay.ts`, `src/ui/GameOverOverlay.ts`
- `src/ui/Button.ts` — переиспользуемый компонент

**Замечание:** Phaser-native UI намного компактнее старого `canvas_shell.js` + `canvas_overlays.js`. Хитбоксинг через `setInteractive()`, без ручного code.

---

## Phase 8: Yandex SDK Integration

**Outcome:** SDK инициализируется при старте, `gameReady()` вызывается после Phase 1 preload; авторизация по action; cloud save заменяет localStorage с fallback'ом; all-time leaderboard + новый **weekly leaderboard** с сезонным сбросом; rewarded ads на game-over (3/run, 70/50/30% шансов continue); interstitial на retry (3-session warmup, 180s cooldown); IAP-каталог; pause/resume hooks от SDK.

**Файлы (будущие):**
- `src/sdk/YandexSDK.ts` — обёртка над глобальным `ysdk`
- `src/sdk/CloudSave.ts` — async-обёртка с throttle
- `src/sdk/Leaderboards.ts` — all-time + weekly
- `src/sdk/Ads.ts` — rewarded + interstitial state machine
- `src/sdk/IAP.ts` — catalog, entitlements, consumables
- `tests/cloud-save-format.test.ts`

**Спецификация:** `ADS_AND_REWARDS_SPEC.md`, `inapp.md`, старый `scripts/sdk/providers/yandex.js`.

---

## Phase 9: Localization

**Outcome:** Поддержка 5 языков: RU, EN, TR, KZ, UA. Yandex SDK выдаёт `getLanguage()` — выбираем словарь, fallback RU. Все строки UI извлечены в JSON. Settings показывает language toggle только если SDK не выдал язык.

**Файлы (будущие):**
- `src/i18n/I18n.ts`
- `src/i18n/locales/ru.json`, `en.json`, `tr.json`, `kz.json`, `uk.json`
- `tests/i18n.test.ts`

---

## Phase 10: Production Build & Yandex Submit

**Outcome:** `npm run build:yandex` → `dist/` + `cosmix-v2.zip`, размер ≤8MB; loading-screen с прогресс-баром <2s до первого кадра; sprite-atlas для шрифтов/UI; lazy-load BGM (только текущий уровень-band); zip пройден через Yandex SDK validator; submission в каталог как «major update» к существующему листингу (если он восстанавливается) или новый листинг.

**Файлы (будущие):**
- `scripts/build-yandex.ts` — Node-скрипт для post-build zip
- `scripts/optimize-assets.ts` — atlas + ogg-recompress
- `public/index.html` — финальная разметка с loader

---

## Что НЕ переносится из старого проекта

- Кастомный canvas-shell (Home/Shop/Settings/Leaderboards в canvas) — заменяется Phaser scenes
- DOM-fallback UI пути — единый Phaser-рендер
- Esbuild + obfuscation pipeline — заменяется Vite
- `scripts/ui/canvas_overlays.js` — заменяется Phaser scenes/overlays
- Ручной hit-testing для canvas-UI — `setInteractive()`
- Двойной билд (obfuscated + plain) — только один прод-билд

## Что переносится из старого проекта 1:1 (с типизацией)

- Yandex SDK wrapper (`scripts/sdk/providers/yandex.js` → `src/sdk/YandexSDK.ts`)
- Все формулы баланса (`scripts/game/state.js`, `config.js` → `src/data/balance.ts`)
- IAP-каталог и entitlements (`scripts/shop/...` → `src/shop/...`)
- i18n словари RU/EN
- Audio-ассеты (4 BGM + 28 SFX)
- Cloud-save формат (для возможной миграции прогресса существующих игроков)
- IAP product IDs (если они уже зарегистрированы у Яндекса)
- Все PNG-ассеты как пак скина `default`

---

## Migration risk register

| Риск | Митигация |
|---|---|
| Phaser-Matter версии расходятся в API с самописной обёрткой | Прототип в Phase 1 проверяет ключевые ops: contact pairs, body removal, sleeping |
| Размер билда +200KB Phaser убьёт TTI на 4G | Phase 10: atlas + lazy BGM + gzip; Yandex CDN норм отдаёт |
| Cloud-save формат поменяется → старые игроки потеряют монеты | Phase 8: миграционный шим, читает старый формат если новый пуст |
| Yandex SDK pause/resume не маппится на Phaser scenes | Phase 8: `scene.scene.pause()` + audio mute; интеграционный тест |
| Скин-система ломается при добавлении новых типов фигур | Phase 3: тест с подменой одного типа на отсутствующий → graceful fallback на default |
| 6-7 недель work без релиза → демотивация | Phase 1 уже даёт playable build; релонч возможен после Phase 8 даже без Phase 5 (без пузырей) |

---

## Self-Review

**Spec coverage:**
- ✅ Core gameplay (Phase 1, 2)
- ✅ Skin system как главная цель миграции (Phase 3)
- ✅ Audio (Phase 4)
- ✅ Bubbles + bonuses (Phase 5)
- ✅ Shop + IAP (Phase 6, 8)
- ✅ UI/scenes (Phase 7)
- ✅ Yandex SDK (Phase 8)
- ✅ i18n (Phase 9)
- ✅ Production (Phase 10)
- ✅ Tutorial (Phase 7)
- ✅ Daily quests / weekly leaderboard / косметика — отмечены как добавления в Phase 2/7/8 (новый функционал, не паритет)

**Что отложено за пределы plan-серии** (не блокирует релонч):
- A/B иконок (это маркетинговая работа, не код)
- Превью-видео для каталога (маркетинговая работа)
- Кампания подачи на фичеринг (после Phase 10)

**Placeholder scan:** В roadmap-документе допустимы крупные мазки — детальные плейсхолдеры будут разрешены в каждом phase-плане отдельно.

---

## Execution sequencing

Я **сильно рекомендую** делать фазы строго последовательно, не параллельно, потому что:
1. Каждая фаза опирается на API предыдущей (`SkinSystem.apply()` нужен в Phase 5 для бонус-иконок).
2. Solo-dev с агентами выигрывает от линейности — меньше контекста переключать.
3. После каждой фазы — короткий QA-проход в браузере и коммит. Можно показывать прогресс.

**Исключение:** Phase 3 (Skin System) и Phase 4 (Audio) технически независимы и могут идти в любом порядке после Phase 2. Я ставлю Skin раньше, потому что это **ключевой driver миграции** — её работающая демо валидирует, что архитектурное решение себя оправдывает.

---

## После завершения миграции

Это не финал — это база для дальнейших фич:
- Daily login bonus (3-7 дней работы, на новой архитектуре — тривиально)
- Daily quests (1 неделя)
- Сезонные скины / pass (Phase 3 уже даёт фундамент)
- A/B-тестирование баланса (data в JSON = смена без сборки)
- Новые типы фигур (один JSON + PNG)
- Возможный Android-порт через Capacitor (Phaser+TS легко портируется)
