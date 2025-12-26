import { WALL_THICKNESS } from "../config.js";
import { getGlassBorderRects, getGlassFrame } from "../ui/layout.js";

export function getBonusSlots(state, getGlassRect) {
  const glassRect = getGlassRect();
  const glassFrame = getGlassFrame(glassRect);
  const { rightBorderRect } = getGlassBorderRects(glassFrame);
  const radius = WALL_THICKNESS;
  const centerX = rightBorderRect.x + rightBorderRect.width / 2;
  const startY = glassRect.top + WALL_THICKNESS * 2;
  const gap = WALL_THICKNESS * 2.5;

  const slots = [];
  const hasTouch = state.bonusInventory?.touch > 0;
  const hasGun = state.bonusInventory?.gun > 0;

  let index = 0;
  if (hasTouch) {
    slots.push({
      key: "touch",
      x: centerX,
      y: startY + gap * index,
      radius,
      keyLabel: "1",
    });
    index += 1;
  }
  if (hasGun) {
    slots.push({
      key: "gun",
      x: centerX,
      y: startY + gap * index,
      radius,
      keyLabel: "2",
    });
  }

  return slots;
}

export function hitTestBonusSlot(slots, x, y) {
  for (const slot of slots) {
    const dx = x - slot.x;
    const dy = y - slot.y;
    if (dx * dx + dy * dy <= slot.radius * slot.radius) {
      return slot;
    }
  }
  return null;
}
