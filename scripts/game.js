import {
  CHAIN_ALPHA_LERP,
  CHAIN_BASE_ALPHA,
  CHAIN_DURATION_MS,
  CHAIN_GRACE_MS,
  CHAIN_MIN,
  CONTROL_SPEED,
  DROP_SPEED,
  GLASS_WIDTH,
  KILL_DURATION_MS,
  KILL_OFFSET,
  PREVIEW_DELAY_MS,
  PREVIEW_FADE_MS,
  SPAWN_OFFSET,
  SPAWN_START_OFFSET,
  WAIT_DURATION_MS,
  WALL_THICKNESS,
} from "./config.js";
import { createRandomSpec, createShape } from "./shapes.js";

const { Events, Body, World, Composite } = Matter;

export function createGame({ engine, world, render, getGlassRect }) {
  console.log("[game] init");
  let waitingBody = null;
  let waitingState = "none";
  let waitStartMs = 0;
  let moveLeft = false;
  let moveRight = false;
  let gameOver = false;
  let killTouchMs = 0;
  let chainStates = [];
  let debugLogMs = 0;
  let chainGraceMs = 0;
  let nextSpec = createRandomSpec();
  let previewBody = null;
  let previewStartMs = 0;

  function getSpawnPoint() {
    const { left, top } = getGlassRect();
    return {
      x: left + GLASS_WIDTH / 2,
      y: top + SPAWN_OFFSET,
    };
  }

  function spawnBlock() {
    if (gameOver) {
      return;
    }
    const spawn = getSpawnPoint();
    const spawnY = spawn.y - SPAWN_START_OFFSET;
    const spawnPoint = { x: spawn.x, y: spawnY };
    const body = createShape(nextSpec, spawnPoint);
    body.plugin = { ...(body.plugin || {}), stopAtSpawn: true };
    setBodyScale(body, 0.5);
    body.plugin.scaleCurrent = 0.5;
    body.plugin.scaleTarget = 1;
    body.plugin.scaleStartY = spawnY;
    body.plugin.scaleEndY = spawn.y;
    waitingBody = body;
    waitingState = "descending";
    World.add(world, body);
    nextSpec = createRandomSpec();
    setPreview(nextSpec);
  }

  function dropActiveBody() {
    if (!waitingBody || gameOver) {
      return;
    }

    removePreview();
    waitingBody.plugin.stopAtSpawn = false;
    Body.setStatic(waitingBody, false);
    Body.setVelocity(waitingBody, {
      x: waitingBody.velocity.x,
      y: DROP_SPEED,
    });
    waitingBody = null;
    waitingState = "none";
    waitStartMs = 0;
    spawnBlock();
  }

  function clampWaitingBody() {
    if (!waitingBody) {
      return;
    }
    const { left } = getGlassRect();
    const minX = left + WALL_THICKNESS / 2;
    const maxX = left + GLASS_WIDTH - WALL_THICKNESS / 2;
    const { min, max } = waitingBody.bounds;
    if (min.x < minX) {
      Body.translate(waitingBody, { x: minX - min.x, y: 0 });
    } else if (max.x > maxX) {
      Body.translate(waitingBody, { x: maxX - max.x, y: 0 });
    }
  }

  function update() {
    if (gameOver) {
      return;
    }

    if (waitingBody) {
      const spawnPoint = getSpawnPoint();
      if (
        waitingState === "descending" &&
        waitingBody.plugin?.stopAtSpawn &&
        waitingBody.position.y >= spawnPoint.y
      ) {
        setBodyScale(waitingBody, 1);
        Body.setPosition(waitingBody, {
          x: waitingBody.position.x,
          y: spawnPoint.y,
        });
        Body.setVelocity(waitingBody, { x: 0, y: 0 });
        Body.setAngularVelocity(waitingBody, 0);
        Body.setStatic(waitingBody, true);
        waitingState = "armed";
        waitStartMs = engine.timing.timestamp;
      }

      if (
        waitingState === "armed" &&
        engine.timing.timestamp - waitStartMs >= WAIT_DURATION_MS
      ) {
        dropActiveBody();
      }

      if (waitingState === "armed") {
        const direction = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
        if (direction !== 0) {
          const deltaSeconds = engine.timing.lastDelta / 1000;
          Body.translate(waitingBody, {
            x: direction * CONTROL_SPEED * deltaSeconds,
            y: 0,
          });
          clampWaitingBody();
        }
      }
    }

    if (waitingBody && waitingState === "descending") {
      const t = Math.max(
        0,
        Math.min(
          1,
          (waitingBody.position.y - waitingBody.plugin.scaleStartY) /
            (waitingBody.plugin.scaleEndY - waitingBody.plugin.scaleStartY)
        )
      );
      const desiredScale = 0.5 + 0.5 * t;
      if (Math.abs(desiredScale - (waitingBody.plugin.scaleCurrent || 1)) > 0.001) {
        setBodyScale(waitingBody, desiredScale);
      }
    }

    updatePreview(engine.timing.timestamp);

    const { top } = getGlassRect();
    const killY = top + KILL_OFFSET;
    const bodies = Composite.allBodies(world);
    let touchingKill = false;
    for (const body of bodies) {
      if (body.isStatic) {
        continue;
      }
      if (waitingState === "armed" && body === waitingBody) {
        continue;
      }
      if (body.bounds.min.y <= killY && body.bounds.max.y >= killY) {
        touchingKill = true;
        break;
      }
    }

    if (touchingKill) {
      killTouchMs += engine.timing.lastDelta;
    } else {
      killTouchMs = 0;
    }

    if (killTouchMs >= KILL_DURATION_MS) {
      gameOver = true;
      waitingBody = null;
      waitingState = "none";
      moveLeft = false;
      moveRight = false;
    }

    updateChains(engine.timing.lastDelta);
  }

  function drawDebugLines() {
    const { left, top } = getGlassRect();
    const spawnY = top + SPAWN_OFFSET;
    const killY = top + KILL_OFFSET;

    const ctx = render.context;
    ctx.save();
    ctx.strokeStyle = "#3fa9f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, spawnY);
    ctx.lineTo(left + GLASS_WIDTH, spawnY);
    ctx.stroke();

    const killPhaseMs = killTouchMs;
    let alpha = 0.25;
    if (killPhaseMs >= 2000 && killPhaseMs < 6000) {
      const phase = engine.timing.timestamp / 1000;
      alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
    } else if (killPhaseMs >= 6000) {
      const phase = engine.timing.timestamp / 250;
      alpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
    }
    ctx.strokeStyle = `rgba(245, 90, 90, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(left, killY);
    ctx.lineTo(left + GLASS_WIDTH, killY);
    ctx.stroke();

    if (gameOver) {
      ctx.fillStyle = "#f55a5a";
      ctx.font = "20px sans-serif";
      ctx.fillText("GAME OVER", left + 10, top + 30);
    }
    ctx.restore();
  }

  function onKeyDown(event) {
    if (!waitingBody || waitingState !== "armed" || gameOver) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        moveLeft = true;
        break;
      case "ArrowRight":
        moveRight = true;
        break;
      case "ArrowDown":
        dropActiveBody();
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.key) {
      case "ArrowLeft":
        moveLeft = false;
        break;
      case "ArrowRight":
        moveRight = false;
        break;
      default:
        break;
    }
  }

  Events.on(engine, "afterUpdate", update);
  Events.on(render, "afterRender", drawDebugLines);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return { spawnBlock, onResize };

  function updateChains(deltaMs) {
    debugLogMs += deltaMs;
    const bodies = Composite.allBodies(world).filter((body) => {
      if (body.isStatic || body.parent !== body) {
        return false;
      }
      if (waitingBody && (body === waitingBody || body.parent === waitingBody)) {
        return false;
      }
      return true;
    });
    const bodyById = new Map(bodies.map((body) => [body.id, body]));

    const adjacency = new Map();
    for (const body of bodies) {
      adjacency.set(body.id, new Set());
    }

    for (const pair of engine.pairs.list) {
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
      chainGraceMs += deltaMs;
    } else {
      chainGraceMs = 0;
    }
    const allowReset = chainGraceMs >= CHAIN_GRACE_MS;

    applyChainFillStyles(bodies, components, deltaMs);

    if (debugLogMs >= 1000) {
      const counts = components.map((component) => component.ids.size);
      const totalPairs = engine.pairs.list.length;
      console.log(
        "[chains]",
        "bodies:",
        bodies.length,
        "pairs:",
        totalPairs,
        "components:",
        counts
      );
      debugLogMs = 0;
    }

    const matched = new Set();
    const nextStates = [];
    for (const component of components) {
      let bestMatch = null;
      let bestOverlap = 0;
      for (const prev of chainStates) {
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
    for (const state of nextStates) {
      if (state.timerMs >= CHAIN_DURATION_MS && state.ids.size >= CHAIN_MIN) {
        for (const id of state.ids) {
          removeIds.add(id);
        }
      }
    }

    if (removeIds.size) {
      const toRemove = bodies.filter((body) => removeIds.has(body.id));
      for (const body of toRemove) {
        World.remove(world, body);
      }
      chainStates = [];
    } else {
      chainStates = nextStates;
    }
  }

  function applyChainFillStyles(bodies, components, deltaMs) {
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
      if (size >= 5) {
        const pulse = 0.5 + 0.5 * Math.sin(engine.timing.timestamp / 90);
        targetAlpha = 1.0 * pulse;
      } else if (size === 4) {
        targetAlpha = 0.35;
      } else if (size === 3) {
        targetAlpha = 0.25;
      } else if (size === 2) {
        targetAlpha = 0.18;
      }
      if (!body.plugin) {
        body.plugin = {};
      }
      const currentAlpha = body.plugin.fillAlpha || CHAIN_BASE_ALPHA;
      const lerp = 1 - Math.pow(1 - CHAIN_ALPHA_LERP, deltaMs / 16.67);
      const nextAlpha = currentAlpha + (targetAlpha - currentAlpha) * lerp;
      body.plugin.fillAlpha = nextAlpha;
      const fill = color ? hexToRgba(color, nextAlpha) : "rgba(0, 0, 0, 0)";
      for (const part of parts) {
        part.render.fillStyle = fill;
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

  function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function setPreview(spec) {
    if (previewBody) {
      World.remove(world, previewBody);
      previewBody = null;
    }
    const spawn = getSpawnPoint();
    const previewPoint = { x: spawn.x, y: spawn.y - SPAWN_START_OFFSET };
    previewBody = createShape(spec, previewPoint, { alpha: 0 });
    previewBody.isSensor = true;
    previewBody.isStatic = true;
    previewBody.collisionFilter = { group: -1, category: 0x0002, mask: 0 };
    setBodyScale(previewBody, 0.5);
    previewBody.plugin.preview = true;
    previewBody.plugin.previewAlpha = 0;
    previewStartMs = engine.timing.timestamp;
    World.add(world, previewBody);
  }

  function updatePreview(timestamp) {
    if (!previewBody) {
      return;
    }
    const rawElapsed = timestamp - previewStartMs - PREVIEW_DELAY_MS;
    const elapsed = Math.min(1, Math.max(0, rawElapsed / PREVIEW_FADE_MS));
    previewBody.plugin.previewAlpha = elapsed;
    const color = previewBody.plugin?.color;
    const alpha = 0.4 * elapsed;
    const stroke = color ? hexToRgba(color, alpha) : "rgba(0,0,0,0)";
    const parts = previewBody.parts.length > 1 ? previewBody.parts : [previewBody];
    for (const part of parts) {
      part.render.strokeStyle = stroke;
      part.render.fillStyle = "rgba(0, 0, 0, 0)";
    }
  }

  function removePreview() {
    if (!previewBody) {
      return;
    }
    World.remove(world, previewBody);
    previewBody = null;
    previewStartMs = 0;
  }

  function setBodyScale(body, scale) {
    const current = body.plugin?.scaleCurrent || 1;
    const factor = scale / current;
    Body.scale(body, factor, factor);
    body.plugin.scaleCurrent = scale;
  }

  function onResize() {
    const spawn = getSpawnPoint();
    if (waitingBody && waitingState === "armed") {
      Body.setPosition(waitingBody, {
        x: waitingBody.position.x,
        y: spawn.y,
      });
      clampWaitingBody();
    }
    if (previewBody) {
      Body.setPosition(previewBody, {
        x: spawn.x,
        y: spawn.y - SPAWN_START_OFFSET,
      });
    }
  }
}
