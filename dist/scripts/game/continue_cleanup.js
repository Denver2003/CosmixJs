import { startBurst } from "./chains/effects.js";

const { Composite, World } = Matter;

export function applyContinueCleanup(state, percent, getGlassRect) {
  const bodies = Composite.allBodies(state.world).filter((body) => {
    if (body.isStatic || body.parent !== body) {
      return false;
    }
    if (state.waitingBody && body === state.waitingBody) {
      return false;
    }
    if (body.plugin?.burst?.active) {
      return false;
    }
    return true;
  });
  if (!bodies.length) {
    return 0;
  }

  const groups = collectColorGroups(state, bodies);
  groups.sort((a, b) => b.length - a.length);
  if (groups.length > 0 && groups[0].length === 1) {
    shuffle(groups);
  }

  const target = Math.max(1, Math.round(bodies.length * percent));
  let removedCount = 0;
  const toRemove = [];
  for (const group of groups) {
    if (removedCount >= target) {
      break;
    }
    toRemove.push(group);
    removedCount += group.length;
  }

  if (toRemove.length === 0) {
    return 0;
  }

  for (const group of toRemove) {
    startBurst(state, group);
    for (const body of group) {
      World.remove(state.world, body);
    }
  }

  state.spawnBlockResumeAt = state.engine.timing.timestamp + 700;

  return removedCount;
}

function collectColorGroups(state, bodies) {
  const bodyById = new Map();
  for (const body of bodies) {
    bodyById.set(body.id, body);
  }
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
    if (bodyA.plugin?.color !== bodyB.plugin?.color) {
      continue;
    }
    adjacency.get(bodyA.id).add(bodyB.id);
    adjacency.get(bodyB.id).add(bodyA.id);
  }

  const visited = new Set();
  const groups = [];
  for (const body of bodies) {
    if (visited.has(body.id)) {
      continue;
    }
    const stack = [body];
    visited.add(body.id);
    const group = [];
    while (stack.length) {
      const current = stack.pop();
      group.push(current);
      for (const neighborId of adjacency.get(current.id) || []) {
        if (visited.has(neighborId)) {
          continue;
        }
        visited.add(neighborId);
        const neighbor = bodyById.get(neighborId);
        if (neighbor) {
          stack.push(neighbor);
        }
      }
    }
    if (group.length) {
      groups.push(group);
    }
  }
  return groups;
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
