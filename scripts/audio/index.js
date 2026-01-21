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

const AudioContextClass =
  typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
const WEB_AUDIO_SUPPORTED = Boolean(AudioContextClass);

let settings = loadAudioSettings();
const lastPlayMs = new Map();
const loopActive = new Set();
const loopPlayers = new Map();
const sfxPools = new Map();
let musicPlayer = null;
const SFX_POOL_LIMIT = 4;
const webAudio = {
  supported: WEB_AUDIO_SUPPORTED,
  context: null,
  sfxGain: null,
  musicGain: null,
  sfxBuffers: new Map(),
  musicBuffers: new Map(),
  sfxLoads: new Map(),
  musicLoads: new Map(),
  loopSources: new Map(),
  musicId: null,
  musicSource: null,
  musicSourceId: null,
  failed: false,
  unlocked: false,
};
let webAudioUnlockBound = false;

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
  if (useWebAudio()) {
    playSfxWeb(id);
    return;
  }
  playSfxHtml(id);
}

export function setLoop(id, active) {
  if (useWebAudio()) {
    setLoopWeb(id, active);
    return;
  }
  setLoopHtml(id, active);
}

export function playMusic(id) {
  if (useWebAudio()) {
    playMusicWeb(id);
    return;
  }
  playMusicHtml(id);
}

export function stopMusic() {
  if (useWebAudio()) {
    stopMusicWeb();
    return;
  }
  stopMusicHtml();
}

export function preloadAudio() {
  if (useWebAudio()) {
    preloadWebAudio();
    return;
  }
  preloadAudioHtml();
}

export function getAudioAssets() {
  return {
    sfx: { ...SFX },
    music: { ...MUSIC },
  };
}

