import {
  BUBBLE_COOLDOWN_COINS_MS,
  BUBBLE_COOLDOWN_GRENADE_MS,
  BUBBLE_COOLDOWN_GUN_MS,
  BUBBLE_COOLDOWN_HAIL_MS,
  BUBBLE_COOLDOWN_POINTS1_MS,
  BUBBLE_COOLDOWN_POINTS2_MS,
  BUBBLE_COOLDOWN_POINTS3_MS,
  BUBBLE_COOLDOWN_TOUCH_MS,
  COLORS,
  GLASS_WIDTH,
} from "../../config.js";
import { BONUS_TABLES } from "./constants.js";
import { getPercent, randomInt } from "./utils.js";
import { calcBubbleMoney, calcBubbleScore } from "../rewards.js";
import { playSfx } from "../../audio/index.js";
import { triggerGrenade, triggerHail } from "../bonuses.js";
import { spawnRewardFloater } from "../reward_floaters.js";

export function applyBubbleReward(state, reward, getGlassRect) {
  if (!reward) {
    return;
  }
  const now = state.engine.timing.timestamp;
  switch (reward.type) {
    case "coins":
      state.coins += reward.amount;
      state.bubbleRewardCooldowns.coins = now + BUBBLE_COOLDOWN_COINS_MS;
      playSfx("bonus_coin_pick");
      if (state.render) {
        spawnRewardFloater(
          state,
          state.render,
          "coins",
          reward.x,
          reward.y,
          reward.amount,
          "#f0c74a"
        );
      }
      break;
    case "points":
      state.score += reward.amount;
      playSfx("bonus_points_pick");
      if (state.render) {
        spawnRewardFloater(
          state,
          state.render,
          "points",
          reward.x,
          reward.y,
          reward.amount,
          reward.subtype === "points2"
            ? "#4fe070"
            : reward.subtype === "points3"
              ? "#ff5a5a"
              : "#4aa7ff"
        );
      }
      if (reward.subtype === "points1") {
        state.bubbleRewardCooldowns.points1 = now + BUBBLE_COOLDOWN_POINTS1_MS;
      } else if (reward.subtype === "points2") {
        state.bubbleRewardCooldowns.points2 = now + BUBBLE_COOLDOWN_POINTS2_MS;
      } else if (reward.subtype === "points3") {
        state.bubbleRewardCooldowns.points3 = now + BUBBLE_COOLDOWN_POINTS3_MS;
      }
      break;
    case "instant":
      if (reward.subtype === "hail") {
        state.bubbleRewardCooldowns.hail = now + BUBBLE_COOLDOWN_HAIL_MS;
        triggerHail(state, getGlassRect);
      } else if (reward.subtype === "grenade") {
        state.bubbleRewardCooldowns.grenade = now + BUBBLE_COOLDOWN_GRENADE_MS;
        triggerGrenade(state, reward.color, getGlassRect);
      }
      console.log("[bubble] instant:", reward.subtype);
      break;
    case "consumable":
      if (reward.subtype === "touch") {
        state.bubbleRewardCooldowns.touch = now + BUBBLE_COOLDOWN_TOUCH_MS;
        state.bonusInventory.touch += reward.amount || 1;
        playSfx("bonus_instant_pick");
      } else if (reward.subtype === "machine") {
        state.bubbleRewardCooldowns.gun = now + BUBBLE_COOLDOWN_GUN_MS;
        state.bonusInventory.gun += reward.amount || 1;
        playSfx("bonus_instant_pick");
      }
      console.log("[bubble] consumable:", reward.subtype);
      break;
    default:
      break;
  }
}

