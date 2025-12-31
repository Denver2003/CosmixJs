import { getTopHudLayout } from "../ui/hud.js";

function worldToScreen(render, x, y) {
  const bounds = render.bounds;
  const width = render.options.width;
  const height = render.options.height;
  const scaleX = width / (bounds.max.x - bounds.min.x);
  const scaleY = height / (bounds.max.y - bounds.min.y);
  return {
    x: (x - bounds.min.x) * scaleX,
    y: (y - bounds.min.y) * scaleY,
  };
}

function getScoreTarget(state, render, getGlassRect) {
  const { leftX, valueY } = getTopHudLayout(state, render, getGlassRect);
  return { x: leftX, y: valueY };
}

export function spawnScoreParticles(
  state,
  render,
  removedComponentBodies,
  breakdown
) {
  if (!removedComponentBodies?.length || !breakdown?.length) {
    return;
  }
  const now = state.engine.timing.timestamp;

  for (let i = 0; i < removedComponentBodies.length; i += 1) {
    const bodies = removedComponentBodies[i] || [];
    const perShape = breakdown[i]?.perShape ?? 0;
    if (perShape <= 0) {
      continue;
    }
    for (const body of bodies) {
      const { x, y } = worldToScreen(render, body.position.x, body.position.y);
      const bounds = render.bounds;
      const width = render.options.width;
      const height = render.options.height;
      const scaleX = width / (bounds.max.x - bounds.min.x);
      const scaleY = height / (bounds.max.y - bounds.min.y);
      const vx = body.velocity.x * scaleX;
      const vy = body.velocity.y * scaleY;
      state.scoreParticles.push({
        x,
        y,
        vx,
        vy,
        value: perShape,
        color: body.plugin?.color || "#e0e4e8",
        startMs: now,
        durationMs: 800 + Math.random() * 700,
        scale: 1,
        alpha: 1,
      });
    }
  }
}

export function updateScoreParticles(state, render, getGlassRect) {
  const particles = state.scoreParticles;
  if (!particles || particles.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const deltaMs = state.engine.timing.lastDelta || 0;
  const dt = deltaMs / 1000;
  if (dt <= 0) {
    return;
  }
  const target = getScoreTarget(state, render, getGlassRect);
  const next = [];
  for (const particle of particles) {
    const t = (now - particle.startMs) / particle.durationMs;
    if (t >= 1) {
      continue;
    }
    const dx = target.x - particle.x;
    const dy = target.y - particle.y;
    const phaseSplit = 0.3;
    if (t <= phaseSplit) {
      const phaseT = t / phaseSplit;
      const scaleEase = 1 - Math.pow(1 - phaseT, 3);
      particle.scale = 1 + 0.3 * scaleEase;
      particle.alpha = 1;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    } else {
      const phaseT = (t - phaseSplit) / (1 - phaseSplit);
      const ease = 1 - Math.pow(1 - phaseT, 2);
      particle.scale = 1.3 - 0.3 * ease;
      const magnet = 2 + 6 * phaseT;
      particle.vx += dx * magnet * dt;
      particle.vy += dy * magnet * dt;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      const fade = 1 - phaseT;
      particle.alpha = fade * fade;
    }
    next.push(particle);
  }
  state.scoreParticles = next;
}

export function drawScoreParticles(state, ctx) {
  const particles = state.scoreParticles;
  if (!particles || particles.length === 0) {
    return;
  }
  ctx.save();
  ctx.font = "28px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const particle of particles) {
    const alpha = Math.max(0, Math.min(1, particle.alpha ?? 1));
    const scale = Math.max(0.1, particle.scale ?? 1);
    const color = particle.color || "#e0e4e8";
    ctx.fillStyle = color.startsWith("#")
      ? colorWithAlpha(color, alpha)
      : color;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.scale(scale, scale);
    ctx.fillText(`+${particle.value}`, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function colorWithAlpha(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return `rgba(224, 228, 232, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
