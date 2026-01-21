const COINS_KEY = "cosmix.coins";
const BONUSES_KEY = "cosmix.bonuses";
const BEST_SCORE_KEY = "cosmix.best_score";
const AUDIO_KEY = "cosmix.audio";
const TUTORIAL_KEY = "cosmix.tutorial";

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

export function loadBestScore() {
  const storage = getStorage();
  if (!storage) {
    return 0;
  }
  const raw = storage.getItem(BEST_SCORE_KEY);
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

export function saveBestScore(score) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const safeScore = Math.max(0, Math.floor(score || 0));
  storage.setItem(BEST_SCORE_KEY, String(safeScore));
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

export function loadAudioSettings() {
  const storage = getStorage();
  if (!storage) {
    return { music: 70, sfx: 80, mute: false };
  }
  const raw = storage.getItem(AUDIO_KEY);
  if (!raw) {
    return { music: 70, sfx: 80, mute: false };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      music: sanitizePercent(parsed?.music, 70),
      sfx: sanitizePercent(parsed?.sfx, 80),
      mute: Boolean(parsed?.mute),
    };
  } catch (error) {
    return { music: 70, sfx: 80, mute: false };
  }
}

export function saveAudioSettings(settings) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const payload = {
    music: sanitizePercent(settings?.music, 70),
    sfx: sanitizePercent(settings?.sfx, 80),
    mute: Boolean(settings?.mute),
  };
  storage.setItem(AUDIO_KEY, JSON.stringify(payload));
  return true;
}

export function loadTutorialProgress() {
  const storage = getStorage();
  if (!storage) {
    return { completed: false };
  }
  const raw = storage.getItem(TUTORIAL_KEY);
  if (!raw) {
    return { completed: false };
  }
  try {
    const parsed = JSON.parse(raw);
    return { completed: Boolean(parsed?.completed) };
  } catch (error) {
    return { completed: false };
  }
}

export function saveTutorialProgress(completed) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const payload = { completed: Boolean(completed) };
  storage.setItem(TUTORIAL_KEY, JSON.stringify(payload));
  return true;
}

export function resetTutorialProgress() {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  storage.removeItem(TUTORIAL_KEY);
  return true;
}

function sanitizeCount(value) {
  const count = Number.parseInt(value, 10);
  if (!Number.isFinite(count) || count < 0) {
    return 0;
  }
  return count;
}

function sanitizePercent(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
}
