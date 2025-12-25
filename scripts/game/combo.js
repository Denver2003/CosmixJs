const COMBO_WINDOW_MS = 4000;
const COMBO_MAX_MULTIPLIER = 5;

export function recordCombo(state, nowMs) {
  const withinWindow =
    state.comboLastAtMs && nowMs - state.comboLastAtMs <= COMBO_WINDOW_MS;
  if (withinWindow) {
    state.comboStreak = (state.comboStreak || 1) + 1;
  } else {
    state.comboStreak = 1;
  }
  state.comboLastAtMs = nowMs;
  const multiplier = Math.min(state.comboStreak, COMBO_MAX_MULTIPLIER);
  state.comboMultiplier = multiplier;
  state.comboChainCount = state.comboStreak;
  state.comboWindowMs = COMBO_WINDOW_MS;
  return {
    multiplier,
    chainCount: state.comboStreak,
    windowMs: COMBO_WINDOW_MS,
  };
}
