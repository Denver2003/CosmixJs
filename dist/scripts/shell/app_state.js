const subscribers = new Set();

import {
  loadAudioSettings,
  loadBestScore,
  loadCoins,
  loadSkippers,
} from "../game/storage.js";

const state = {
  userName: "Guest",
  sdkName: "mock",
  coins: loadCoins(),
  bestScore: loadBestScore(),
  skippers: loadSkippers(),
  audio: loadAudioSettings(),
  leaderboards: {
    allTime: [],
    loading: false,
    updatedAt: 0,
    title: null,
  },
  iap: {
    items: [],
    loading: false,
    updatedAt: 0,
  },
};

export function getAppState() {
  return { ...state };
}

export function setAppState(partial) {
  Object.assign(state, partial);
  for (const fn of subscribers) {
    fn(getAppState());
  }
}

export function subscribeAppState(fn) {
  if (typeof fn !== "function") {
    return () => {};
  }
  subscribers.add(fn);
  fn(getAppState());
  return () => {
    subscribers.delete(fn);
  };
}
