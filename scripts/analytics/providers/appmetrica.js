import { APP_METRICA_APP_ID, APP_METRICA_SCRIPT_URL } from "../../config.js";

let scriptPromise = null;
let modulePromise = null;
let moduleApi = null;

export function createAppMetricaAnalytics() {
  let ready = false;

  async function init() {
    if (ready) {
      return true;
    }
    if (!APP_METRICA_APP_ID) {
      return false;
    }
    const api = await loadSdk(APP_METRICA_SCRIPT_URL);
    if (!api) {
      return false;
    }
    if (typeof api === "function") {
      if (tryReport(api, "init", { appId: APP_METRICA_APP_ID })) {
        ready = true;
        return true;
      }
      api("init", { appId: APP_METRICA_APP_ID });
      ready = true;
      return true;
    }
    if (typeof api.init === "function") {
      api.init({ appId: APP_METRICA_APP_ID });
      ready = true;
      return true;
    }
    return false;
  }

  function trackEvent(name, payload) {
    if (!name) {
      return false;
    }
    const api = resolveApi();
    if (!api) {
      return false;
    }
    if (typeof api === "function") {
      if (tryReport(api, name, payload)) {
        return true;
      }
      api("event", name, payload || {});
      return true;
    }
    if (typeof api.reportEvent === "function") {
      api.reportEvent(name, payload || {});
      return true;
    }
    if (typeof api.event === "function") {
      api.event(name, payload || {});
      return true;
    }
    return false;
  }

  function setUserId(userId) {
    const api = resolveApi();
    if (!api || !userId) {
      return false;
    }
    if (typeof api === "function") {
      api("setUserID", String(userId));
      return true;
    }
    if (typeof api.setUserID === "function") {
      api.setUserID(String(userId));
      return true;
    }
    if (typeof api.setUserId === "function") {
      api.setUserId(String(userId));
      return true;
    }
    return false;
  }

  return {
    name: "appmetrica",
    init,
    trackEvent,
    setUserId,
    isReady: () => ready,
  };
}

function resolveApi() {
  if (typeof window === "undefined") {
    return null;
  }
  return moduleApi || window.appmetrica || window.AppMetrica || null;
}

function loadScriptOnce(src) {
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("document not available"));
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("appmetrica script failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function loadSdk(src) {
  if (!src) {
    return resolveApi();
  }
  if (isModuleUrl(src)) {
    return loadModuleOnce(src);
  }
  await loadScriptOnce(src);
  const api = resolveApi();
  if (api) {
    return api;
  }
  const fallback = inferEsmUrl(src);
  if (fallback) {
    return loadModuleOnce(fallback);
  }
  return null;
}

function isModuleUrl(src) {
  return /\+esm\b|\.mjs\b|\?module\b/i.test(src);
}

function inferEsmUrl(src) {
  if (isModuleUrl(src)) {
    return null;
  }
  if (/\.js\b/i.test(src)) {
    return null;
  }
  return src.endsWith("/") ? `${src}+esm` : `${src}/+esm`;
}

async function loadModuleOnce(src) {
  if (modulePromise) {
    await modulePromise;
    return resolveApi();
  }
  modulePromise = import(src)
    .then((mod) => {
      moduleApi = mod?.default || mod?.appmetrica || mod?.AppMetrica || null;
      return moduleApi;
    })
    .catch(() => null);
  await modulePromise;
  return resolveApi();
}

function tryReport(api, name, payload) {
  try {
    api("reportEvent", name, payload || {});
    return true;
  } catch (error) {
    return false;
  }
}
