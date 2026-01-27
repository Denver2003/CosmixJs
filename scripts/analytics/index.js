import { ANALYTICS_PROVIDER } from "../config.js";
import { createAppMetricaAnalytics } from "./providers/appmetrica.js";
import { createNoopAnalytics } from "./providers/noop.js";

let analytics = createNoopAnalytics();
let analyticsState = {
  name: analytics.name,
  ready: false,
  error: null,
};
let initPromise = null;
let queuedEvents = [];
let context = {};

export function getAnalytics() {
  return analytics;
}

export function getAnalyticsState() {
  return { ...analyticsState };
}

export function setAnalyticsContext(next = {}) {
  if (!next || typeof next !== "object") {
    return;
  }
  context = { ...context, ...next };
}

export function clearAnalyticsContext(keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return;
  }
  const next = { ...context };
  for (const key of keys) {
    delete next[key];
  }
  context = next;
}

export async function initAnalytics() {
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
    const provider = selectProvider(ANALYTICS_PROVIDER);
    analytics = provider;
    analyticsState = {
      name: provider?.name || "unknown",
      ready: false,
      error: null,
    };
    try {
      const ok = await provider?.init?.();
      analyticsState.ready = Boolean(ok);
    } catch (error) {
      analyticsState.error = error;
      analyticsState.ready = false;
    }
    if (!analyticsState.ready && analyticsState.name !== "noop") {
      analytics = createNoopAnalytics();
      analyticsState = {
        name: analytics.name,
        ready: true,
        error: analyticsState.error,
      };
    }
    flushQueuedEvents();
    return analytics;
  })();
  return initPromise;
}

export function trackEvent(name, payload) {
  if (!name) {
    return false;
  }
  const data = { ...context, ...(payload || {}) };
  if (!analyticsState.ready) {
    queuedEvents.push({ name, payload: data });
    return false;
  }
  try {
    return Boolean(analytics.trackEvent?.(name, data));
  } catch (error) {
    return false;
  }
}

export function setAnalyticsUserId(userId) {
  try {
    return Boolean(analytics.setUserId?.(userId));
  } catch (error) {
    return false;
  }
}

function flushQueuedEvents() {
  if (!analyticsState.ready || queuedEvents.length === 0) {
    return;
  }
  const pending = queuedEvents;
  queuedEvents = [];
  for (const item of pending) {
    try {
      analytics.trackEvent?.(item.name, item.payload);
    } catch (error) {
      continue;
    }
  }
}

function selectProvider(name) {
  if (name === "appmetrica") {
    return createAppMetricaAnalytics();
  }
  return createNoopAnalytics();
}
