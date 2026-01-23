import { initSdk } from "./index.js";
import { setAppState } from "../shell/app_state.js";

const AUTH_PROMPT_KEY = "cosmix.auth_prompted";

export async function requestAuthorizationOnce() {
  const sdk = await initSdk();
  if (sdk?.name !== "yandex") {
    applySdkUser(sdk);
    return { prompted: false, authorized: sdk?.player?.getMode?.() === "authorized" };
  }
  const mode = sdk?.player?.getMode?.();
  if (mode === "authorized") {
    applySdkUser(sdk);
    return { prompted: false, authorized: true };
  }
  if (getPromptFlag()) {
    applySdkUser(sdk);
    return { prompted: true, authorized: false };
  }
  if (typeof sdk?.player?.requestAuthorization === "function") {
    await sdk.player.requestAuthorization();
  }
  setPromptFlag();
  applySdkUser(sdk);
  return { prompted: true, authorized: sdk?.player?.getMode?.() === "authorized" };
}

export async function requestAuthorization() {
  const sdk = await initSdk();
  if (sdk?.name !== "yandex") {
    applySdkUser(sdk);
    return false;
  }
  if (typeof sdk?.player?.requestAuthorization !== "function") {
    applySdkUser(sdk);
    return false;
  }
  const ok = await sdk.player.requestAuthorization();
  if (ok) {
    setPromptFlag();
  }
  applySdkUser(sdk);
  return ok;
}

export async function getAuthStatus() {
  const sdk = await initSdk();
  applySdkUser(sdk);
  return {
    sdkName: sdk?.name || "mock",
    authorized: sdk?.player?.getMode?.() === "authorized",
  };
}

export function isAuthPrompted() {
  return getPromptFlag();
}

export function markAuthPrompted() {
  setPromptFlag();
}

export async function syncSdkUser() {
  const sdk = await initSdk();
  applySdkUser(sdk);
}

function applySdkUser(sdk) {
  const name = sdk?.player?.getName?.();
  setAppState({ userName: name || "", sdkName: sdk?.name || "mock" });
}

function getPromptFlag() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage?.getItem(AUTH_PROMPT_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function setPromptFlag() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage?.setItem(AUTH_PROMPT_KEY, "1");
  } catch (error) {
    return;
  }
}
