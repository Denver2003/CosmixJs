import { createGlass } from "./glass.js";
import { createGame } from "./game.js";

const { Engine, Render, Runner } = Matter;

console.log("[main] init");

const engine = Engine.create();
const world = engine.world;

const canvas = document.getElementById("world");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const render = Render.create({
  canvas,
  engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "#0f1115",
    wireframeBackground: "#0f1115",
  },
});

const glass = createGlass(world);
glass.build();

Render.run(render);

const runner = Runner.create();
Runner.run(runner, engine);

const game = createGame({
  engine,
  world,
  render,
  getGlassRect: glass.getRect,
});

game.spawnBlock();

window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;

  glass.build();
  game.onResize();
});
