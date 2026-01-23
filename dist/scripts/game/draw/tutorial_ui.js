import { t } from "../../ui/i18n.js";
import { getCapsuleLayout } from "../../ui/layout.js";
import { isGameScreenActive } from "../../ui/canvas_shell.js";
import {
  getTutorialMessageAlpha,
  getTutorialMessageTimes,
  getTutorialStage,
} from "../tutorial.js";
import { roundRectPath } from "../lines/utils.js";

const STAGE_CONTROLS = "controls";
const STAGE_PRAISE = "praise";
const STAGE_BUBBLE_WAIT_POP = "bubble_wait_pop";
const STAGE_BUBBLE_PRAISE = "bubble_praise";

export function drawTutorialOverlay(state, ctx, render, getGlassRect) {
  if (!state?.tutorial || state.tutorial.completed) {
    return;
  }
  if (!isGameScreenActive() || state.mode !== "gameplay") {
    return;
  }
  const stage = getTutorialStage(state);
  if (stage === "complete") {
    return;
  }

  const now = state.engine?.timing?.timestamp || 0;
  const times = getTutorialMessageTimes(state);
  const layout = getCapsuleLayout(render, getGlassRect);
  const viewWidth = render?.options?.width || 0;
  const viewHeight = render?.options?.height || 0;
  const inner = layout?.inner || {
    x: 0,
    y: 0,
    width: viewWidth,
    height: viewHeight,
  };
  const centerX = inner.x + inner.width / 2;
  const centerY = inner.y + inner.height * 0.46;
  const topY = inner.y + inner.height * 0.12;
  const maxWidth = inner.width * 0.9;
  const scale = state.viewScale || 1;

  const touchOnly = isTouchDevice();

  if (stage === STAGE_CONTROLS) {
    drawTutorialMessage(ctx, {
      text: t(touchOnly ? "tutorial.controls_touch" : "tutorial.controls"),
      centerX,
      centerY,
      maxWidth,
      alpha: 1,
      scale,
    });
    return;
  }

  if (stage === STAGE_PRAISE) {
    const alpha = getTutorialMessageAlpha(now, times?.messageUntilMs || 0);
    if (alpha > 0) {
      drawTutorialMessage(ctx, {
        text: t("tutorial.praise_controls"),
        centerX,
        centerY,
        maxWidth,
        alpha,
        scale,
      });
    }
    return;
  }

  if (stage === STAGE_BUBBLE_WAIT_POP) {
    const alpha = getTutorialMessageAlpha(now, times?.bubbleMessageUntilMs || 0);
    if (alpha > 0) {
      drawTutorialMessage(ctx, {
        text: t(touchOnly ? "tutorial.bubble_touch" : "tutorial.bubble"),
        centerX,
        centerY: topY,
        maxWidth,
        alpha,
        scale,
      });
    }
    return;
  }

  if (stage === STAGE_BUBBLE_PRAISE) {
    const alpha = getTutorialMessageAlpha(now, times?.messageUntilMs || 0);
    if (alpha > 0) {
      drawTutorialMessage(ctx, {
        text: t("tutorial.praise_bubble"),
        centerX,
        centerY,
        maxWidth,
        alpha,
        scale,
      });
    }
  }
}

