# PLAN_EPIC_YANDEX_INTEGRATION — SDK + Ads + Saves + Leaderboards

- [ ] Шаг 1: Регистрация в Яндекс, создание проекта, получение параметров SDK.
- [x] Шаг 2.1: SDK абстракция (provider + mock), перевод рекламы на SDK-слой.
- [x] Шаг 2.2: SDK bootstrap + fallback (ошибки/оффлайн), корректная пауза/возврат.
- [x] Шаг 3: Rewarded ads (continue + shop coins), interstitial (game over) на реальном SDK.
- [x] Шаг 4: Leaderboard all-time (отправка и получение, без weekly).
- [x] Шаг 5.1: Cloud saves каркас (SDK cloud + модуль sync + троттл 10с, mock).
- [x] Шаг 5.2: Cloud saves интеграция (start/game over/purchases/upgrades) + payload.
- [x] Шаг 5.3: Язык из Yandex SDK + fallback на local.
- [x] Шаг 5.4: Документация и финальная проверка (PROJECT.md).
- [ ] Шаг 6: Мини-телеметрия (session/ad/leaderboard/cloud save).
