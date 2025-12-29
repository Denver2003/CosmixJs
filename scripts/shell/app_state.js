const subscribers = new Set();

const state = {
  userName: "Guest",
  coins: 1882,
  bestScore: 12450,
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
