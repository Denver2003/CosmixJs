# PLAN_EPIC_10 — App Shell / Windows

Принцип: универсальная структура, без жёстких связок с конкретной игрой (макс. переиспользуемо).

- [x] Шаг 1: Базовая архитектура экранов — ShellCanvas/OverlayCanvas, ScreenManager/Router, навигация Back/ESC.
- [x] Шаг 2: HeaderBar компонент (Back/Title/Coins/Best по контексту), единые стили кнопок/иконок.
- [x] Шаг 3: Экран Home по макету (фон, CTA Play, нижние кнопки Shop/Leaders/Settings).
- [x] Шаг 4: Экран Shop (Tabs: Upgrades/Items, карточки апгрейдов/consumables).
- [x] Шаг 5: Экран Settings (Audio/Account/Data, confirm dialog).
- [x] Шаг 6: Экран Leaderboards (Tabs All-Time/Weekly, список, строка You).
- [x] Шаг 7: OverlayCanvas + ConfirmDialog + базовые popup/toast заглушки.
- [x] Шаг 8: Debug-панель навигации (видна только при ?debug=1).
- [x] Шаг 9: Mock-AppState (coins/best/user) + единый апдейт Header.
- [x] Шаг 10: Базовый общий стиль (CSS-токены/палитра) + выравнивание экранов.
- [x] Шаг 11: Лёгкие переходы между экранами (fade).
- [x] Шаг 12: Старт с Home + переход Play→Game (запуск игры).
- [x] Шаг 13: Pause-меню (Restart / Home / Shop) как overlay.
- [x] Шаг 14: Подключить Pause-меню к кнопке паузы в игре.
- [x] Шаг 15: Game Over меню (Retry / Home / Shop) + внедрение.
- [ ] Шаг 14: Update PROJECT.md.
