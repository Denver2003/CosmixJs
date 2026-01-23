import { GLASS_WIDTH } from "../config.js";
import { calcBubbleScore } from "./rewards.js";
import * as storage from "./storage.js";
import { spawnBubbleWithReward } from "./bubbles/core.js";

const STAGES = {
  CONTROLS: "controls",
  PRAISE: "praise",
  BUBBLE_WAIT_DROP: "bubble_wait_drop",
  BUBBLE_WAIT_POP: "bubble_wait_pop",
  BUBBLE_PRAISE: "bubble_praise",
  COMPLETE: "complete",
};

const CONTROL_MOVE_THRESHOLD = 0.08;
const MESSAGE_DURATION_MS = 3000;
const MESSAGE_FADE_MS = 500;
const BUBBLE_REPEAT_MS = 5000;
const TUTORIAL_KEY = "cosmix.tutorial";

const loadTutorialProgress = storage.loadTutorialProgress || fallbackLoadTutorialProgress;
const saveTutorialProgress = storage.saveTutorialProgress || fallbackSaveTutorialProgress;

export function createTutorialState() {
  const progress = loadTutorialProgress();
  const completed = Boolean(progress?.completed);
  return {
    completed,
    stage: completed ? STAGES.COMPLETE : STAGES.CONTROLS,
    moveLeft: false,
    moveRight: false,
    dropCount: 0,
    stageStartMs: 0,
    messageUntilMs: 0,
    bubbleMessageStartMs: 0,
    bubbleMessageUntilMs: 0,
    bubbleRepeatAtMs: 0,
    bubblePopped: false,
  };
}

export function resetTutorialForRun(state) {
  const tutorial = state.tutorial;
  if (!tutorial || tutorial.completed) {
    return;
  }
  tutorial.stage = STAGES.CONTROLS;
  tutorial.moveLeft = false;
  tutorial.moveRight = false;
  tutorial.dropCount = 0;
  tutorial.stageStartMs = 0;
  tutorial.messageUntilMs = 0;
  tutorial.bubbleMessageStartMs = 0;
  tutorial.bubbleMessageUntilMs = 0;
  tutorial.bubbleRepeatAtMs = 0;
  tutorial.bubblePopped = false;
}

export function updateTutorial(state, getGlassRect) {
  const tutorial = state.tutorial;
  if (!tutorial || tutorial.completed) {
    return;
  }
  const now = state.engine?.timing?.timestamp || 0;

  if (tutorial.stage === STAGES.CONTROLS) {
    if (state.waitingBody) {
      const glass = getGlassRect();
      const centerX = glass.left + GLASS_WIDTH / 2;
      const threshold = GLASS_WIDTH * CONTROL_MOVE_THRESHOLD;
      const dx = state.waitingBody.position.x - centerX;
      if (dx <= -threshold) {
        tutorial.moveLeft = true;
      }
      if (dx >= threshold) {
        tutorial.moveRight = true;
      }
    }
    if ((tutorial.moveLeft || tutorial.moveRight) && tutorial.dropCount >= 1) {
      tutorial.stage = STAGES.PRAISE;
      tutorial.stageStartMs = now;
      tutorial.messageUntilMs = now + MESSAGE_DURATION_MS;
    }
    return;
  }

  if (tutorial.stage === STAGES.PRAISE) {
    if (now >= tutorial.messageUntilMs) {
      tutorial.stage = STAGES.BUBBLE_WAIT_DROP;
    }
    return;
  }

  if (tutorial.stage === STAGES.BUBBLE_WAIT_POP) {
    if (tutorial.bubblePopped) {
      tutorial.stage = STAGES.BUBBLE_PRAISE;
      tutorial.stageStartMs = now;
      tutorial.messageUntilMs = now + MESSAGE_DURATION_MS;
      tutorial.bubblePopped = false;
      return;
    }
    if (tutorial.bubbleRepeatAtMs && now >= tutorial.bubbleRepeatAtMs) {
      if (!hasTutorialBubble(state)) {
        spawnTutorialBubble(state, getGlassRect, now);
      }
      tutorial.bubbleMessageStartMs = now;
      tutorial.bubbleMessageUntilMs = now + MESSAGE_DURATION_MS;
      tutorial.bubbleRepeatAtMs = now + BUBBLE_REPEAT_MS;
    }
    return;
  }

  if (tutorial.stage === STAGES.BUBBLE_PRAISE) {
    if (now >= tutorial.messageUntilMs) {
      tutorial.stage = STAGES.COMPLETE;
      tutorial.completed = true;
      saveTutorialProgress(true);
    }
  }
}

