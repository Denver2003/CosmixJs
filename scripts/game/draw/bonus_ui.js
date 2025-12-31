import { BONUS_COOLDOWN_MS, WALL_THICKNESS } from "../../config.js";
import { drawBubbleIcon } from "../bubbles.js";
import { getBonusSlots } from "../bonus_ui.js";

export function drawBonusButtons(state, ctx, getGlassRect) {
  const slots = getBonusSlots(state, getGlassRect);
  if (!slots.length) {
    return;
  }
  const now = state.engine.timing.timestamp;
  ctx.save();
  ctx.lineWidth = 2;
  for (const slot of slots) {
    const count = state.bonusInventory[slot.key] || 0;
    const cooldownUntil =
      slot.key === "touch"
        ? state.bonusCooldowns.touchUntil
        : state.bonusCooldowns.gunUntil;
    const cooling = cooldownUntil && now < cooldownUntil;
    ctx.fillStyle = "#0f1115";
    ctx.strokeStyle = "#cfd8dc";
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    if (cooling) {
      ctx.globalAlpha = 0.4;
    }
    const reward = {
      type: "consumable",
      subtype: slot.key === "touch" ? "touch" : "machine",
    };
    drawBubbleIcon(ctx, slot.x, slot.y, slot.radius * 1.2, reward);
    ctx.restore();

    if (cooling) {
      const remaining = Math.max(0, cooldownUntil - now);
      const progress = Math.min(1, remaining / BONUS_COOLDOWN_MS);
      ctx.fillStyle = "rgba(15, 17, 21, 0.45)";
      ctx.beginPath();
      ctx.moveTo(slot.x, slot.y);
      ctx.arc(
        slot.x,
        slot.y,
        slot.radius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress
      );
      ctx.closePath();
      ctx.fill();

      const totalSeconds = Math.ceil(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px \"RussoOne\", sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(timeLabel, slot.x, slot.y + 0.5);
    }

    if (!cooling && count > 1) {
      const badgeR = slot.radius * 0.35;
      const badgeX = slot.x - slot.radius * 0.6;
      const badgeY = slot.y + slot.radius * 0.55;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f1115";
      ctx.font = "10px \"RussoOne\", sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(count), badgeX, badgeY + 0.5);
    }
  }
  ctx.restore();
}

export function drawBubbleIconLegend(state, ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const x = glassRect.left - WALL_THICKNESS * 2.2;
  const startY = glassRect.top + WALL_THICKNESS * 2.2;
  const spacing = 44;
  const size = 44;
  const sampleColors = ["#00e5ff", "#00ff85", "#ffe600"];
  const items = [
    { type: "coins", amount: 1 },
    { type: "points", subtype: "points1", amount: 1 },
    { type: "points", subtype: "points2", amount: 1 },
    { type: "points", subtype: "points3", amount: 1 },
    { type: "instant", subtype: "hail", colors: sampleColors },
    { type: "instant", subtype: "grenade", color: "#ff5bd8" },
    { type: "consumable", subtype: "touch" },
    { type: "consumable", subtype: "machine" },
  ];
  ctx.save();
  for (let i = 0; i < items.length; i += 1) {
    const y = startY + i * spacing;
    drawBubbleIcon(ctx, x, y, size, items[i]);
  }
  ctx.restore();
}

export function drawBubbleKeyHint(state, ctx) {
  if (!state.keyboardControlActive) {
    return;
  }
  const bubbles = state.bubbles;
  if (!bubbles || bubbles.length === 0) {
    return;
  }
  let topBubble = null;
  for (const bubble of bubbles) {
    if (!topBubble || bubble.y < topBubble.y) {
      topBubble = bubble;
    }
  }
  if (!topBubble) {
    return;
  }
  const size = 18;
  const x = topBubble.x + topBubble.radius * 0.45;
  const y = topBubble.y + topBubble.radius * 0.45;
  const label = state.keyboardControlMode === "arrows" ? "↑" : "E";
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 1;
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
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + size / 2, y + size / 2 + 0.5);
  ctx.restore();
}
