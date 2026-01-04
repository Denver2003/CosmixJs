const subscribers = new Set();

import { loadBestScore, loadCoins } from "../game/storage.js";

const state = {
  userName: "Guest",
  coins: loadCoins(),
  bestScore: loadBestScore(),
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
