# PLAN_EPIC_14.7 — Telemetry / Analytics (AppMetrica + Provider Abstraction)

- [x] Шаг 1: Зафиксировать схему событий и точки отправки.
- [x] Шаг 2: Добавить модуль аналитики (абстракция провайдера + AppMetrica + noop), плейсхолдеры в config.
- [x] Шаг 3: Инициализировать аналитику в main.js, генерировать session_id и run_id.
- [x] Шаг 4: Проставить события по UI/игре/бонусам/магазину/рекламе/облаку.
- [ ] Шаг 5: Обновить PROJECT.md.

## Схема событий (v1)

Базовые поля:
- session_id (string)
- sdk_name (string, только для session_start)
- lang (string, только для session_start)
- run_id (string, для событий забега)
- ts (unix ms, добавляется на уровне SDK)

События:
- session_start { session_id, sdk_name, lang }
- session_end { session_id, duration_ms, reason }

- screen_open { session_id, screen_id }
- overlay_open { session_id, overlay_id }
- ui_click { session_id, screen_id, control_id, input_method }

- run_start { session_id, run_id, source }
- run_end { session_id, run_id, reason, duration_ms, level, score, total_drops }
- level_up { session_id, run_id, level }

- bonus_use { session_id, run_id, bonus_id, source }
- bonus_award { session_id, run_id, bonus_id, source }

- shop_open { session_id }
- shop_purchase_attempt { session_id, item_id, price, currency }
- shop_purchase_success { session_id, item_id, price, currency }
- shop_purchase_fail { session_id, item_id, price, currency, reason }

- iap_purchase_attempt { session_id, product_id }
- iap_purchase_success { session_id, product_id }
- iap_purchase_fail { session_id, product_id, reason }

- shop_reward_attempt { session_id }
- shop_reward_success { session_id }
- shop_reward_fail { session_id, reason }

- ad_show { session_id, ad_type, placement }
- ad_result { session_id, ad_type, placement, outcome }

- leaderboard_submit { session_id, leaderboard_id, score, ok }
- cloud_save_success { session_id }
- cloud_save_fail { session_id, reason }

## Контекст и справочники

ScreenId: home/shop/settings/leaderboards/game.
OverlayId: pause/game_over/confirm/ads_interstitial.
AdType: interstitial/rewarded/banner.
Placement: game_over_retry/game_over_continue/shop_reward.
InputMethod: mouse/touch/pen/keyboard/unknown.
BonusId: touch/gun/grenade/hail.

## Примечания
- Событий на каждый дроп нет; количество дропов агрегируется в run_end.total_drops.
- bonus_award отправляется только для instant/consumable наград.
- Прогресс по уровню фиксируется через level_up и итоговые поля run_end.level/score/total_drops.
- AppMetrica App ID добавляется позже; API key не используется в клиенте.
