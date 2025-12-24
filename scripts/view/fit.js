import { GLASS_HEIGHT, HUD_BOTTOM_RESERVE, HUD_TOP_RESERVE } from "../config.js";

export function getFitViewHeight() {
  return GLASS_HEIGHT + HUD_TOP_RESERVE + HUD_BOTTOM_RESERVE;
}
