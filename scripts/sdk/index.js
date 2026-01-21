import { createMockSdk } from "./providers/mock.js";
import { createYandexSdk } from "./providers/yandex.js";

let sdk = createMockSdk();
let sdkState = {
  name: sdk.name,
  ready: false,
  error: null,
};
let initPromise = null;
let loadPromise = null;
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

export function setSdkCallbacks({ onPause, onResume } = {}) {
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

function selectProvider() {
  if (typeof window !== "undefined" && window.YaGames?.init) {
    return createYandexSdk(sdkCallbacks);
  }
  return createMockSdk();
}

function ensureYandexSdk() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }
  if (window.YaGames?.init) {
    return Promise.resolve(true);
  }
  if (!shouldLoadYandexSdk()) {
    return Promise.resolve(false);
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://yandex.ru/games/sdk/v2";
    script.async = true;
    script.onload = () => resolve(Boolean(window.YaGames?.init));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loadPromise;
}

function shouldLoadYandexSdk() {
  if (typeof window === "undefined") {
    return false;
  }
  const protocol = window.location?.protocol || "";
  if (protocol === "file:") {
    return false;
  }
  const host = window.location?.hostname || "";
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local")
  ) {
    return false;
  }
  return true;
}
