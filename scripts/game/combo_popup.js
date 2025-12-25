import { GLASS_HEIGHT, GLASS_WIDTH } from "../config.js";

const PHASE1_MS = 300;
const PHASE2_MS = 1000;
const START_SCALE = 0.3;
const PEAK_SCALE = 1.5;
const END_SCALE = 1;
const FONT_SIZE = 24;
const FONT_FAMILY = "sans-serif";
const DEFAULT_COLOR = "#f0c74a";

function worldToScreen(state, x, y) {
  const scale = state.viewScale || 1;
  return {
    x: x * scale,
    y: y * scale,
    scaleX: scale,
    scaleY: scale,
  };
}

function getPopupLabel(multiplier) {
  if (multiplier >= 5) {
    return "COSMO COMBO";
  }
  if (multiplier >= 4) {
    return "MEGA COMBO";
  }
  if (multiplier >= 3) {
    return "SUPER COMBO";
  }
  return "COMBO";
}

function getActivePopupTarget(state) {
  const popups = state.comboPopups || [];
  for (let i = popups.length - 1; i >= 0; i -= 1) {
    const popup = popups[i];
    if (!popup.done) {
      return popup;
    }
  }
  return null;
}

export function spawnComboPopup(state, getGlassRect, bodies, multiplier) {
  if (multiplier < 2) {
    return null;
  }
  const label = getPopupLabel(multiplier);
  const color =
    bodies?.[0]?.plugin?.color || state.comboLastColor || DEFAULT_COLOR;
  state.comboLastColor = color;
  let centerX = 0;
  let centerY = 0;
  let count = 0;
  for (const body of bodies) {
    centerX += body.position.x;
    centerY += body.position.y;
    count += 1;
  }
  if (!count) {
    const glass = getGlassRect();
    centerX = glass.left + GLASS_WIDTH / 2;
    centerY = glass.top + GLASS_HEIGHT / 2;
  } else {
    centerX /= count;
    centerY /= count;
  }
  const screen = worldToScreen(state, centerX, centerY);
  const glass = getGlassRect();
  const glassCenter = worldToScreen(
    state,
    glass.left + GLASS_WIDTH / 2,
    glass.top + GLASS_HEIGHT / 2
  );

  let targetX = glassCenter.x;
  let targetY = glassCenter.y;
  const active = getActivePopupTarget(state);
  if (active) {
    targetX = active.targetX;
    targetY = active.targetY + active.stackOffset;
  }

  const lift = GLASS_HEIGHT * 0.1 * glassCenter.scaleY;
  const now = state.engine.timing.timestamp;
  const popup = {
    label,
    color,
    startX: screen.x,
    startY: screen.y,
    targetX,
    targetY,
    lift,
    startMs: now,
    done: false,
    stackOffset: FONT_SIZE * 2,
    blinkCount: Math.max(1, Math.min(4, multiplier - 1)),
  };
  state.comboPopups.push(popup);
  return popup;
}

export function updateComboPopups(state) {
  const popups = state.comboPopups;
  if (!popups || popups.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  for (const popup of popups) {
    const elapsed = now - popup.startMs;
    if (elapsed >= PHASE1_MS + PHASE2_MS) {
      popup.done = true;
    }
  }
  state.comboPopups = popups.filter((popup) => !popup.done);
}

export function drawComboPopups(state, ctx) {
  const popups = state.comboPopups;
  if (!popups || popups.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  ctx.save();
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const popup of popups) {
    const elapsed = now - popup.startMs;
    if (elapsed < 0) {
      continue;
    }
    let x = popup.targetX;
    let y = popup.targetY;
    let scale = END_SCALE;
    let alpha = 0;
    if (elapsed <= PHASE1_MS) {
      const t = Math.max(0, Math.min(1, elapsed / PHASE1_MS));
      const ease = 1 - Math.pow(1 - t, 3);
      scale = START_SCALE + (PEAK_SCALE - START_SCALE) * ease;
      x = popup.startX + (popup.targetX - popup.startX) * ease;
      y = popup.startY + (popup.targetY - popup.startY) * ease;
      if (popup.blinkCount > 0) {
        const phase = t * popup.blinkCount;
        const wave = Math.sin((phase + 0.25) * Math.PI * 2);
        alpha = wave >= 0 ? 1 : 0.25;
      } else {
        alpha = 1;
      }
    } else {
      const t = Math.max(0, Math.min(1, (elapsed - PHASE1_MS) / PHASE2_MS));
      const ease = 1 - Math.pow(1 - t, 2);
      scale = PEAK_SCALE + (END_SCALE - PEAK_SCALE) * ease;
      x = popup.targetX;
      y = popup.targetY - popup.lift * ease;
      const fade = 1 - t;
      alpha = fade * fade;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = colorWithAlpha(popup.color || DEFAULT_COLOR, alpha);
    ctx.fillText(popup.label, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function colorWithAlpha(hex, alpha) {
  if (!hex || !hex.startsWith("#")) {
    return `rgba(240, 199, 74, ${alpha})`;
  }
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
    return `rgba(240, 199, 74, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