function playSfxHtml(id) {
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

function setLoopHtml(id, active) {
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
  stopLoopHtml(id);
}

function playMusicHtml(id) {
  if (settings.mute || settings.music <= 0) {
    return;
  }
  const meta = MUSIC[id];
  if (!meta) {
    return;
  }
  if (!musicPlayer || musicPlayer.id !== id) {
    stopMusicHtml();
    const audio = createAudio(meta.src, true);
    musicPlayer = { id, audio };
  }
  if (!musicPlayer?.audio) {
    return;
  }
  musicPlayer.audio.volume = getMusicVolume();
  musicPlayer.audio.play().catch(() => {});
}

function stopMusicHtml() {
  if (!musicPlayer?.audio) {
    return;
  }
  musicPlayer.audio.pause();
  musicPlayer.audio.currentTime = 0;
}

function preloadAudioHtml() {
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
  applyHtmlVolumes();
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

function stopLoopHtml(id) {
  const audio = loopPlayers.get(id);
  if (!audio) {
    return;
  }
  audio.pause();
  audio.currentTime = 0;
}

function applyVolumes() {
  if (useWebAudio()) {
    applyWebVolumes();
    return;
  }
  applyHtmlVolumes();
}

function applyHtmlVolumes() {
  const sfxVolume = getSfxVolume();
  if (!canPlaySfx()) {
    for (const id of loopActive) {
      stopLoopHtml(id);
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

function useWebAudio() {
  return webAudio.supported && !webAudio.failed;
}

function bindWebAudioUnlock() {
  if (webAudioUnlockBound || typeof window === "undefined" || !useWebAudio()) {
    return;
  }
  webAudioUnlockBound = true;
  const pointerOptions = { capture: true, passive: true };
  const keyOptions = { capture: true };
  const unlock = () => {
    if (!useWebAudio()) {
      return;
    }
    const context = ensureWebAudioContext();
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }
    if (!webAudio.unlocked && context.state === "running") {
      unlockWebAudio(context);
      webAudio.unlocked = true;
      window.removeEventListener("pointerdown", unlock, pointerOptions);
      window.removeEventListener("touchend", unlock, pointerOptions);
      window.removeEventListener("mousedown", unlock, pointerOptions);
      window.removeEventListener("keydown", unlock, keyOptions);
    }
  };
  window.addEventListener("pointerdown", unlock, pointerOptions);
  window.addEventListener("touchend", unlock, pointerOptions);
  window.addEventListener("mousedown", unlock, pointerOptions);
  window.addEventListener("keydown", unlock, keyOptions);
}

function ensureWebAudioContext() {
  if (!useWebAudio()) {
    return null;
  }
  bindWebAudioUnlock();
  if (!webAudio.context) {
    try {
      webAudio.context = new AudioContextClass();
      webAudio.sfxGain = webAudio.context.createGain();
      webAudio.musicGain = webAudio.context.createGain();
      webAudio.sfxGain.connect(webAudio.context.destination);
      webAudio.musicGain.connect(webAudio.context.destination);
      webAudio.sfxGain.gain.value = getSfxVolume();
      webAudio.musicGain.gain.value = getMusicVolume();
    } catch (error) {
      webAudio.failed = true;
      return null;
    }
  }
  if (webAudio.context.state === "suspended") {
    webAudio.context.resume().catch(() => {});
  }
  return webAudio.context;
}

function unlockWebAudio(context) {
  if (!context) {
    return;
  }
  const buffer = context.createBuffer(1, 1, context.sampleRate);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
  source.stop(0);
}

function decodeAudioData(context, data) {
  if (context.decodeAudioData.length === 1) {
    return context.decodeAudioData(data);
  }
  return new Promise((resolve, reject) => {
    context.decodeAudioData(data, resolve, reject);
  });
}

function loadWebAudioBuffer(id, src, cache, pending) {
  if (!useWebAudio()) {
    return Promise.reject(new Error("WebAudio unavailable"));
  }
  if (cache.has(id)) {
    return Promise.resolve(cache.get(id));
  }
  if (pending.has(id)) {
    return pending.get(id);
  }
  const context = ensureWebAudioContext();
  if (!context) {
    return Promise.reject(new Error("WebAudio context missing"));
  }
  const request = fetch(src)
    .then((response) => response.arrayBuffer())
    .then((data) => decodeAudioData(context, data))
    .then((buffer) => {
      cache.set(id, buffer);
      pending.delete(id);
      return buffer;
    })
    .catch((error) => {
      pending.delete(id);
      throw error;
    });
  pending.set(id, request);
  return request;
}

function preloadWebAudio() {
  const context = ensureWebAudioContext();
  if (!context) {
    return;
  }
  const tasks = [];
  for (const [id, meta] of Object.entries(SFX)) {
    if (!meta?.src) {
      continue;
    }
    tasks.push(
      loadWebAudioBuffer(id, meta.src, webAudio.sfxBuffers, webAudio.sfxLoads).catch(
        () => null
      )
    );
  }
  for (const [id, meta] of Object.entries(MUSIC)) {
    if (!meta?.src) {
      continue;
    }
    tasks.push(
      loadWebAudioBuffer(id, meta.src, webAudio.musicBuffers, webAudio.musicLoads).catch(
        () => null
      )
    );
  }
  if (tasks.length > 0) {
    Promise.all(tasks).catch(() => {});
  }
  applyWebVolumes();
}

function playSfxWeb(id) {
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
  const buffer = webAudio.sfxBuffers.get(id);
  if (buffer) {
    startWebSfx(buffer);
    return;
  }
  loadWebAudioBuffer(id, meta.src, webAudio.sfxBuffers, webAudio.sfxLoads)
    .then((loaded) => {
      if (!loaded || !canPlaySfx()) {
        return;
      }
      startWebSfx(loaded);
    })
    .catch(() => {});
}

function startWebSfx(buffer) {
  const context = ensureWebAudioContext();
  if (!context || !webAudio.sfxGain) {
    return;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(webAudio.sfxGain);
  source.start(0);
}

function setLoopWeb(id, active) {
  if (active) {
    if (loopActive.has(id)) {
      return;
    }
    loopActive.add(id);
    startWebLoop(id);
    return;
  }
  loopActive.delete(id);
  stopWebLoop(id);
}

function startWebLoop(id) {
  if (!canPlaySfx()) {
    return;
  }
  if (webAudio.loopSources.has(id)) {
    return;
  }
  const meta = SFX[id];
  if (!meta?.src) {
    return;
  }
  const buffer = webAudio.sfxBuffers.get(id);
  if (!buffer) {
    loadWebAudioBuffer(id, meta.src, webAudio.sfxBuffers, webAudio.sfxLoads)
      .then((loaded) => {
        if (!loaded || !loopActive.has(id) || !canPlaySfx()) {
          return;
        }
        startWebLoop(id);
      })
      .catch(() => {});
    return;
  }
  const context = ensureWebAudioContext();
  if (!context || !webAudio.sfxGain) {
    return;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(webAudio.sfxGain);
  source.start(0);
  webAudio.loopSources.set(id, source);
}

function stopWebLoop(id) {
  const source = webAudio.loopSources.get(id);
  if (!source) {
    return;
  }
  try {
    source.stop(0);
  } catch (error) {
  }
  source.disconnect();
  webAudio.loopSources.delete(id);
}

function playMusicWeb(id) {
  const meta = MUSIC[id];
  if (!meta?.src) {
    return;
  }
  webAudio.musicId = id;
  if (settings.mute || settings.music <= 0) {
    stopWebMusicSource();
    return;
  }
  if (webAudio.musicSource && webAudio.musicSourceId === id) {
    return;
  }
  startWebMusic(id, meta.src);
}

function startWebMusic(id, src) {
  const buffer = webAudio.musicBuffers.get(id);
  if (buffer) {
    startWebMusicSource(buffer);
    return;
  }
  loadWebAudioBuffer(id, src, webAudio.musicBuffers, webAudio.musicLoads)
    .then((loaded) => {
      if (!loaded || webAudio.musicId !== id) {
        return;
      }
      if (settings.mute || settings.music <= 0) {
        return;
      }
      startWebMusicSource(loaded);
    })
    .catch(() => {});
}

function startWebMusicSource(buffer) {
  const context = ensureWebAudioContext();
  if (!context || !webAudio.musicGain) {
    return;
  }
  stopWebMusicSource();
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(webAudio.musicGain);
  source.start(0);
  webAudio.musicSource = source;
  webAudio.musicSourceId = webAudio.musicId;
}

function stopMusicWeb() {
  webAudio.musicId = null;
  stopWebMusicSource();
}

function stopWebMusicSource() {
  const source = webAudio.musicSource;
  if (!source) {
    return;
  }
  try {
    source.stop(0);
  } catch (error) {
  }
  source.disconnect();
  webAudio.musicSource = null;
  webAudio.musicSourceId = null;
}

function applyWebVolumes() {
  if (!webAudio.context) {
    return;
  }
  if (webAudio.sfxGain) {
    webAudio.sfxGain.gain.value = getSfxVolume();
  }
  if (webAudio.musicGain) {
    webAudio.musicGain.gain.value = getMusicVolume();
  }
  if (!canPlaySfx()) {
    for (const id of webAudio.loopSources.keys()) {
      stopWebLoop(id);
    }
  } else {
    for (const id of loopActive) {
      startWebLoop(id);
    }
  }
  if (settings.mute || settings.music <= 0) {
    stopWebMusicSource();
  } else if (webAudio.musicId && !webAudio.musicSource) {
    const meta = MUSIC[webAudio.musicId];
    if (meta?.src) {
      startWebMusic(webAudio.musicId, meta.src);
    }
  }
}
