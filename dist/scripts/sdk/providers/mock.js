function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clonePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch (error) {
    return null;
  }
}

export function createMockSdk() {
  let adLock = false;
  let ready = true;
  let cloudStore = null;
  const sampleEntries = [
    { rank: 1, name: "You", score: 12450, highlight: true },
    { rank: 2, name: "Guest_42", score: 10880, highlight: false },
    { rank: 3, name: "PlayerX", score: 9640, highlight: false },
    { rank: 4, name: "Guest_9", score: 8210, highlight: false },
    { rank: 5, name: "Neo", score: 7980, highlight: false },
  ];

  async function runAdFlow(durationMs = 800) {
    if (!ready) {
      return false;
    }
    if (adLock) {
      return false;
    }
    adLock = true;
    await delay(durationMs);
    adLock = false;
    return true;
  }

  return {
    name: "mock",
    init: async () => true,
    isReady: () => ready,
    setReady: (next) => {
      ready = Boolean(next);
    },
    ads: {
      isAvailable: () => ready && !adLock,
      showInterstitial: async () => runAdFlow(3000),
      showRewarded: async () => runAdFlow(1200),
    },
    leaderboards: {
      submitScore: async () => true,
      getEntries: async () => sampleEntries,
      getMeta: async () => ({ title: null, description: null }),
    },
    cloud: {
      load: async () => (cloudStore ? clonePayload(cloudStore) : null),
      save: async (payload) => {
        const next = clonePayload(payload);
        if (!next) {
          return false;
        }
        cloudStore = next;
        return true;
      },
    },
    player: {
      getId: () => null,
      getName: () => null,
      getMode: () => "guest",
      requestAuthorization: async () => false,
    },
    payments: {
      isAvailable: () => false,
      getCatalog: async () => [],
      getPurchases: async () => [],
      purchase: async () => null,
      consumePurchase: async () => false,
    },
    gameReady: async () => true,
  };
}
