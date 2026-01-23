import { createMockSdk } from "./providers/mock.js";
import { createYandexSdk } from "./providers/yandex.js";

let sdk = createMockSdk();
let sdkState = {
  name: sdk.name,
  ready: false,
  error: null,
};
let initPromise = null;
let gameReadySent = false;
let sdkCallbacks = {
  onPause: null,
  onResume: null,
  onLanguage: null,
};

export function getSdk() {
  return sdk;
}

export function getSdkState() {
  return { ...sdkState };
}

export function setSdkCallbacks({ onPause, onResume, onLanguage } = {}) {
  sdkCallbacks = {
    onPause: typeof onPause === "function" ? onPause : null,
    onResume: typeof onResume === "function" ? onResume : null,
    onLanguage: typeof onLanguage === "function" ? onLanguage : null,
  };
}

export async function initSdk() {
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
    await ensureYandexSdk();
    const provider = selectProvider();
    sdk = provider;
    sdkState = {
      name: provider?.name || "unknown",
      ready: false,
      error: null,
    };
    try {
      await provider?.init?.();
      sdkState.ready = true;
    } catch (error) {
      sdkState.error = error;
      sdkState.ready = false;
      if (provider?.name !== "mock") {
        const fallback = createMockSdk();
        fallback.setReady?.(false);
        sdk = fallback;
        sdkState = {
          name: fallback.name,
          ready: false,
          error,
        };
      }
    }
    return sdk;
  })();
  return initPromise;
}

export async function notifyGameReady() {
  if (gameReadySent) {
    return false;
  }
  gameReadySent = true;
  const provider = await initSdk();
  if (typeof provider?.gameReady === "function") {
    try {
      await provider.gameReady();
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

function selectProvider() {
  if (typeof window !== "undefined" && window.YaGames?.init) {
    return createYandexSdk(sdkCallbacks);
  }
  return createMockSdk();
}

function ensureYandexSdk() {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(window.YaGames?.init);
}