export function rollBubbleReward(state, options = {}) {
  const now = state.engine.timing.timestamp;
  const level = state.level || 1;
  const multiplier = state.gameMultiplier || 1;
  const pointCoef = state.scoreCoef || 1;
  const moneyCoef = state.moneyCoef || 1;
  const bonusUpgradeLevel = state.bonusUpgradeLevel || 0;
  const source = options?.source || "collapse";

  const entries = [];
  const addEntry = (key, type, subtype) => {
    const percent = getPercent(BONUS_TABLES[key], level);
    if (percent <= 0) {
      return;
    }
    entries.push({ type, subtype, weight: percent, key });
  };

  if (now >= (state.bubbleRewardCooldowns.coins || 0)) {
    addEntry("coins", "coins");
  }
  if (now >= (state.bubbleRewardCooldowns.points1 || 0)) {
    addEntry("points1", "points", "points1");
  }
  if (now >= (state.bubbleRewardCooldowns.points2 || 0)) {
    addEntry("points2", "points", "points2");
  }
  if (now >= (state.bubbleRewardCooldowns.points3 || 0)) {
    addEntry("points3", "points", "points3");
  }
  if (now >= (state.bubbleRewardCooldowns.hail || 0)) {
    addEntry("hail", "instant", "hail");
  }
  if (now >= (state.bubbleRewardCooldowns.grenade || 0)) {
    addEntry("grenade", "instant", "grenade");
  }
  if (now >= (state.bubbleRewardCooldowns.touch || 0)) {
    addEntry("touch", "consumable", "touch");
  }
  if (now >= (state.bubbleRewardCooldowns.gun || 0)) {
    addEntry("gun", "consumable", "machine");
  }

  applyBonusUpgradeModifiers(entries, bonusUpgradeLevel);
  if (bonusUpgradeLevel >= 6 && source === "drop") {
    const instantOnly = entries.filter((entry) => entry.type === "instant");
    if (instantOnly.length === 0) {
      return null;
    }
    entries.length = 0;
    entries.push(...instantOnly);
  }

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return null;
  }
  const maxPercent = Math.max(100, total);
  const roll = Math.random() * maxPercent;
  if (roll >= total) {
    return null;
  }

  let pick = roll;
  let selected = null;
  for (const entry of entries) {
    pick -= entry.weight;
    if (pick <= 0) {
      selected = entry;
      break;
    }
  }
  if (!selected) {
    selected = entries[entries.length - 1];
  }

  if (selected.type === "coins") {
    const rollValue = randomInt(1, 5);
    const amount = calcBubbleMoney({ roll: rollValue, level, multiplier, moneyCoef });
    return { type: "coins", amount };
  }
  if (selected.type === "points") {
    const rollValue = randomInt(1, 5);
    let amount = calcBubbleScore({ roll: rollValue, level, multiplier, pointCoef });
    const mult = selected.subtype === "points2" ? 2 : selected.subtype === "points3" ? 4 : 1;
    amount *= mult;
    return { type: "points", subtype: selected.subtype, amount };
  }
  if (selected.type === "instant") {
    if (selected.subtype === "grenade") {
      return { type: "instant", subtype: selected.subtype, color: pickColors(state, 1)[0] };
    }
    return { type: "instant", subtype: selected.subtype };
  }
  if (selected.type === "consumable") {
    const amount = bonusUpgradeLevel >= 7 ? 5 : 1;
    return { type: "consumable", subtype: selected.subtype, amount };
  }
  return null;
}

function pickColors(state, count) {
  const limit = Math.max(1, Math.min(COLORS.length, state.colorsCount || 4));
  const palette = COLORS.slice(0, limit);
  const picks = [];
  for (let i = 0; i < count; i += 1) {
    picks.push(palette[Math.floor(Math.random() * palette.length)]);
  }
  return picks;
}

function applyBonusUpgradeModifiers(entries, bonusUpgradeLevel) {
  if (!entries.length || bonusUpgradeLevel <= 0) {
    return;
  }

  const instantEntries = entries.filter((entry) => entry.type === "instant");
  const consumableEntries = entries.filter((entry) => entry.type === "consumable");

  if (bonusUpgradeLevel >= 7 && consumableEntries.length > 0) {
    for (const entry of consumableEntries) {
      entry.weight *= 5;
    }
  }

  if (instantEntries.length > 0) {
    const targetInstantShare =
      bonusUpgradeLevel >= 2 ? 0.2 : bonusUpgradeLevel >= 1 ? 0.15 : 0;
    if (targetInstantShare > 0) {
      const instantTotal = instantEntries.reduce((sum, entry) => sum + entry.weight, 0);
      const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
      const otherTotal = total - instantTotal;
      if (instantTotal > 0 && otherTotal > 0) {
        const currentShare = instantTotal / total;
        if (currentShare < targetInstantShare) {
          const multiplier =
            (targetInstantShare * otherTotal) / (instantTotal * (1 - targetInstantShare));
          for (const entry of instantEntries) {
            entry.weight *= multiplier;
          }
        }
      }
    }

    if (bonusUpgradeLevel >= 3) {
      const grenade = instantEntries.find((entry) => entry.subtype === "grenade");
      const hail = instantEntries.find((entry) => entry.subtype === "hail");
      if (grenade && hail) {
        const instantTotal = instantEntries.reduce((sum, entry) => sum + entry.weight, 0);
        grenade.weight = instantTotal * 0.4;
        hail.weight = instantTotal * 0.6;
      }
    }
  }
}
