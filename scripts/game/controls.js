import { CONTROL_DESCENT_FACTOR, GLASS_WIDTH, WALL_THICKNESS } from "../config.js";
import { getTopHudLayout } from "../ui/hud.js";
import { dropActiveBody } from "./spawn.js";
import { popBubbleAt, popTopBubble } from "./bubbles.js";
import { getBonusSlots, hitTestBonusSlot } from "./bonus_ui.js";
import { activateGunBonus, activateTouchBonus, tryTouchKill } from "./bonuses.js";
import { clampWaitingBody } from "./utils.js";
import { resolveInputMethod, trackBonusUse, trackUiClick } from "../analytics/events.js";

export function attachControls(
  state,
  getSpawnPoint,
  getGlassRect,
  togglePause,
  render,
  canvas
) {
  let pointerActive = false;
  let lastX = 0;

  function onKeyDown(event) {
    const { key, code } = event;
    if (event.key === "p" || event.key === "P") {
      if (state.mode === "shell" || state.mode === "gameover") {
        return;
      }
      trackUiClick({
        screenId: "game",
        controlId: "pause_hotkey",
        inputMethod: "keyboard",
      });
      if (typeof window !== "undefined" && window.openPauseMenu) {
        window.openPauseMenu();
      } else {
        togglePause?.();
      }
      event.preventDefault();
      return;
    }
    if (key === "e" || key === "E" || code === "KeyE" || key === "ArrowUp") {
      if (state.mode === "shell" || state.mode === "gameover") {
        return;
      }
      if (!state.paused && !state.gameOver && state.keyboardControlActive) {
        const reward = popTopBubble(state, getGlassRect);
        if (reward) {
          event.preventDefault();
          return;
        }
      }
    }
    if (key === "1" || code === "Digit1" || code === "Numpad1") {
      if (state.mode === "shell" || state.mode === "gameover") {
        return;
      }
      state.keyboardControlActive = true;
      if (!state.paused && !state.gameOver && state.keyboardControlActive) {
        if (activateTouchBonus(state)) {
          trackUiClick({
            screenId: "game",
            controlId: "bonus_touch_hotkey",
            inputMethod: "keyboard",
          });
          trackBonusUse({
            runId: state.runId,
            bonusId: "touch",
            source: "keyboard",
          });
          event.preventDefault();
          return;
        }
      }
    }
    if (key === "2" || code === "Digit2" || code === "Numpad2") {
      if (state.mode === "shell" || state.mode === "gameover") {
        return;
      }
      state.keyboardControlActive = true;
      if (!state.paused && !state.gameOver && state.keyboardControlActive) {
        if (activateGunBonus(state, getGlassRect)) {
          trackUiClick({
            screenId: "game",
            controlId: "bonus_gun_hotkey",
            inputMethod: "keyboard",
          });
          trackBonusUse({
            runId: state.runId,
            bonusId: "gun",
            source: "keyboard",
          });
          event.preventDefault();
          return;
        }
      }
    }
    if (
      code === "ArrowLeft" ||
      code === "ArrowRight" ||
      code === "ArrowDown" ||
      code === "ArrowUp"
    ) {
      state.keyboardControlActive = true;
      state.keyboardControlMode = "arrows";
    }
    if (code === "KeyA" || code === "KeyD" || code === "KeyS") {
      state.keyboardControlActive = true;
      state.keyboardControlMode = "wasd";
    }
    if (!state.waitingBody || state.gameOver) {
      return;
    }
    if (state.paused) {
      return;
    }

    switch (code) {
      case "ArrowLeft":
      case "KeyA":
        state.moveLeft = true;
        break;
      case "ArrowRight":
      case "KeyD":
        state.moveRight = true;
        break;
      case "ArrowDown":
      case "KeyS":
        dropActiveBody(state, getSpawnPoint, getGlassRect);
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        state.moveLeft = false;
        break;
      case "ArrowRight":
      case "KeyD":
        state.moveRight = false;
        break;
      default:
        break;
    }
  }

  function onPointerDown(event) {
    if (state.mode === "shell" || state.mode === "gameover") {
      return;
    }
    const inputMethod = resolveInputMethod(event.pointerType);
    const target = event.target || canvas;
    const rect = target?.getBoundingClientRect?.();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const layout = getTopHudLayout(state, render, getGlassRect);
      const dx = x - layout.pause.centerX;
      const dy = y - layout.pause.centerY;
      if (dx * dx + dy * dy <= layout.pause.radius * layout.pause.radius) {
        trackUiClick({
          screenId: "game",
          controlId: "pause_button",
          inputMethod,
        });
        if (typeof window !== "undefined" && window.openPauseMenu) {
          window.openPauseMenu();
        } else {
          togglePause?.();
        }
        event.preventDefault();
        return;
      }
      if (!state.paused) {
        const scale = state.viewScale || 1;
        const worldX = x / scale;
        const worldY = y / scale;
        if (tryTouchKill(state, worldX, worldY, getGlassRect)) {
          event.preventDefault();
          return;
        }
        const slots = getBonusSlots(state, getGlassRect);
        const hit = hitTestBonusSlot(slots, worldX, worldY);
        if (hit) {
          const activated =
            hit.key === "touch"
              ? activateTouchBonus(state)
              : activateGunBonus(state, getGlassRect);
          if (activated) {
            trackUiClick({
              screenId: "game",
              controlId: hit.key === "touch" ? "bonus_touch_button" : "bonus_gun_button",
              inputMethod,
            });
            trackBonusUse({
              runId: state.runId,
              bonusId: hit.key === "touch" ? "touch" : "gun",
              source: "ui",
            });
            event.preventDefault();
            return;
          }
        }
        const reward = popBubbleAt(state, worldX, worldY, getGlassRect);
        if (reward) {
          event.preventDefault();
          return;
        }
      }
    }
    if (!state.waitingBody || state.gameOver) {
      return;
    }
    if (state.paused) {
      return;
    }
    pointerActive = true;
    lastX = event.clientX;
    state.moveLeft = false;
    state.moveRight = false;
    event.target.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!pointerActive || !state.waitingBody) {
      return;
    }
    if (state.paused) {
      return;
    }
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    if (Math.abs(dx) > 0) {
      const factor = state.waitingState === "descending" ? CONTROL_DESCENT_FACTOR : 1;
      const scale = state.viewScale || 1;
      Matter.Body.translate(state.waitingBody, { x: (dx / scale) * factor, y: 0 });
      clampWaitingBody(
        state.waitingBody,
        getGlassRect,
        GLASS_WIDTH,
        WALL_THICKNESS
      );
    }
    event.preventDefault();
  }

  function onPointerUp(event) {
    if (!pointerActive) {
      return;
    }
    if (state.paused) {
      pointerActive = false;
      return;
    }
    pointerActive = false;
    event.target.releasePointerCapture?.(event.pointerId);
    dropActiveBody(state, getSpawnPoint, getGlassRect);
    event.preventDefault();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  };
}
