import { playSfx, setMusicPaused } from "../audio/index.js";

const MODES = {
  SHELL: "shell",
  GAMEPLAY: "gameplay",
  PAUSED: "paused",
  GAMEOVER: "gameover",
};

function getNowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

export function createGameStateMachine(state, runner) {
  let mode = state.mode || MODES.SHELL;

  function applyMode(next, { reason = null, resumeDelayMs = 0 } = {}) {
    mode = next;
    state.mode = next;

    if (next === MODES.PAUSED) {
      state.paused = true;
      state.pausedReason = reason || "manual";
      state.pausedAtMs = getNowMs();
      state.pausedResumeMs = resumeDelayMs ? getNowMs() + resumeDelayMs : 0;
      setMusicPaused(true);
    } else {
      state.paused = false;
      state.pausedReason = null;
      state.pausedAtMs = 0;
      state.pausedResumeMs = 0;
      setMusicPaused(false);
    }

    if (runner) {
      runner.enabled = next === MODES.GAMEPLAY;
    }
  }

  function startGame() {
    state.gameOver = false;
    state.gameOverHandled = false;
    applyMode(MODES.GAMEPLAY);
  }

  function openShell() {
    applyMode(MODES.SHELL);
  }

  function pause(reason = "manual", resumeDelayMs = 0) {
    if (mode === MODES.PAUSED) {
      if (state.pausedReason === "manual" && reason !== "manual") {
        return;
      }
      if (resumeDelayMs) {
        state.pausedResumeMs = getNowMs() + resumeDelayMs;
      }
      if (reason) {
        state.pausedReason = reason;
      }
      return;
    }
    if (mode !== MODES.GAMEPLAY) {
      return;
    }
    applyMode(MODES.PAUSED, { reason, resumeDelayMs });
  }

  function resume() {
    if (mode !== MODES.PAUSED) {
      return;
    }
    applyMode(MODES.GAMEPLAY);
  }

  function togglePause() {
    if (mode === MODES.PAUSED) {
      resume();
      return;
    }
    if (mode === MODES.GAMEPLAY) {
      pause("manual");
    }
  }

  function resumeIfAuto() {
    if (mode !== MODES.PAUSED) {
      return;
    }
    if (state.pausedReason === "manual" || state.pausedReason === "ad") {
      return;
    }
    if (!state.pausedResumeMs) {
      return;
    }
    if (getNowMs() >= state.pausedResumeMs) {
      resume();
    }
  }

  function tickAutoResume() {
    resumeIfAuto();
  }

  function setGameOver() {
    if (mode === MODES.GAMEOVER) {
      return;
    }
    state.gameOver = true;
    playSfx("game_over");
    applyMode(MODES.GAMEOVER);
    if (typeof window !== "undefined") {
      if (state.gameOverMenuTimer) {
        window.clearTimeout(state.gameOverMenuTimer);
        state.gameOverMenuTimer = 0;
      }
      state.gameOverMenuTimer = window.setTimeout(() => {
        if (state.gameOver && mode === MODES.GAMEOVER) {
          window.shellGameOver?.open?.();
        }
      }, 2000);
    }
  }

  function setPaused(paused, reason = "manual", resumeDelayMs = 0) {
    if (paused) {
      pause(reason, resumeDelayMs);
      return;
    }
    resume();
  }

  function getPauseInfo() {
    return { paused: state.paused, reason: state.pausedReason };
  }

  function getMode() {
    return mode;
  }

  return {
    MODES,
    startGame,
    openShell,
    pause,
    resume,
    togglePause,
    resumeIfAuto,
    tickAutoResume,
    setGameOver,
    setPaused,
    getPauseInfo,
    getMode,
  };
}
