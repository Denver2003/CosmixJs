let adLock = false;
let sdkReady = true;

export function isAdLocked() {
  return adLock;
}

export function setAdLock(next) {
  adLock = Boolean(next);
}

export function isSdkReady() {
  return sdkReady;
}

export function setSdkReady(next) {
  sdkReady = Boolean(next);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runAdFlow(durationMs = 800) {
  if (!sdkReady) {
    return { ok: false, reason: "sdk" };
  }
  if (adLock) {
    return { ok: false, reason: "lock" };
  }
  adLock = true;
  await delay(durationMs);
  adLock = false;
  return { ok: true };
}

export async function showInterstitialSafe() {
  const result = await runAdFlow(3000);
  return result.ok;
}

export async function showRewardedSafe() {
  const result = await runAdFlow(1200);
  return result.ok;
}
