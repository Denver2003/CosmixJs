function getNowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

export function createPauseController(state, runner) {
  function setPaused(paused, reason = "manual", resumeDelayMs = 0) {
    if (paused) {
      if (state.paused && state.pausedReason === "manual" && reason !== "manual") {
        return;
      }
      state.paused = true;
      state.pausedReason = reason;
      state.pausedAtMs = getNowMs();
      state.pausedResumeMs = resumeDelayMs ? getNowMs() + resumeDelayMs : 0;
      if (runner) {
        runner.enabled = false;
      }
      return;
    }
    state.paused = false;
    state.pausedReason = null;
    state.pausedAtMs = 0;
    state.pausedResumeMs = 0;
    if (runner) {
      runner.enabled = true;
    }
  }

  function resumeIfAuto() {
    if (!state.paused || state.pausedReason === "manual") {
      return;
    }
    if (!state.pausedResumeMs) {
      return;
    }
    if (getNowMs() >= state.pausedResumeMs) {
      setPaused(false, state.pausedReason);
    }
  }

  function tickAutoResume() {
    if (!state.paused || state.pausedReason === "manual") {
      return;
    }
    if (!state.pausedResumeMs) {
      return;
    }
    if (getNowMs() >= state.pausedResumeMs) {
      setPaused(false, state.pausedReason);
    }
  }

  function togglePause() {
    if (state.paused) {
      setPaused(false, "manual");
      return;
    }
    setPaused(true, "manual");
  }

  function getPauseInfo() {
    return { paused: state.paused, reason: state.pausedReason };
  }

  return {
    setPaused,
    resumeIfAuto,
    tickAutoResume,
    togglePause,
    getPauseInfo,
  };
}
