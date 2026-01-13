import { getAppState, setAppState } from "../shell/app_state.js";
import { loadAudioSettings, saveAudioSettings } from "../game/storage.js";

const SFX = {
  drop_whoosh: { src: "./assets/audio/sfx/drop_whoosh.wav", minIntervalMs: 200 },
  impact_first: { src: "./assets/audio/sfx/impact_first.wav", minIntervalMs: 200 },
  chain_burst: { src: "./assets/audio/sfx/chain_burst.wav", minIntervalMs: 200 },
  bonus_bubble_pop: {
    src: "./assets/audio/sfx/bonus_bubble_pop.wav",
    minIntervalMs: 150,
  },
  bonus_coin_pick: {
    src: "./assets/audio/sfx/bonus_coin_pick.wav",
    minIntervalMs: 120,
  },
  bonus_points_pick: {
    src: "./assets/audio/sfx/bonus_points_pick.wav",
    minIntervalMs: 120,
  },
  bonus_instant_pick: {
    src: "./assets/audio/sfx/bonus_instant_pick.wav",
    minIntervalMs: 200,
  },
  bonus_grenade: { src: "./assets/audio/sfx/bonus_grenade.wav", minIntervalMs: 400 },
  bonus_hail_fall: {
    src: "./assets/audio/sfx/bonus_hail_fall.wav",
    minIntervalMs: 400,
  },
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
  game_over: { src: "./assets/audio/sfx/game_over.wav", minIntervalMs: 1000 },
  combo_basic: { src: "./assets/audio/sfx/combo_basic.wav", minIntervalMs: 400 },
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
const loopPlayers = new Map();
const sfxPools = new Map();
let musicPlayer = null;
const SFX_POOL_LIMIT = 4;

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
  applyVolumes();
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
  const audio = getSfxPlayer(id);
  if (!audio) {
    return;
  }
  audio.loop = false;
  audio.currentTime = 0;
  audio.volume = getSfxVolume();
  audio.play().catch(() => {});
}

export function setLoop(id, active) {
  if (active) {
    if (loopActive.has(id)) {
      return;
    }
    loopActive.add(id);
    const audio = getLoopPlayer(id);
    if (audio && canPlaySfx()) {
      audio.volume = getSfxVolume();
      audio.play().catch(() => {});
    }
    return;
  }
  loopActive.delete(id);
  stopLoop(id);
}

export function playMusic(id) {
  if (settings.mute || settings.music <= 0) {
    return;
  }
  const meta = MUSIC[id];
  if (!meta) {
    return;
  }
  if (!musicPlayer || musicPlayer.id !== id) {
    stopMusic();
    const audio = createAudio(meta.src, true);
    musicPlayer = { id, audio };
  }
  if (!musicPlayer?.audio) {
    return;
  }
  musicPlayer.audio.volume = getMusicVolume();
  musicPlayer.audio.play().catch(() => {});
}

export function stopMusic() {
  if (!musicPlayer?.audio) {
    return;
  }
  musicPlayer.audio.pause();
  musicPlayer.audio.currentTime = 0;
}

export function preloadAudio() {
  for (const [id, meta] of Object.entries(SFX)) {
    if (!meta?.src) {
      continue;
    }
    const entry = sfxPools.get(id) || { pool: [] };
    if (entry.pool.length === 0) {
      const audio = createAudio(meta.src, false);
      audio.load();
      entry.pool.push(audio);
      sfxPools.set(id, entry);
    } else {
      for (const audio of entry.pool) {
        audio.load();
      }
    }
  }
  for (const [id, meta] of Object.entries(SFX)) {
    if (!meta?.src) {
      continue;
    }
    if (!loopPlayers.has(id)) {
      const loopAudio = createAudio(meta.src, true);
      loopAudio.load();
      loopPlayers.set(id, loopAudio);
    }
  }
  for (const [id, meta] of Object.entries(MUSIC)) {
    if (!meta?.src) {
      continue;
    }
    if (!musicPlayer || musicPlayer.id !== id) {
      const audio = createAudio(meta.src, true);
      audio.load();
      if (!musicPlayer) {
        musicPlayer = { id, audio };
      }
    } else if (musicPlayer.audio) {
      musicPlayer.audio.load();
    }
  }
  applyVolumes();
}

export function getAudioAssets() {
  return {
    sfx: { ...SFX },
    music: { ...MUSIC },
  };
}

function canPlaySfx() {
  return !settings.mute && settings.sfx > 0;
}

function getSfxVolume() {
  return settings.mute ? 0 : clampPercent(settings.sfx) / 100;
}

function getMusicVolume() {
  return settings.mute ? 0 : clampPercent(settings.music) / 100;
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

function createAudio(src, loop = false) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = loop;
  return audio;
}

function getSfxPlayer(id) {
  const meta = SFX[id];
  if (!meta) {
    return null;
  }
  const entry = sfxPools.get(id) || { pool: [] };
  let candidate = entry.pool.find((audio) => audio.paused || audio.ended);
  if (!candidate && entry.pool.length < SFX_POOL_LIMIT) {
    candidate = createAudio(meta.src, false);
    entry.pool.push(candidate);
  }
  if (!candidate && entry.pool.length > 0) {
    candidate = entry.pool[0];
  }
  sfxPools.set(id, entry);
  return candidate || null;
}

function getLoopPlayer(id) {
  const meta = SFX[id];
  if (!meta) {
    return null;
  }
  if (loopPlayers.has(id)) {
    return loopPlayers.get(id);
  }
  const audio = createAudio(meta.src, true);
  loopPlayers.set(id, audio);
  return audio;
}

function stopLoop(id) {
  const audio = loopPlayers.get(id);
  if (!audio) {
    return;
  }
  audio.pause();
  audio.currentTime = 0;
}

function applyVolumes() {
  const sfxVolume = getSfxVolume();
  if (!canPlaySfx()) {
    for (const id of loopActive) {
      stopLoop(id);
    }
  }
  for (const id of loopActive) {
    const audio = getLoopPlayer(id);
    if (audio && canPlaySfx() && audio.paused) {
      audio.volume = sfxVolume;
      audio.play().catch(() => {});
    }
  }
  for (const entry of sfxPools.values()) {
    for (const audio of entry.pool) {
      audio.volume = sfxVolume;
    }
  }
  for (const audio of loopPlayers.values()) {
    audio.volume = sfxVolume;
  }
  const musicVolume = getMusicVolume();
  if (musicPlayer?.audio) {
    musicPlayer.audio.volume = musicVolume;
    if (musicVolume <= 0) {
      musicPlayer.audio.pause();
    } else if (musicPlayer.audio.paused) {
      musicPlayer.audio.play().catch(() => {});
    }
  }
}
