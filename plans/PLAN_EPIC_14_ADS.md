# PLAN_EPIC_14 — Ads & Rewards (Mock)

- [x] Шаг 1: Добавить ads runtime/storage (sessionCount, lastInterstitialAt, rewardedShopWatchTimes, totalSpentCoins, continueCount) + флаг remove ads (interstitial/banner only).
- [x] Шаг 2: Внедрить mock SDK wrapper + adLock + пауза/резюм при показе.
- [x] Шаг 3: Game Over → Continue rewarded (3 попытки, очистка 70/50/30%, grace 2.5s).
- [x] Шаг 4: Retry → Interstitial по cooldown/счетчику сессий (3 сессии, 180с).
- [x] Шаг 5: Shop → Watch Ad +X coins (лимит 5/час, формула награды).
- [x] Шаг 6: Обновить `PROJECT.md`.
