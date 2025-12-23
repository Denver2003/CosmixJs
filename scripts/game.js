import {
  CONTROL_SPEED,
  DROP_SPEED,
  GLASS_WIDTH,
  KILL_DURATION_MS,
  KILL_OFFSET,
  SPAWN_OFFSET,
  WAIT_DURATION_MS,
  WALL_THICKNESS,
} from "./config.js";
import { createRandomShape } from "./shapes.js";

const { Events, Body, World, Composite } = Matter;

export function createGame({ engine, world, render, getGlassRect }) {
  let waitingBody = null;
  let waitingState = "none";
  let waitStartMs = 0;
  let moveLeft = false;
  let moveRight = false;
  let gameOver = false;
  let killTouchMs = 0;

  function getSpawnPoint() {
    const { left, top } = getGlassRect();
    return {
      x: left + GLASS_WIDTH / 2,
      y: top + SPAWN_OFFSET,
    };
  }

  function spawnBlock() {
    if (gameOver) {
      return;
    }
    const spawn = getSpawnPoint();
    const spawnY = spawn.y - SPAWN_OFFSET;
    const spawnPoint = { x: spawn.x, y: spawnY };
    const body = createRandomShape(spawnPoint);
    body.plugin = { stopAtSpawn: true };
    waitingBody = body;
    waitingState = "descending";
    World.add(world, body);
  }

  function dropActiveBody() {
    if (!waitingBody || gameOver) {
      return;
    }

    waitingBody.plugin.stopAtSpawn = false;
    Body.setStatic(waitingBody, false);
    Body.setVelocity(waitingBody, {
      x: waitingBody.velocity.x,
      y: DROP_SPEED,
    });
    waitingBody = null;
    waitingState = "none";
    waitStartMs = 0;
    spawnBlock();
  }

  function clampWaitingBody() {
    if (!waitingBody) {
      return;
    }
    const { left } = getGlassRect();
    const minX = left + WALL_THICKNESS / 2;
    const maxX = left + GLASS_WIDTH - WALL_THICKNESS / 2;
    const { min, max } = waitingBody.bounds;
    if (min.x < minX) {
      Body.translate(waitingBody, { x: minX - min.x, y: 0 });
    } else if (max.x > maxX) {
      Body.translate(waitingBody, { x: maxX - max.x, y: 0 });
    }
  }

  function update() {
    if (!waitingBody || gameOver) {
      return;
    }

    const spawnPoint = getSpawnPoint();
    if (
      waitingState === "descending" &&
      waitingBody.plugin?.stopAtSpawn &&
      waitingBody.position.y >= spawnPoint.y
    ) {
      Body.setPosition(waitingBody, {
        x: waitingBody.position.x,
        y: spawnPoint.y,
      });
      Body.setVelocity(waitingBody, { x: 0, y: 0 });
      Body.setAngularVelocity(waitingBody, 0);
      Body.setStatic(waitingBody, true);
      waitingState = "armed";
      waitStartMs = engine.timing.timestamp;
    }

    if (
      waitingState === "armed" &&
      engine.timing.timestamp - waitStartMs >= WAIT_DURATION_MS
    ) {
      dropActiveBody();
    }

    if (waitingState === "armed") {
      const direction = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
      if (direction !== 0) {
        const deltaSeconds = engine.timing.lastDelta / 1000;
        Body.translate(waitingBody, {
          x: direction * CONTROL_SPEED * deltaSeconds,
          y: 0,
        });
        clampWaitingBody();
      }
    }

    const { top } = getGlassRect();
    const killY = top + KILL_OFFSET;
    const bodies = Composite.allBodies(world);
    let touchingKill = false;
    for (const body of bodies) {
      if (body.isStatic) {
        continue;
      }
      if (waitingState === "armed" && body === waitingBody) {
        continue;
      }
      if (body.bounds.min.y <= killY && body.bounds.max.y >= killY) {
        touchingKill = true;
        break;
      }
    }

    if (touchingKill) {
      killTouchMs += engine.timing.lastDelta;
    } else {
      killTouchMs = 0;
    }

    if (killTouchMs >= KILL_DURATION_MS) {
      gameOver = true;
      waitingBody = null;
      waitingState = "none";
      moveLeft = false;
      moveRight = false;
    }
  }

  function drawDebugLines() {
    const { left, top } = getGlassRect();
    const spawnY = top + SPAWN_OFFSET;
    const killY = top + KILL_OFFSET;

    const ctx = render.context;
    ctx.save();
    ctx.strokeStyle = "#3fa9f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, spawnY);
    ctx.lineTo(left + GLASS_WIDTH, spawnY);
    ctx.stroke();

    const killPhaseMs = killTouchMs;
    let alpha = 0.25;
    if (killPhaseMs >= 2000 && killPhaseMs < 6000) {
      const phase = engine.timing.timestamp / 1000;
      alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
    } else if (killPhaseMs >= 6000) {
      const phase = engine.timing.timestamp / 250;
      alpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
    }
    ctx.strokeStyle = `rgba(245, 90, 90, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(left, killY);
    ctx.lineTo(left + GLASS_WIDTH, killY);
    ctx.stroke();

    if (gameOver) {
      ctx.fillStyle = "#f55a5a";
      ctx.font = "20px sans-serif";
      ctx.fillText("GAME OVER", left + 10, top + 30);
    }
    ctx.restore();
  }

  function onKeyDown(event) {
    if (!waitingBody || waitingState !== "armed" || gameOver) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        moveLeft = true;
        break;
      case "ArrowRight":
        moveRight = true;
        break;
      case "ArrowDown":
        dropActiveBody();
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.key) {
      case "ArrowLeft":
        moveLeft = false;
        break;
      case "ArrowRight":
        moveRight = false;
        break;
      default:
        break;
    }
  }

  Events.on(engine, "afterUpdate", update);
  Events.on(render, "afterRender", drawDebugLines);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return { spawnBlock };
}
