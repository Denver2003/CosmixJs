export function createYandexSdk({ onPause, onResume, onLanguage } = {}) {
  let ysdk = null;
  let player = null;
  let leaderboards = null;
  let payments = null;
  let ready = false;
  let adLock = false;
  const CLOUD_KEY = "cosmix";

  async function init() {
    if (typeof window === "undefined" || !window.YaGames?.init) {
      ready = false;
      throw new Error("Yandex SDK not available");
    }
    ysdk = await window.YaGames.init();
    ready = true;
    if (typeof ysdk?.on === "function") {
      ysdk.on("game_api_pause", () => {
        onPause?.();
      });
      ysdk.on("game_api_resume", () => {
        onResume?.();
      });
    }
    onLanguage?.(ysdk?.environment?.i18n?.lang);
    try {
      player = await ysdk.getPlayer({ scopes: false });
    } catch (error) {
      player = null;
    }
    try {
      if (typeof ysdk?.getLeaderboards === "function") {
        leaderboards = await ysdk.getLeaderboards();
      }
    } catch (error) {
      leaderboards = null;
    }
    try {
      if (typeof ysdk?.getPayments === "function") {
        payments = await ysdk.getPayments();
      }
    } catch (error) {
      payments = null;
    }
    return true;
  }

  function isReady() {
    return ready;
  }

  function isAdAvailable() {
    return ready && !adLock && Boolean(ysdk?.adv);
  }

  async function ensurePlayer() {
    if (player || !ysdk?.getPlayer) {
      return player;
    }
    try {
      player = await ysdk.getPlayer({ scopes: false });
    } catch (error) {
      player = null;
    }
    return player;
  }

  function resolvePlayerMode() {
    if (!player) {
      return "guest";
    }
    if (typeof player?.isAuthorized === "function") {
      return player.isAuthorized() ? "authorized" : "guest";
    }
    if (typeof player?.getMode === "function") {
      const mode = player.getMode();
      if (mode === "full") {
        return "authorized";
      }
      if (mode === "lite") {
        return "guest";
      }
    }
    return player ? "authorized" : "guest";
  }

  async function showInterstitial() {
    if (!isAdAvailable() || !ysdk?.adv?.showFullscreenAdv) {
      return false;
    }
    if (adLock) {
      return false;
    }
    adLock = true;
    return new Promise((resolve) => {
      ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen() {},
          onClose: () => {
            adLock = false;
            resolve(true);
          },
          onError: () => {
            adLock = false;
            resolve(false);
          },
          onOffline: () => {
            adLock = false;
            resolve(false);
          },
        },
      });
    });
  }

  async function showRewarded() {
    if (!isAdAvailable() || !ysdk?.adv?.showRewardedVideo) {
      return false;
    }
    if (adLock) {
      return false;
    }
    adLock = true;
    return new Promise((resolve) => {
      let rewarded = false;
      ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen() {},
          onRewarded: () => {
            rewarded = true;
          },
          onClose: () => {
            adLock = false;
            resolve(rewarded);
          },
          onError: () => {
            adLock = false;
            resolve(false);
          },
        },
      });
    });
  }

  async function submitScore(leaderboardId, score) {
    if (!ready || !leaderboards || !leaderboardId) {
      return false;
    }
    const safeScore = Math.max(0, Math.floor(score || 0));
    try {
      await leaderboards.setLeaderboardScore(leaderboardId, safeScore);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function getEntries(leaderboardId, options = {}) {
    if (!ready || !leaderboards || !leaderboardId) {
      return [];
    }
    const payload = {
      quantityTop: options.quantityTop ?? 10,
      includeUser: Boolean(options.includeUser ?? true),
      quantityAround: options.quantityAround ?? 1,
    };
    try {
      const result = await leaderboards.getLeaderboardEntries(leaderboardId, payload);
      const entries = result?.entries || [];
      const selfId = getPlayerId();
      return entries.map((entry) => {
        const playerInfo = entry?.player || {};
        const playerId = playerInfo.uniqueID || null;
        return {
          rank: entry?.rank ?? "-",
          score: entry?.score ?? 0,
          name: playerInfo.publicName || "Guest",
          playerId,
          highlight: Boolean(selfId && playerId && selfId === playerId),
        };
      });
    } catch (error) {
      return [];
    }
  }

  async function getMeta(leaderboardId) {
    if (!ready || !leaderboards || !leaderboardId) {
      return null;
    }
    if (typeof leaderboards.getLeaderboardDescription !== "function") {
      return null;
    }
    try {
      const info = await leaderboards.getLeaderboardDescription(leaderboardId);
      return {
        title: info?.title || null,
        description: info?.description || null,
      };
    } catch (error) {
      return null;
    }
  }

  function getPlayerId() {
    if (typeof player?.getUniqueID === "function") {
      return player.getUniqueID();
    }
    return null;
  }

  async function requestAuthorization() {
    if (!ysdk?.getPlayer) {
      return false;
    }
    if (resolvePlayerMode() === "authorized") {
      return true;
    }
    try {
      if (typeof ysdk?.auth?.openAuthDialog === "function") {
        await ysdk.auth.openAuthDialog();
      }
      const next = await ysdk.getPlayer({ scopes: true });
      if (next) {
        player = next;
        return resolvePlayerMode() === "authorized";
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  async function gameReady() {
    if (!ysdk?.features?.LoadingAPI?.ready) {
      return false;
    }
    try {
      ysdk.features.LoadingAPI.ready();
      return true;
    } catch (error) {
      return false;
    }
  }

  function isPaymentsAvailable() {
    return ready && payments && typeof payments.getCatalog === "function";
  }

  async function getCatalog() {
    if (!isPaymentsAvailable()) {
      return [];
    }
    try {
      const items = await payments.getCatalog();
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  async function getPurchases() {
    if (!isPaymentsAvailable() || typeof payments.getPurchases !== "function") {
      return [];
    }
    try {
      const items = await payments.getPurchases();
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  async function purchase(productId, developerPayload) {
    if (!isPaymentsAvailable() || typeof payments.purchase !== "function") {
      return null;
    }
    if (!productId) {
      return null;
    }
    const payload = { id: productId };
    if (developerPayload) {
      payload.developerPayload = String(developerPayload);
    }
    try {
      return await payments.purchase(payload);
    } catch (error) {
      return null;
    }
  }

  async function consumePurchase(purchaseToken) {
    if (!isPaymentsAvailable() || typeof payments.consumePurchase !== "function") {
      return false;
    }
    if (!purchaseToken) {
      return false;
    }
    try {
      await payments.consumePurchase(purchaseToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function loadCloud() {
    if (!ready) {
      return null;
    }
    const current = await ensurePlayer();
    if (!current || typeof current.getData !== "function") {
      return null;
    }
    try {
      const data = await current.getData([CLOUD_KEY]);
      return data?.[CLOUD_KEY] ?? null;
    } catch (error) {
      return null;
    }
  }

  async function saveCloud(payload) {
    if (!ready) {
      return false;
    }
    if (!payload || typeof payload !== "object") {
      return false;
    }
    const current = await ensurePlayer();
    if (!current || typeof current.setData !== "function") {
      return false;
    }
    try {
      await current.setData({ [CLOUD_KEY]: payload });
      return true;
    } catch (error) {
      return false;
    }
  }

  return {
    name: "yandex",
    init,
    isReady,
    ads: {
      isAvailable: isAdAvailable,
      showInterstitial,
      showRewarded,
    },
    leaderboards: {
      submitScore,
      getEntries,
      getMeta,
    },
    cloud: {
      load: loadCloud,
      save: saveCloud,
    },
    player: {
      getId: () => getPlayerId(),
      getName: () => (typeof player?.getName === "function" ? player.getName() : null),
      getMode: () => resolvePlayerMode(),
      requestAuthorization,
    },
    payments: {
      isAvailable: isPaymentsAvailable,
      getCatalog,
      getPurchases,
      purchase,
      consumePurchase,
    },
    gameReady,
  };
}
