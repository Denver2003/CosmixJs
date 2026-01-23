export const UPGRADE_COSTS = [100, 200, 500, 1000, 2000, 5000, 10000];

export const UPGRADE_TYPES = {
  COIN_MULTIPLIER: "coin_multiplier",
  SCORE_MULTIPLIER: "score_multiplier",
  BONUS_DROP: "bonus_drop",
  BONUS_UPGRADE: "bonus_upgrade",
};

export const COIN_MULTIPLIER_LEVELS = [
  1.0,
  1.1,
  1.3,
  1.5,
  1.75,
  2.0,
  2.5,
  3.0,
];

export const SCORE_MULTIPLIER_LEVELS = [...COIN_MULTIPLIER_LEVELS];

export const BONUS_DROP_LEVELS = [0.05, 0.07, 0.1, 0.13, 0.15, 0.2, 0.3, 0.5];

export const BONUS_UPGRADE_LEVELS = [
  { id: 0, label: "Base" },
  { id: 1, label: "Instant 15%" },
  { id: 2, label: "Instant 20%" },
  { id: 3, label: "Grenade 40%" },
  { id: 4, label: "Bubble on drop 5%" },
  { id: 5, label: "Cooldown 2 min" },
  { id: 6, label: "Instant always in bubble" },
  { id: 7, label: "Consumables x5 no limit" },
];

export const SHOP_UPGRADES = [
  {
    id: UPGRADE_TYPES.COIN_MULTIPLIER,
    title: "Coin Multiplier",
    levels: COIN_MULTIPLIER_LEVELS,
  },
  {
    id: UPGRADE_TYPES.SCORE_MULTIPLIER,
    title: "Score Multiplier",
    levels: SCORE_MULTIPLIER_LEVELS,
  },
  {
    id: UPGRADE_TYPES.BONUS_DROP,
    title: "Bonus Drop",
    levels: BONUS_DROP_LEVELS,
  },
  {
    id: UPGRADE_TYPES.BONUS_UPGRADE,
    title: "Bonus Upgrade",
    levels: BONUS_UPGRADE_LEVELS,
  },
];

export const SHOP_ITEMS = [
  {
    id: "touch",
    title: "Touch to Kill",
    cost: 5000,
    grant: { key: "touch", amount: 1 },
  },
  {
    id: "gun",
    title: "Machine Gun",
    cost: 5000,
    grant: { key: "gun", amount: 1 },
  },
];

export const REAL_MONEY_ITEMS = [
  {
    id: "remove_ads",
    title: "Remove Ads",
    price: 500,
    currency: "yan",
  },
  {
    id: "coins_1000",
    title: "1000 Coins",
    price: 100,
    currency: "yan",
    grant: { key: "coins", amount: 1000 },
  },
  {
    id: "skippers_30",
    title: "30 Skippers",
    price: 200,
    currency: "yan",
    grant: { key: "skippers", amount: 30 },
  },
];

export function getUpgradePrice(level) {
  if (level < 0 || level >= UPGRADE_COSTS.length) return null;
  return UPGRADE_COSTS[level];
}

export function getUpgradeValue(type, level) {
  const entry = SHOP_UPGRADES.find((upgrade) => upgrade.id === type);
  if (!entry) return null;
  return entry.levels[level] ?? null;
}
