export function createNoopAnalytics() {
  return {
    name: "noop",
    init: async () => true,
    trackEvent: () => false,
    setUserId: () => false,
  };
}
