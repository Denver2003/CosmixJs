const SHOP_KEY = "cosmix.shop";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage || null;
  } catch (error) {
    return null;
  }
}

function sanitizeLevel(value, max = 7) {
  const level = Number.parseInt(value, 10);
  if (!Number.isFinite(level) || level < 0) {
    return 0;
  }
  return Math.min(level, max);
}

export function loadShopProgress() {
  const storage = getStorage();
  if (!storage) {
    return {
      upgrades: {
        coin_multiplier: 0,
        score_multiplier: 0,
        bonus_drop: 0,
        bonus_upgrade: 0,
      },
      removeAds: false,
    };
  }
  const raw = storage.getItem(SHOP_KEY);
  if (!raw) {
    return {
      upgrades: {
        coin_multiplier: 0,
        score_multiplier: 0,
        bonus_drop: 0,
        bonus_upgrade: 0,
      },
      removeAds: false,
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      upgrades: {
        coin_multiplier: sanitizeLevel(parsed?.upgrades?.coin_multiplier),
        score_multiplier: sanitizeLevel(parsed?.upgrades?.score_multiplier),
        bonus_drop: sanitizeLevel(parsed?.upgrades?.bonus_drop),
        bonus_upgrade: sanitizeLevel(parsed?.upgrades?.bonus_upgrade),
      },
      removeAds: Boolean(parsed?.removeAds),
    };
  } catch (error) {
    return {
      upgrades: {
        coin_multiplier: 0,
        score_multiplier: 0,
        bonus_drop: 0,
        bonus_upgrade: 0,
      },
      removeAds: false,
    };
  }
}

export function saveShopProgress(progress) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const payload = {
    upgrades: {
      coin_multiplier: sanitizeLevel(progress?.upgrades?.coin_multiplier),
      score_multiplier: sanitizeLevel(progress?.upgrades?.score_multiplier),
      bonus_drop: sanitizeLevel(progress?.upgrades?.bonus_drop),
      bonus_upgrade: sanitizeLevel(progress?.upgrades?.bonus_upgrade),
    },
    removeAds: Boolean(progress?.removeAds),
  };
  storage.setItem(SHOP_KEY, JSON.stringify(payload));
  return true;
}
