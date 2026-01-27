import { getSdk, initSdk } from "../sdk/index.js";
import { setAppState, getAppState } from "../shell/app_state.js";
import { YANDEX_LEADERBOARD_ID } from "../config.js";
import { trackLeaderboardSubmit } from "../analytics/events.js";

const DEFAULT_LIMIT = 10;

export async function submitLeaderboardScore(score) {
  await initSdk();
  const sdk = getSdk();
  if (!sdk?.leaderboards?.submitScore) {
    trackLeaderboardSubmit({
      leaderboardId: YANDEX_LEADERBOARD_ID,
      score,
      ok: false,
    });
    return false;
  }
  const safeScore = Math.max(0, Math.floor(score || 0));
  try {
    const ok = await sdk.leaderboards.submitScore(YANDEX_LEADERBOARD_ID, safeScore);
    trackLeaderboardSubmit({
      leaderboardId: YANDEX_LEADERBOARD_ID,
      score: safeScore,
      ok,
    });
    return ok;
  } catch (error) {
    trackLeaderboardSubmit({
      leaderboardId: YANDEX_LEADERBOARD_ID,
      score: safeScore,
      ok: false,
    });
    return false;
  }
}

export async function refreshAllTimeLeaderboard() {
  await initSdk();
  await refreshLeaderboardMeta();
  const state = getAppState();
  const current = state.leaderboards || {};
  if (current.loading) {
    return current.allTime || [];
  }
  setAppState({
    leaderboards: {
      ...current,
      loading: true,
    },
  });
  const sdk = getSdk();
  let rows = [];
  try {
    if (sdk?.leaderboards?.getEntries) {
      rows = await sdk.leaderboards.getEntries(YANDEX_LEADERBOARD_ID, {
        quantityTop: DEFAULT_LIMIT,
        includeUser: true,
        quantityAround: 1,
      });
    }
  } catch (error) {
    rows = [];
  }
  const normalized = normalizeRows(rows);
  setAppState({
    leaderboards: {
      ...current,
      allTime: normalized,
      loading: false,
      updatedAt: Date.now(),
    },
  });
  return normalized;
}

export async function refreshLeaderboardMeta() {
  await initSdk();
  const sdk = getSdk();
  if (!sdk?.leaderboards?.getMeta) {
    return null;
  }
  let meta = null;
  try {
    meta = await sdk.leaderboards.getMeta(YANDEX_LEADERBOARD_ID);
  } catch (error) {
    meta = null;
  }
  if (!meta) {
    return null;
  }
  const state = getAppState();
  const current = state.leaderboards || {};
  setAppState({
    leaderboards: {
      ...current,
      title: meta.title || current.title || null,
    },
  });
  return meta;
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter((row) => row && row.rank !== undefined && row.score !== undefined)
    .map((row) => ({
      rank: row.rank,
      name: row.name || "Guest",
      score: row.score,
      highlight: Boolean(row.highlight),
    }));
}
