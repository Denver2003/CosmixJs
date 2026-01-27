function createId(prefix) {
  const cryptoObj =
    typeof globalThis !== "undefined" && globalThis.crypto ? globalThis.crypto : null;
  const base =
    cryptoObj && typeof cryptoObj.randomUUID === "function"
      ? cryptoObj.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${base}` : base;
}

export function createSessionId() {
  return createId("sess");
}

export function createRunId() {
  return createId("run");
}