export function handleTutorialDrop(state, getGlassRect) {
  const tutorial = state.tutorial;
  if (!tutorial || tutorial.completed) {
    return;
  }
  tutorial.dropCount += 1;
  if (tutorial.stage !== STAGES.BUBBLE_WAIT_DROP) {
    return;
  }
  const now = state.engine?.timing?.timestamp || 0;
  const bubble = spawnTutorialBubble(state, getGlassRect, now);
  if (!bubble) {
    return;
  }
  tutorial.stage = STAGES.BUBBLE_WAIT_POP;
  tutorial.bubbleMessageStartMs = now;
  tutorial.bubbleMessageUntilMs = now + MESSAGE_DURATION_MS;
  tutorial.bubbleRepeatAtMs = now + BUBBLE_REPEAT_MS;
}

export function handleTutorialBubblePop(state, bubble) {
  const tutorial = state.tutorial;
  if (!tutorial || tutorial.completed) {
    return;
  }
  if (!bubble?.tutorial) {
    return;
  }
  if (tutorial.stage === STAGES.BUBBLE_WAIT_POP) {
    tutorial.bubblePopped = true;
  }
}

export function getTutorialMessageAlpha(now, untilMs) {
  if (!untilMs || now > untilMs) {
    return 0;
  }
  const remaining = untilMs - now;
  if (remaining >= MESSAGE_FADE_MS) {
    return 1;
  }
  return Math.max(0, remaining / MESSAGE_FADE_MS);
}

export function getTutorialStage(state) {
  return state?.tutorial?.stage || STAGES.COMPLETE;
}

export function getTutorialMessageTimes(state) {
  const tutorial = state?.tutorial;
  if (!tutorial) {
    return null;
  }
  return {
    stage: tutorial.stage,
    messageUntilMs: tutorial.messageUntilMs,
    bubbleMessageUntilMs: tutorial.bubbleMessageUntilMs,
  };
}

function spawnTutorialBubble(state, getGlassRect, nowMs) {
  if (!state || !getGlassRect) {
    return null;
  }
  const amount = calcBubbleScore({
    roll: 3,
    level: state.level || 1,
    multiplier: state.gameMultiplier || 1,
    pointCoef: state.scoreCoef || 1,
  });
  const reward = { type: "points", subtype: "points1", amount, tutorial: true };
  return spawnBubbleWithReward(state, getGlassRect, reward, "tutorial");
}

function hasTutorialBubble(state) {
  const bubbles = state?.bubbles || [];
  return bubbles.some((bubble) => bubble?.tutorial);
}

function fallbackLoadTutorialProgress() {
  if (typeof window === "undefined") {
    return { completed: false };
  }
  try {
    const raw = window.localStorage?.getItem(TUTORIAL_KEY);
    if (!raw) {
      return { completed: false };
    }
    const parsed = JSON.parse(raw);
    return { completed: Boolean(parsed?.completed) };
  } catch (error) {
    return { completed: false };
  }
}

function fallbackSaveTutorialProgress(completed) {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.localStorage?.setItem(
      TUTORIAL_KEY,
      JSON.stringify({ completed: Boolean(completed) })
    );
    return true;
  } catch (error) {
    return false;
  }
}
