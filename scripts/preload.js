import { SHAPE_SPRITE_PACK } from "./config.js";
import { getAudioAssets } from "./audio/index.js";
import { ICON_PATHS } from "./game/bubbles/constants.js";
import { preloadIcons } from "./game/bubbles/icons.js";
import { preloadPauseButton } from "./game/pause_button.js";

const BACKGROUND_SRC = "./assets/backgrounds/space_bg_placeholder.png";
const STATIC_IMAGE_SRCS = [
  "./assets/levelUI/glass_frame.png",
  "./assets/levelUI/pause_button.png",
  "./assets/hud/ui_button_play.png",
  "./assets/hud/ui_button_shop.png",
  "./assets/hud/ui_button_leaders.png",
  "./assets/hud/ui_button_settings.png",
];
const SCALED_ICON_SRCS = [
  "assets/scaled/icon-coin.png",
  "assets/scaled/icon_points1.png",
  "assets/scaled/icon_points2.png",
  "assets/scaled/icon_points3.png",
  "assets/scaled/icon-hail.png",
  "assets/scaled/icon-grenade.png",
  "assets/scaled/icon-touch.png",
  "assets/scaled/icon-machine.png",
];

const SHAPE_TYPES = [
  "rectangle",
  "square",
  "triangle",
  "circle",
  "diamond",
  "oval",
  "pentagon",
];
const SHAPE_LAYERS = ["outline", "fill", "details"];

const FONT_REQUESTS = ["16px \"RussoOne\""];

const AUDIO_TIMEOUT_MS = 2000;
const FONT_TIMEOUT_MS = 2000;

export function getPreloadManifest() {
  const iconSrcs = Object.values(ICON_PATHS || {});
  const shapeSrcs = [];
  for (const type of SHAPE_TYPES) {
    for (const layer of SHAPE_LAYERS) {
      shapeSrcs.push(`${SHAPE_SPRITE_PACK}/${type}_${layer}.png`);
    }
  }
  const { sfx, music } = getAudioAssets();
  const audioSrcs = [
    ...Object.values(sfx || {}).map((entry) => entry?.src).filter(Boolean),
    ...Object.values(music || {}).map((entry) => entry?.src).filter(Boolean),
  ];

  return {
    background: [BACKGROUND_SRC],
    images: dedupe([...STATIC_IMAGE_SRCS, ...SCALED_ICON_SRCS, ...iconSrcs, ...shapeSrcs]),
    fonts: [...FONT_REQUESTS],
    audio: dedupe(audioSrcs),
  };
}

export async function preloadAssets({ onProgress } = {}) {
  const manifest = getPreloadManifest();
  const total =
    manifest.background.length +
    manifest.images.length +
    manifest.fonts.length +
    manifest.audio.length;
  let loaded = 0;
  let phase = "background";
  let backgroundImage = null;

  const report = () => {
    const progress = total > 0 ? loaded / total : 1;
    onProgress?.({ loaded, total, progress, phase, backgroundImage });
  };
  const mark = () => {
    loaded += 1;
    report();
  };

  report();
  preloadPauseButton();
  const backgroundImages = await Promise.all(
    manifest.background.map((src) =>
      loadImage(src)
        .then((img) => {
          mark();
          return img;
        })
        .catch(() => {
          mark();
          return null;
        })
    )
  );
  backgroundImage = backgroundImages[0] || null;
  report();

  phase = "main";
  report();

  const pending = [
    ...manifest.images.map((src) =>
      loadImage(src)
        .then(mark)
        .catch(mark)
    ),
    ...manifest.fonts.map((request) =>
      loadFont(request, FONT_TIMEOUT_MS)
        .then(mark)
        .catch(mark)
    ),
    ...manifest.audio.map((src) =>
      loadAudio(src, AUDIO_TIMEOUT_MS)
        .then(mark)
        .catch(mark)
    ),
  ];

  if (pending.length) {
    await Promise.all(pending);
  }
  preloadIcons();
  report();

  return {
    backgroundImage,
    manifest,
    total,
    loaded,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function loadFont(request, timeoutMs) {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return Promise.resolve();
  }
  return withTimeout(document.fonts.load(request), timeoutMs);
}

function loadAudio(src, timeoutMs) {
  if (typeof Audio === "undefined") {
    return Promise.resolve();
  }
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = src;
  audio.load();
  const done = new Promise((resolve) => {
    const finish = () => resolve();
    audio.addEventListener("canplaythrough", finish, { once: true });
    audio.addEventListener("loadeddata", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
  });
  return withTimeout(done, timeoutMs);
}

function withTimeout(promise, timeoutMs) {
  if (!timeoutMs) {
    return promise;
  }
  let timerId = null;
  const timeout = new Promise((resolve) => {
    timerId = window.setTimeout(resolve, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timerId) {
      window.clearTimeout(timerId);
    }
  });
}

function dedupe(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}
