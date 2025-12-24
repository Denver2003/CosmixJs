import { CHAIN_DURATION_MS, CHAIN_GRACE_MS, CHAIN_MIN } from "../../config.js";

const { Composite } = Matter;

export function updateChainDetect(state, deltaMs) {
  state.debugLogMs += deltaMs;
  const bodies = Composite.allBodies(state.world).filter((body) => {
    if (body.isStatic || body.parent !== body) {
      return false;
    }
    if (state.waitingBody && (body === state.waitingBody || body.parent === state.waitingBody)) {
      return false;
    }
    if (body.plugin?.burst?.active) {
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
  const removeComponents = [];
  for (const stateEntry of nextStates) {
    if (stateEntry.timerMs >= CHAIN_DURATION_MS && stateEntry.ids.size >= CHAIN_MIN) {
      removeComponents.push(stateEntry);
      for (const id of stateEntry.ids) {
        removeIds.add(id);
      }
    }
  }

  if (removeIds.size) {
    state.chainStates = [];
    return { bodies, components, bodyById, removeComponents, removedCount: removeIds.size };
  }

  state.chainStates = nextStates;

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

  return { bodies, components, bodyById, removeComponents: [], removedCount: 0 };
}

function adjacencyHasAny(adjacency) {
  for (const neighbors of adjacency.values()) {
    if (neighbors.size > 0) {
      return true;
    }
  }
  return false;
}
