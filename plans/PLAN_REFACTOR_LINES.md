# PLAN_REFACTOR_LINES — Split lines.js

- [x] Шаг 1: Вынести HUD (верх, прогресс, космометр) в `scripts/game/lines/hud.js`.
- [x] Шаг 2: Вынести оверлеи (pause/autopause, touch overlay) в `scripts/game/lines/overlays.js`.
- [x] Шаг 3: Вынести вспомогательные утилиты (roundRectPath, blend, parse) в `scripts/game/lines/utils.js`.
- [x] Шаг 4: Упростить `scripts/game/lines.js` до оркестратора.
- [x] Шаг 5: Обновить `PROJECT.md` с новым разбиением.
