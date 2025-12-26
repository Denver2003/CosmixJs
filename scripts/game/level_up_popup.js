import { GLASS_HEIGHT, GLASS_WIDTH } from "../config.js";
import { hexToRgba } from "./utils.js";

export function spawnLevelUpPopup(state, getGlassRect, level) {
  const glassRect = getGlassRect();
  const worldX = glassRect.left + GLASS_WIDTH / 2;
  const worldY = glassRect.top + GLASS_HEIGHT / 2;
  state.levelUpPopups.push({
    worldX,
    worldY,
    level,
    startMs: state.engine.timing.timestamp,
  });
}

export function updateLevelUpPopups(state) {
  const popups = state.levelUpPopups;
  if (!popups || popups.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const total = 500 + 500 + 1000 + 300;
  const next = [];
  for (const popup of popups) {
    if (now - popup.startMs <= total) {
      next.push(popup);
    }
  }
  state.levelUpPopups = next;
}

export function drawLevelUpPopups(state, ctx) {
  const popups = state.levelUpPopups;
  if (!popups || popups.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const delay = 500;
  const phase1 = 500;
  const phase2 = 1000;
  const phase3 = 300;
  const total = delay + phase1 + phase2 + phase3;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const popup of popups) {
    const elapsed = now - popup.startMs;
    if (elapsed < delay || elapsed > total) {
      continue;
    }
    const t = elapsed - delay;
    let phase = 1;
    let localT = t;
    if (t > phase1) {
      phase = 2;
      localT = t - phase1;
      if (localT > phase2) {
        phase = 3;
        localT = localT - phase2;
      }
    }

    const color = getLevelColor(popup.level);
    const baseFont = 20;
    const gap = 24;
    let newPos = { x: popup.worldX, y: popup.worldY - gap };
    let levelPos = { x: popup.worldX, y: popup.worldY };
    let levelLabelPos = { x: popup.worldX, y: popup.worldY + gap };
    let newScale = 1;
    let levelScale = 1;
    let levelLabelScale = 1;
    let alpha = 1;

    if (phase === 1) {
      const p = Math.max(0, Math.min(1, localT / phase1));
      const ease = 1 - Math.pow(1 - p, 3);
      newPos = {
        x: popup.worldX,
        y: popup.worldY - gap + (gap * 0.6) * (1 - ease),
      };
      levelLabelPos = {
        x: popup.worldX,
        y: popup.worldY + gap + (gap * 0.6) * (1 - ease),
      };
      newScale = 0.3 + 1.7 * ease;
      levelScale = 0.3 + 1.7 * ease;
      levelLabelScale = 0.3 + 1.7 * ease;
    } else if (phase === 2) {
      const p = Math.max(0, Math.min(1, localT / phase2));
      const ease = 1 - Math.pow(1 - p, 2);
      newScale = 2;
      levelScale = 2;
      levelLabelScale = 2;
      alpha = Math.max(0, 1 - p * 0.2);
      newPos = {
        x: popup.worldX,
        y: popup.worldY - gap - gap * 0.1 * ease,
      };
      levelLabelPos = {
        x: popup.worldX,
        y: popup.worldY + gap + gap * 0.1 * ease,
      };
      levelPos = {
        x: popup.worldX,
        y: popup.worldY - gap * 0.05 * ease,
      };
    } else {
      const p = Math.max(0, Math.min(1, localT / phase3));
      const ease = 1 - Math.pow(1 - p, 2);
      newScale = 2 + (5 - 2) * ease;
      levelScale = 2 + (5 - 2) * ease;
      levelLabelScale = 2 + (5 - 2) * ease;
      alpha = Math.max(0, 1 - p);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = hexToRgba("#ffffff", alpha);
    ctx.font = `${Math.round(baseFont * newScale)}px sans-serif`;
    ctx.fillText("NEW", newPos.x, newPos.y);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.font = `${Math.round(baseFont * levelScale)}px sans-serif`;
    ctx.fillText(String(popup.level), levelPos.x, levelPos.y);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = hexToRgba("#ffffff", alpha);
    ctx.font = `${Math.round(baseFont * levelLabelScale)}px sans-serif`;
    ctx.fillText("LEVEL", levelLabelPos.x, levelLabelPos.y);
    ctx.restore();
  }
  ctx.restore();
}

function getLevelColor(level) {
  if (level <= 5) {
    return "#2f9cff";
  }
  if (level <= 10) {
    return "#37d46b";
  }
  if (level <= 15) {
    return "#a855f7";
  }
  return "#ff3b3b";
}
