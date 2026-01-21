const ADS_KEY = "cosmix.ads";

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

function clampNumber(value, min = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return min;
  }
  return Math.max(min, num);
}

export function loadAdsState() {
  const storage = getStorage();
  if (!storage) {
    return {
      sessionCount: 0,
      lastInterstitialAt: 0,
      rewardedShopWatchTimes: [],
      totalSpentCoins: 0,
    };
  }
  const raw = storage.getItem(ADS_KEY);
  if (!raw) {
    return {
      sessionCount: 0,
      lastInterstitialAt: 0,
      rewardedShopWatchTimes: [],
      totalSpentCoins: 0,
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      sessionCount: clampNumber(parsed?.sessionCount, 0),
      lastInterstitialAt: clampNumber(parsed?.lastInterstitialAt, 0),
      rewardedShopWatchTimes: Array.isArray(parsed?.rewardedShopWatchTimes)
        ? parsed.rewardedShopWatchTimes.map((item) => clampNumber(item, 0)).filter((item) => item > 0)
        : [],
      totalSpentCoins: clampNumber(parsed?.totalSpentCoins, 0),
    };
  } catch (error) {
    return {
      sessionCount: 0,
      lastInterstitialAt: 0,
      rewardedShopWatchTimes: [],
      totalSpentCoins: 0,
    };
  }
}

export function saveAdsState(state) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const payload = {
    sessionCount: clampNumber(state?.sessionCount, 0),
    lastInterstitialAt: clampNumber(state?.lastInterstitialAt, 0),
    rewardedShopWatchTimes: Array.isArray(state?.rewardedShopWatchTimes)
      ? state.rewardedShopWatchTimes.map((item) => clampNumber(item, 0)).filter((item) => item > 0)
      : [],
    totalSpentCoins: clampNumber(state?.totalSpentCoins, 0),
  };
  storage.setItem(ADS_KEY, JSON.stringify(payload));
  return true;
}
