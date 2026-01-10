import { getAppState, setAppState } from "../shell/app_state.js";
import { loadAudioSettings, saveAudioSettings } from "../game/storage.js";

const DEFAULT_SETTINGS = { music: 70, sfx: 80, mute: false };

const SFX = {
  spawn_pop: { src: "./assets/audio/sfx/spawn_pop.wav", minIntervalMs: 120 },
  drop_whoosh: { src: "./assets/audio/sfx/drop_whoosh.wav", minIntervalMs: 200 },
  impact_first: { src: "./assets/audio/sfx/impact_first.wav", minIntervalMs: 200 },
  chain_burst: { src: "./assets/audio/sfx/chain_burst.wav", minIntervalMs: 200 },
  bonus_bubble_pop: {
    src: "./assets/audio/sfx/bonus_bubble_pop.wav",
    minIntervalMs: 150,
  },
  bonus_grenade: { src: "./assets/audio/sfx/bonus_grenade.wav", minIntervalMs: 400 },
  bonus_gun_shot: {
    src: "./assets/audio/sfx/bonus_gun_shot.wav",
    minIntervalMs: 60,
  },
  laser_warning_loop: {
    src: "./assets/audio/sfx/laser_warning_loop.wav",
    minIntervalMs: 800,
  },
  laser_timeout_hit: {
    src: "./assets/audio/sfx/laser_timeout_hit.wav",
    minIntervalMs: 400,
  },
  combo_super: { src: "./assets/audio/sfx/combo_super.wav", minIntervalMs: 500 },
  combo_mega: { src: "./assets/audio/sfx/combo_mega.wav", minIntervalMs: 500 },
  combo_cosmo: { src: "./assets/audio/sfx/combo_cosmo.wav", minIntervalMs: 500 },
  level_up: { src: "./assets/audio/sfx/level_up.wav", minIntervalMs: 600 },
  cosmo_level_up: {
    src: "./assets/audio/sfx/cosmo_level_up.wav",
    minIntervalMs: 600,
  },
};

const MUSIC = {
  bgm_main_loop: { src: "./assets/audio/bgm/bgm_main_loop.ogg" },
};

let settings = loadAudioSettings();
const lastPlayMs = new Map();
const loopActive = new Set();

export function getAudioSettings() {
  return { ...settings };
}

export function setAudioSettings(partial) {
  const next = {
    music: clampPercent(partial?.music ?? settings.music),
    sfx: clampPercent(partial?.sfx ?? settings.sfx),
    mute: Boolean(partial?.mute ?? settings.mute),
  };
  settings = next;
  saveAudioSettings(next);
  const appState = getAppState();
  if (!appState.audio || hasSettingsDiff(appState.audio, next)) {
    setAppState({ audio: { ...next } });
  }
}

export function playSfx(id) {
  const meta = SFX[id];
  if (!meta || !canPlaySfx()) {
    return;
  }
  const now = getNowMs();
  const last = lastPlayMs.get(id) || 0;
  if (now - last < (meta.minIntervalMs || 0)) {
    return;
  }
  lastPlayMs.set(id, now);
}

export function setLoop(id, active) {
  if (active) {
    if (loopActive.has(id)) {
      return;
    }
    loopActive.add(id);
    playSfx(id);
    return;
  }
  loopActive.delete(id);
}

export function playMusic(id) {
  if (settings.mute || settings.music <= 0) {
    return;
  }
  if (!MUSIC[id]) {
    return;
  }
}

export function stopMusic() {}

export function getAudioAssets() {
  return {
    sfx: { ...SFX },
    music: { ...MUSIC },
  };
}

function canPlaySfx() {
  return !settings.mute && settings.sfx > 0;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasSettingsDiff(prev, next) {
  return (
    prev.music !== next.music || prev.sfx !== next.sfx || prev.mute !== next.mute
  );
}

function getNowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}
