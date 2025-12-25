const COINS_KEY = "cosmix.coins";

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
