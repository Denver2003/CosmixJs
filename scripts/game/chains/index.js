import {
  CHAIN_MIN,
  CHAIN_SHIMMER_COOLDOWN_MS,
  CHAIN_SHIMMER_DURATION_MS,
  CHAIN_SHIMMER_STEP_MS,
} from "../../config.js";
import { updateChainDetect } from "./detect.js";
import {
  applyChainFillStyles,
  startBurst,
  updateBurst,
  updateImpactFlash,
} from "./effects.js";

export function updateChains(state, deltaMs) {
  const prevChains = state.chainStates ? [...state.chainStates] : [];
  updateChainShimmer(state);
  updateImpactFlash(state);
  updateBurst(state);

  const { bodies, components, bodyById, removeComponents, removedCount } =
    updateChainDetect(state, deltaMs);

  scheduleChainShimmer(state, bodyById, prevChains);
  applyChainFillStyles(state, bodies, components, deltaMs);

  const removedComponentBodies = [];
  if (removedCount) {
    for (const component of removeComponents) {
      const componentBodies = [];
      for (const id of component.ids) {
        const body = bodyById.get(id);
        if (body) {
          componentBodies.push(body);
        }
      }
      startBurst(state, componentBodies);
      removedComponentBodies.push(componentBodies);
    }
  }

  return {
    removedCount,
    removedComponents: removeComponents,
    removedComponentBodies,
  };
}

function scheduleChainShimmer(state, bodyById, prevChains) {
  if (!state.chainStates || state.chainStates.length === 0) {
    return;
  }
  const now =
    state?.engine?.timing?.timestamp ??
    (typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now());

  const prevById = new Map();
  for (const prev of prevChains || []) {
    prevById.set(prev.id, prev);
  }

  for (const chainState of state.chainStates) {
    if (!chainState || chainState.ids.size < CHAIN_MIN) {
      continue;
    }
    const prevSize = prevById.get(chainState.id)?.ids?.size ?? 0;
    if (prevSize >= CHAIN_MIN) {
      continue;
    }
    const bodies = [];
    for (const id of chainState.ids) {
      const body = bodyById.get(id);
      if (body) {
        bodies.push(body);
      }
    }
    bodies.sort((a, b) => a.position.x - b.position.x);
    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      if (!body.plugin) {
        body.plugin = {};
      }
      const cooldownUntil = body.plugin.chainShimmerCooldownUntil || 0;
      if (cooldownUntil > now) {
        continue;
      }
      const hasPending = state.chainShimmerEvents?.some(
        (event) => event.bodyId === body.id && event.endMs > now
      );
      if (hasPending) {
        continue;
      }
      const startMs = now + i * CHAIN_SHIMMER_STEP_MS;
      const endMs = startMs + CHAIN_SHIMMER_DURATION_MS;
      state.chainShimmerEvents.push({
        bodyId: body.id,
        startMs,
        endMs,
      });
      body.plugin.chainShimmerCooldownUntil = now + CHAIN_SHIMMER_COOLDOWN_MS;
    }
  }
}

function updateChainShimmer(state) {
  const now =
    state?.engine?.timing?.timestamp ??
    (typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now());
  if (!state.chainShimmerProgressByBodyId) {
    state.chainShimmerProgressByBodyId = new Map();
  } else {
    state.chainShimmerProgressByBodyId.clear();
  }
  if (!state.chainShimmerEvents || state.chainShimmerEvents.length === 0) {
    return;
  }

  const nextEvents = [];
  for (const event of state.chainShimmerEvents) {
    if (!event || typeof event.endMs !== "number") {
      continue;
    }
    if (event.endMs <= now) {
      continue;
    }
    nextEvents.push(event);
    if (now < event.startMs || now > event.endMs) {
      continue;
    }
    const duration = Math.max(1, event.endMs - event.startMs);
    const progress = Math.max(0, Math.min(1, (now - event.startMs) / duration));
    state.chainShimmerProgressByBodyId.set(event.bodyId, progress);
  }
  state.chainShimmerEvents = nextEvents;
}
