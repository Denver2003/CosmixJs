import {
  CHAIN_ALPHA_LERP,
  CHAIN_BASE_ALPHA,
  CHAIN_BURST_DURATION_MS,
  CHAIN_BURST_GRAVITY,
  CHAIN_BURST_SCALE_MAX,
  CHAIN_BURST_SCALE_MIN,
  CHAIN_BURST_SPEED,
  CHAIN_BURST_UPWARD_SPEED,
  CHAIN_MIN,
  IMPACT_FLASH_ALPHA,
} from "../../config.js";
import { hexToRgba, setBodyScale } from "../utils.js";

const { Body, Composite, World } = Matter;

export function applyChainFillStyles(state, bodies, components, deltaMs) {
  const sizeById = new Map();
  for (const component of components) {
    for (const id of component.ids) {
      sizeById.set(id, component.ids.size);
    }
  }

  for (const body of bodies) {
    if (body.plugin?.burst?.active) {
      continue;
    }
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
    const flashAlpha = body.plugin?.flashAlpha || 0;
    if (flashAlpha > targetAlpha) {
      targetAlpha = flashAlpha;
    }
    if (!body.plugin) {
      body.plugin = {};
    }
    const currentAlpha = body.plugin.fillAlpha || CHAIN_BASE_ALPHA;
    const lerp = 1 - Math.pow(1 - CHAIN_ALPHA_LERP, deltaMs / 16.67);
    const nextAlpha =
      flashAlpha > 0 ? targetAlpha : currentAlpha + (targetAlpha - currentAlpha) * lerp;
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

export function updateImpactFlash(state) {
  const now = state.engine.timing.timestamp;
  const bodies = Composite.allBodies(state.world);
  for (const body of bodies) {
    const startMs = body.plugin?.flashStartMs;
    const durationMs = body.plugin?.flashDurationMs;
    if (!startMs || !durationMs) {
      if (body.plugin && body.plugin.flashAlpha) {
        body.plugin.flashAlpha = 0;
      }
      continue;
    }
    const t = (now - startMs) / durationMs;
    if (t >= 1) {
      body.plugin.flashStartMs = 0;
      body.plugin.flashDurationMs = 0;
      body.plugin.flashAlpha = 0;
      continue;
    }
    const pulse = t < 0.5 ? t / 0.5 : (1 - t) / 0.5;
    body.plugin.flashAlpha = IMPACT_FLASH_ALPHA * pulse;
  }
}

export function startBurst(state, bodies) {
  if (!bodies.length) {
    return;
  }
  let centerX = 0;
  let centerY = 0;
  for (const body of bodies) {
    centerX += body.position.x;
    centerY += body.position.y;
  }
  centerX /= bodies.length;
  centerY /= bodies.length;

  let maxDist = 0;
  const distances = new Map();
  for (const body of bodies) {
    const dx = body.position.x - centerX;
    const dy = body.position.y - centerY;
    const dist = Math.hypot(dx, dy);
    distances.set(body.id, { dx, dy, dist });
    if (dist > maxDist) {
      maxDist = dist;
    }
  }
  if (maxDist < 1) {
    maxDist = 1;
  }

  for (const body of bodies) {
    if (body.plugin?.burst?.active) {
      continue;
    }
    const { dx, dy, dist } = distances.get(body.id);
    let dirX = dx;
    let dirY = dy;
    if (dist <= 0.001) {
      const angle = Math.random() * Math.PI * 2;
      dirX = Math.cos(angle);
      dirY = Math.sin(angle);
    } else {
      dirX /= dist;
      dirY /= dist;
    }
    const speed = CHAIN_BURST_SPEED * (0.8 + Math.random() * 0.4);
    Body.setStatic(body, false);
    Body.setVelocity(body, { x: dirX * speed, y: dirY * speed });
    Body.setVelocity(body, {
      x: body.velocity.x,
      y: body.velocity.y - CHAIN_BURST_UPWARD_SPEED,
    });
    body.isSensor = true;
    body.collisionFilter.mask = 0;

    const baseScale = body.plugin?.scaleCurrent || 1;
    const distFactor = 1 - Math.max(0, Math.min(1, dist / maxDist));
    const boost =
      CHAIN_BURST_SCALE_MIN +
      (CHAIN_BURST_SCALE_MAX - CHAIN_BURST_SCALE_MIN) * distFactor;
    const targetScale = baseScale * (1 + boost);
    body.plugin = {
      ...(body.plugin || {}),
      burst: {
        active: true,
        startMs: state.engine.timing.timestamp,
        durationMs: CHAIN_BURST_DURATION_MS,
        baseScale,
        targetScale,
      },
    };
    state.burstBodies.add(body);
  }
}

export function updateBurst(state) {
  if (!state.burstBodies || state.burstBodies.size === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  for (const body of [...state.burstBodies]) {
    const burst = body.plugin?.burst;
    if (!burst || !burst.active) {
      state.burstBodies.delete(body);
      continue;
    }
    const t = (now - burst.startMs) / burst.durationMs;
    if (t >= 1) {
      World.remove(state.world, body);
      state.burstBodies.delete(body);
      continue;
    }
    const ease = 1 - Math.pow(1 - t, 2);
    const scale =
      burst.baseScale + (burst.targetScale - burst.baseScale) * ease;
    setBodyScale(body, scale);
    Body.setVelocity(body, {
      x: body.velocity.x,
      y: body.velocity.y + CHAIN_BURST_GRAVITY * (state.engine.timing.lastDelta / 1000),
    });

    const color = body.plugin?.color || "#ffffff";
    const alpha = Math.max(0, 1 - t);
    const stroke = hexToRgba(color, alpha);
    const fill = hexToRgba(color, alpha * 0.35);
    const parts = body.parts.length > 1 ? body.parts : [body];
    for (const part of parts) {
      part.render.strokeStyle = stroke;
      part.render.fillStyle = fill;
    }
  }
}
