import {
  CHAIN_ALPHA_LERP,
  CHAIN_BASE_ALPHA,
  CHAIN_DURATION_MS,
  CHAIN_GRACE_MS,
  CHAIN_MIN,
} from "../config.js";
import { hexToRgba } from "./utils.js";

const { Composite, World } = Matter;

export function updateChains(state, deltaMs) {
  state.debugLogMs += deltaMs;
  const bodies = Composite.allBodies(state.world).filter((body) => {
    if (body.isStatic || body.parent !== body) {
      return false;
    }
    if (state.waitingBody && (body === state.waitingBody || body.parent === state.waitingBody)) {
      return false;
    }
    return true;
  });
  const bodyById = new Map(bodies.map((body) => [body.id, body]));

  const adjacency = new Map();
  for (const body of bodies) {
    adjacency.set(body.id, new Set());
  }

  for (const pair of state.engine.pairs.list) {
    const bodyA = pair.bodyA.parent || pair.bodyA;
    const bodyB = pair.bodyB.parent || pair.bodyB;
    if (bodyA === bodyB) {
      continue;
    }
    if (!adjacency.has(bodyA.id) || !adjacency.has(bodyB.id)) {
      continue;
    }
    const colorA = bodyA.plugin?.color;
    const colorB = bodyB.plugin?.color;
    if (!colorA || colorA !== colorB) {
      continue;
    }
    adjacency.get(bodyA.id).add(bodyB.id);
    adjacency.get(bodyB.id).add(bodyA.id);
  }

  const visited = new Set();
  const components = [];
  for (const body of bodies) {
    if (visited.has(body.id)) {
      continue;
    }
    const color = body.plugin?.color;
    if (!color) {
      visited.add(body.id);
      continue;
    }
    const stack = [body];
    const ids = new Set();
    visited.add(body.id);
    while (stack.length) {
      const current = stack.pop();
      ids.add(current.id);
      for (const neighborId of adjacency.get(current.id) || []) {
        if (visited.has(neighborId)) {
          continue;
        }
        const neighbor = bodyById.get(neighborId);
        if (!neighbor) {
          continue;
        }
        if (neighbor.plugin?.color !== color) {
          continue;
        }
        visited.add(neighborId);
        stack.push(neighbor);
      }
    }
    components.push({ color, ids });
  }

  const hasAnyContact = adjacencyHasAny(adjacency);
  if (!hasAnyContact) {
    state.chainGraceMs += deltaMs;
  } else {
    state.chainGraceMs = 0;
  }
  const allowReset = state.chainGraceMs >= CHAIN_GRACE_MS;

  applyChainFillStyles(state, bodies, components, deltaMs);

  const matched = new Set();
  const nextStates = [];
  for (const component of components) {
    let bestMatch = null;
    let bestOverlap = 0;
    for (const prev of state.chainStates) {
      if (prev.color !== component.color || matched.has(prev.id)) {
        continue;
      }
      let overlap = 0;
      for (const id of component.ids) {
        if (prev.ids.has(id)) {
          overlap += 1;
        }
      }
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestMatch = prev;
      }
    }

    let timerMs = bestMatch ? bestMatch.timerMs : 0;
    if (component.ids.size >= CHAIN_MIN) {
      timerMs += deltaMs;
    } else if (allowReset) {
      timerMs = 0;
    }

    const id = bestMatch ? bestMatch.id : Math.random().toString(36).slice(2);
    if (bestMatch) {
      matched.add(bestMatch.id);
    }
    nextStates.push({ id, color: component.color, ids: component.ids, timerMs });
  }

  const removeIds = new Set();
  for (const stateEntry of nextStates) {
    if (stateEntry.timerMs >= CHAIN_DURATION_MS && stateEntry.ids.size >= CHAIN_MIN) {
      for (const id of stateEntry.ids) {
        removeIds.add(id);
      }
    }
  }

  if (removeIds.size) {
    const toRemove = bodies.filter((body) => removeIds.has(body.id));
    for (const body of toRemove) {
      World.remove(state.world, body);
    }
    state.chainStates = [];
    return removeIds.size;
  } else {
    state.chainStates = nextStates;
  }

  if (state.debugLogMs >= 1000) {
    const counts = components.map((component) => component.ids.size);
    const totalPairs = state.engine.pairs.list.length;
    console.log(
      "[chains]",
      "bodies:",
      bodies.length,
      "pairs:",
      totalPairs,
      "components:",
      counts
    );
    state.debugLogMs = 0;
  }

  return 0;
}

function applyChainFillStyles(state, bodies, components, deltaMs) {
  const sizeById = new Map();
  for (const component of components) {
    for (const id of component.ids) {
      sizeById.set(id, component.ids.size);
    }
  }

  for (const body of bodies) {
    const size = sizeById.get(body.id) || 1;
    const color = body.plugin?.color;
    const parts = body.parts.length > 1 ? body.parts : [body];
    let targetAlpha = CHAIN_BASE_ALPHA;
    if (size >= CHAIN_MIN) {
      const pulse = 0.5 + 0.5 * Math.sin(state.engine.timing.timestamp / 90);
      targetAlpha = 0.8 * pulse;
    } else {
      const denom = Math.max(1, CHAIN_MIN - 1);
      const t = Math.max(0, Math.min(1, (size - 1) / denom));
      const maxAlpha = 0.35;
      targetAlpha = CHAIN_BASE_ALPHA + (maxAlpha - CHAIN_BASE_ALPHA) * t;
    }
    if (!body.plugin) {
      body.plugin = {};
    }
    const currentAlpha = body.plugin.fillAlpha || CHAIN_BASE_ALPHA;
    const lerp = 1 - Math.pow(1 - CHAIN_ALPHA_LERP, deltaMs / 16.67);
    const nextAlpha = currentAlpha + (targetAlpha - currentAlpha) * lerp;
    body.plugin.fillAlpha = nextAlpha;
    if (body.plugin.customOutline) {
      for (const part of parts) {
        part.render.fillStyle = "rgba(0, 0, 0, 0)";
      }
    } else {
      const fill = color ? hexToRgba(color, nextAlpha) : "rgba(0, 0, 0, 0)";
      for (const part of parts) {
        part.render.fillStyle = fill;
      }
    }
  }
}

function adjacencyHasAny(adjacency) {
  for (const neighbors of adjacency.values()) {
    if (neighbors.size > 0) {
      return true;
    }
  }
  return false;
}
