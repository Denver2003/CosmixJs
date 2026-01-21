import { CLOUD_SAVE_THROTTLE_MS } from "../config.js";
import { initSdk } from "../sdk/index.js";

let pendingPayload = null;
let lastSaveAttemptAt = 0;
let saveTimer = 0;
let inFlight = null;
let rescheduleAfterFlight = false;

export async function loadCloudState() {
  const sdk = await initSdk();
  if (!sdk?.cloud?.load) {
    return null;
  }
  try {
    return await sdk.cloud.load();
  } catch (error) {
    return null;
  }
}

export function queueCloudSave(payload, { force = false } = {}) {
  if (payload && typeof payload === "object") {
    pendingPayload = payload;
  }
  if (force) {
    return flushCloudSave({ ignoreThrottle: true });
  }
  scheduleCloudSave();
  return Promise.resolve(false);
}

export async function flushCloudSave({ ignoreThrottle = false } = {}) {
  if (inFlight) {
    rescheduleAfterFlight = true;
    return inFlight;
  }
  if (!pendingPayload) {
    return false;
  }
  const now = Date.now();
  if (
    !ignoreThrottle &&
    lastSaveAttemptAt > 0 &&
    now - lastSaveAttemptAt < CLOUD_SAVE_THROTTLE_MS
  ) {
    scheduleCloudSave();
    return false;
  }
  const payload = pendingPayload;
  pendingPayload = null;
  lastSaveAttemptAt = now;
  clearCloudTimer();
  inFlight = (async () => {
    const sdk = await initSdk();
    if (!sdk?.cloud?.save) {
      pendingPayload = payload;
      return false;
    }
    let ok = false;
    try {
      ok = await sdk.cloud.save(payload);
    } catch (error) {
      ok = false;
    }
    if (!ok && !pendingPayload) {
      pendingPayload = payload;
    }
    return ok;
  })();
  const result = await inFlight;
  inFlight = null;
  if (rescheduleAfterFlight) {
    rescheduleAfterFlight = false;
    scheduleCloudSave();
  } else if (pendingPayload) {
    scheduleCloudSave();
  }
  return result;
}

function scheduleCloudSave() {
  if (!pendingPayload) {
    return;
  }
  if (inFlight) {
    rescheduleAfterFlight = true;
    return;
  }
  if (saveTimer) {
    return;
  }
  const now = Date.now();
  const elapsed = lastSaveAttemptAt > 0 ? now - lastSaveAttemptAt : CLOUD_SAVE_THROTTLE_MS;
  const delay = elapsed >= CLOUD_SAVE_THROTTLE_MS ? 0 : CLOUD_SAVE_THROTTLE_MS - elapsed;
  saveTimer = setTimeout(() => {
    saveTimer = 0;
    flushCloudSave();
  }, delay);
}

function clearCloudTimer() {
  if (!saveTimer) {
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = 0;
}
