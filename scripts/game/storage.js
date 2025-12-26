const COINS_KEY = "cosmix.coins";
const BONUSES_KEY = "cosmix.bonuses";

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

export function loadCoins() {
  const storage = getStorage();
  if (!storage) {
    return 0;
  }
  const raw = storage.getItem(COINS_KEY);
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

export function saveCoins(coins) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const safeCoins = Math.max(0, Math.floor(coins || 0));
  storage.setItem(COINS_KEY, String(safeCoins));
  return true;
}

export function loadBonusInventory() {
  const storage = getStorage();
  if (!storage) {
    return { touch: 0, gun: 0 };
  }
  const raw = storage.getItem(BONUSES_KEY);
  if (!raw) {
    return { touch: 0, gun: 0 };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      touch: sanitizeCount(parsed?.touch),
      gun: sanitizeCount(parsed?.gun),
    };
  } catch (error) {
    return { touch: 0, gun: 0 };
  }
}

export function saveBonusInventory(inventory) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const payload = {
    touch: sanitizeCount(inventory?.touch),
    gun: sanitizeCount(inventory?.gun),
  };
  storage.setItem(BONUSES_KEY, JSON.stringify(payload));
  return true;
}

function sanitizeCount(value) {
  const count = Number.parseInt(value, 10);
  if (!Number.isFinite(count) || count < 0) {
    return 0;
  }
  return count;
}
