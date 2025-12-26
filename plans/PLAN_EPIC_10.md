# PLAN_EPIC_10 — App Shell / Windows

Принцип: универсальная структура, без жёстких связок с конкретной игрой (макс. переиспользуемо).

- [ ] Шаг 1: Базовая архитектура экранов — ShellCanvas/OverlayCanvas, ScreenManager/Router, навигация Back/ESC.
- [ ] Шаг 2: HeaderBar компонент (Back/Title/Coins/Best по контексту), единые стили кнопок/иконок.
- [ ] Шаг 3: Экран Home по макету (фон, CTA Play, нижние кнопки Shop/Leaders/Settings).
- [ ] Шаг 4: Экран Shop (Tabs: Upgrades/Items, карточки апгрейдов/consumables).
- [ ] Шаг 5: Экран Settings (Audio/Account/Data, confirm dialog).
- [ ] Шаг 6: Экран Leaderboards (Tabs All-Time/Weekly, список, строка You).
- [ ] Шаг 7: OverlayCanvas + ConfirmDialog + базовые popup/toast заглушки.
