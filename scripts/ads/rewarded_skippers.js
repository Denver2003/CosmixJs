import { getAppState, setAppState } from "../shell/app_state.js";
import { loadSkippers, saveSkippers } from "../game/storage.js";
import { queueCloudSave } from "../cloud/index.js";
import { buildCloudPayload } from "../cloud/state.js";
import { playRewarded } from "./controller.js";

export async function playRewardedOrSkipper() {
  const skippers = normalizeSkippers(getAppState().skippers ?? loadSkippers());
  if (skippers > 0) {
    const next = skippers - 1;
    saveSkippers(next);
    setAppState({ skippers: next });
    queueCloudSave(buildCloudPayload());
    return { ok: true, usedSkipper: true };
  }
  const ok = await playRewarded();
  return { ok, usedSkipper: false };
}

function normalizeSkippers(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.max(0, Math.floor(parsed));
}