function drawTutorialMessage(ctx, { text, centerX, centerY, maxWidth, alpha, scale }) {
  if (!text) {
    return;
  }
  const baseFontSize = Math.round(18 * scale);
  let fontSize = baseFontSize;
  let keySize = Math.round(baseFontSize * 1.05);
  let layout = buildLineLayout(ctx, text, fontSize, keySize);
  if (layout.maxLineWidth > maxWidth && layout.maxLineWidth > 0) {
    const fitScale = maxWidth / layout.maxLineWidth;
    fontSize = Math.max(12, Math.round(baseFontSize * fitScale));
    keySize = Math.max(12, Math.round(keySize * fitScale));
    layout = buildLineLayout(ctx, text, fontSize, keySize);
  }

  const lineHeight = fontSize * 1.45;
  const paddingX = fontSize * 0.9;
  const paddingY = fontSize * 0.7;
  const lineCount = layout.lines.length || 1;
  const boxWidth = layout.maxLineWidth + paddingX * 2;
  const boxHeight = lineHeight * lineCount + paddingY * 2;
  const boxX = centerX - boxWidth / 2;
  const boxY = centerY - boxHeight / 2;
  const radius = Math.max(6, Math.round(fontSize * 0.55));

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = "rgba(15, 17, 21, 0.65)";
  ctx.strokeStyle = "rgba(207, 216, 220, 0.85)";
  ctx.lineWidth = Math.max(1, Math.round(2 * scale));
  ctx.beginPath();
  roundRectPath(ctx, boxX, boxY, boxWidth, boxHeight, radius);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${fontSize}px "RussoOne", sans-serif`;

  const startY = boxY + paddingY + lineHeight / 2;
  for (let i = 0; i < layout.lines.length; i += 1) {
    const lineParts = layout.lines[i];
    const lineWidth = layout.lineWidths[i] || 0;
    let cursorX = centerX - lineWidth / 2;
    const lineY = startY + i * lineHeight;
    for (const part of lineParts) {
      if (part.type === "text") {
        if (part.value) {
          ctx.fillText(part.value, cursorX, lineY);
          cursorX += ctx.measureText(part.value).width;
        }
      } else if (part.type === "key") {
        cursorX += layout.keyGap;
        drawKeyBox(ctx, cursorX, lineY - keySize / 2, keySize, part.value);
        cursorX += keySize + layout.keyGap;
      }
    }
  }

  ctx.restore();
}

function buildLineLayout(ctx, text, fontSize, keySize) {
  const lines = String(text).split("\n").map(parseKeyTokens);
  ctx.font = `${fontSize}px "RussoOne", sans-serif`;
  const keyGap = Math.max(4, Math.round(fontSize * 0.25));
  const lineWidths = lines.map((parts) =>
    measurePartsWidth(ctx, parts, keySize, keyGap)
  );
  const maxLineWidth = lineWidths.reduce((max, value) => Math.max(max, value), 0);
  return {
    lines,
    lineWidths,
    maxLineWidth,
    keyGap,
  };
}

function parseKeyTokens(line) {
  const parts = [];
  let cursor = 0;
  while (cursor < line.length) {
    const open = line.indexOf("[", cursor);
    if (open < 0) {
      const tail = line.slice(cursor);
      if (tail) {
        parts.push({ type: "text", value: tail });
      }
      break;
    }
    if (open > cursor) {
      const chunk = line.slice(cursor, open);
      if (chunk) {
        parts.push({ type: "text", value: chunk });
      }
    }
    const close = line.indexOf("]", open + 1);
    if (close < 0) {
      const tail = line.slice(open);
      if (tail) {
        parts.push({ type: "text", value: tail });
      }
      break;
    }
    const label = line.slice(open + 1, close).trim();
    if (label) {
      parts.push({ type: "key", value: label });
    }
    cursor = close + 1;
  }
  return parts.length ? parts : [{ type: "text", value: line }];
}

function measurePartsWidth(ctx, parts, keySize, keyGap) {
  let width = 0;
  for (const part of parts) {
    if (part.type === "text") {
      width += ctx.measureText(part.value).width;
    } else if (part.type === "key") {
      width += keyGap + keySize + keyGap;
    }
  }
  return width;
}

function drawKeyBox(ctx, x, y, size, label) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = Math.max(1, Math.round(size * 0.08));
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size, y);
  ctx.stroke();
  ctx.fillStyle = "#0f1115";
  ctx.font = `${Math.round(size * 0.6)}px "RussoOne", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + size / 2, y + size / 2 + size * 0.04);
  ctx.restore();
}

function isTouchDevice() {
  if (typeof window === "undefined") {
    return false;
  }
  if (navigator?.maxTouchPoints && navigator.maxTouchPoints > 0) {
    return true;
  }
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(pointer: coarse)").matches;
  }
  return false;
}
