import {
  DEBUG_OVERLAY,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  KILL_OFFSET,
  SPAWN_OFFSET,
} from "../config.js";
import { drawScoreParticles } from "./score_particles.js";
import { drawComboPopups } from "./combo_popup.js";
import {
  drawBubbles,
  drawBubblePopIcons,
  drawBubblePopParticles,
} from "./bubbles.js";
import { drawGunMarks } from "./bonuses.js";
import { hexToRgba } from "./utils.js";
import { drawRewardFloaters } from "./reward_floaters.js";
import { drawBackground } from "./background.js";
import { drawGlassFrame } from "./glass_frame.js";
import {
  drawBonusButtons,
  drawBubbleKeyHint,
} from "./draw/bonus_ui.js";
import { drawTouchOverlay } from "./draw/overlays.js";
import { drawLevelUpPopups } from "./level_up_popup.js";
import {
  drawBottomProgress,
  drawCosmometer,
  drawTopHud,
} from "./lines/hud.js";
import { drawPauseOverlay } from "./lines/overlays.js";
import { drawCustomOutlines, drawWaitFill } from "./lines/world.js";

const { Render } = Matter;

export function drawLines(state, render, getGlassRect) {
  const { left, top } = getGlassRect();
  const spawnY = top + SPAWN_OFFSET;
  const killY = top + KILL_OFFSET;

  const ctx = render.context;
  ctx.save();
  Render.startViewTransform(render);
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  drawGlassFrame(ctx, getGlassRect, render);
  drawBackground(ctx, render, getGlassRect, state.engine.timing.timestamp);
  ctx.restore();
  // Control line rendering intentionally hidden; logic remains.

  const killPhaseMs = state.killTouchMs;
  let alpha = 0.25;
  if (killPhaseMs >= 2000 && killPhaseMs < 6000) {
    const phase = state.engine.timing.timestamp / 1000;
    alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  } else if (killPhaseMs >= 6000) {
    const phase = state.engine.timing.timestamp / 250;
    alpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  }
  ctx.strokeStyle = hexToRgba("#f55a5a", alpha);
  ctx.beginPath();
  ctx.moveTo(left, killY);
  ctx.lineTo(left + GLASS_WIDTH, killY);
  ctx.stroke();

  if (state.gameOver) {
    ctx.fillStyle = "#f55a5a";
    ctx.font = "20px sans-serif";
    ctx.fillText("GAME OVER", left + 10, top + 30);
  }

  if (DEBUG_OVERLAY) {
    // Reserved for future debug visuals.
  }

  drawWaitFill(state, ctx);
  drawCustomOutlines(state, ctx);
  drawCosmometer(state, ctx, getGlassRect);
  drawBonusButtons(state, ctx, getGlassRect);
  drawTouchOverlay(state, ctx, getGlassRect, spawnY);
  drawBottomProgress(state, ctx, getGlassRect);
  drawBubbles(state, ctx);
  drawBubblePopParticles(state, ctx);
  drawBubblePopIcons(state, ctx);
  drawGunMarks(state, ctx);
  drawBubbleKeyHint(state, ctx);
  drawLevelUpPopups(state, ctx);
  Render.endViewTransform(render);
  drawRewardFloaters(state, ctx);
  drawScoreParticles(state, ctx);
  drawComboPopups(state, ctx);
  drawTopHud(state, ctx, render, getGlassRect);
  drawPauseOverlay(state, ctx, render);
  ctx.restore();
}
