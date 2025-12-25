import {
  COSMO_ENERGY_DECAY,
  COSMO_ENERGY_GAIN,
  COSMO_ENERGY_L2,
  COSMO_ENERGY_L3,
  COSMO_ENERGY_L5,
  COSMO_ENERGY_MAX,
  COSMO_ENERGY_MAX_INTERNAL,
} from "../config.js";

const COSMO_COLOR_LEVELS = {
  1: "#2a6bd6",
  2: "#2fb35f",
  3: "#8a4de0",
  5: "#d94bb8",
};

export function addEnergyOnDrop(state) {
  state.energy = Math.min(
    COSMO_ENERGY_MAX_INTERNAL,
    state.energy + COSMO_ENERGY_GAIN
  );
}

function getEnergyLevel(energy) {
  if (energy >= COSMO_ENERGY_L5) {
    return 5;
  }
  if (energy >= COSMO_ENERGY_L3) {
    return 3;
  }
  if (energy >= COSMO_ENERGY_L2) {
    return 2;
  }
  return 1;
}

function getEnergyThreshold(level) {
  if (level >= 5) {
    return COSMO_ENERGY_L5;
  }
  if (level >= 3) {
    return COSMO_ENERGY_L3;
  }
  if (level >= 2) {
    return COSMO_ENERGY_L2;
  }
  return 0;
}

export function updateCosmometer(state, deltaMs) {
  const ratio =
    COSMO_ENERGY_MAX_INTERNAL > 0
      ? Math.max(0, Math.min(1, state.energy / COSMO_ENERGY_MAX_INTERNAL))
      : 0;
  const decayMultiplier = 1 + 2 * ratio;
  const decay = (COSMO_ENERGY_DECAY * decayMultiplier * deltaMs) / 1000;
  state.energy = Math.max(0, state.energy - decay);
}

export function updateCosmometerMultiplier(state, nowMs) {
  const level = getEnergyLevel(state.energy);
  const prevLevel = state.cosmoLevel || 1;

  state.gameMultiplier = level;
  state.cosmoLevel = level;

  if (level > prevLevel) {
    const fromColor = COSMO_COLOR_LEVELS[prevLevel] || COSMO_COLOR_LEVELS[1];
    const toColor = COSMO_COLOR_LEVELS[level] || COSMO_COLOR_LEVELS[1];
    state.cosmoColorFrom = fromColor;
    state.cosmoColorTo = toColor;
    state.cosmoColorBlendStartMs = nowMs;
    if (!state.cosmoPopups) {
      state.cosmoPopups = [];
    }
    state.cosmoPopups.push({
      multiplier: level,
      threshold: getEnergyThreshold(level),
      color: toColor,
      startMs: nowMs,
    });
  }
  return state.gameMultiplier;
}

export function getCosmoBaseColor(level) {
  return COSMO_COLOR_LEVELS[level] || COSMO_COLOR_LEVELS[1];
}
