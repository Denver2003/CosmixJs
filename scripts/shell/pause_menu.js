import { OverlayId } from "./overlays.js";
import { createIconButton, setIconButtonLabel } from "./ui/header.js";
import { getAudioSettings, setAudioSettings } from "../audio/index.js";
import { subscribeLanguage, t } from "../ui/i18n.js";

export function setupPauseMenu(router, handlers = {}) {
  const overlay = router.getOverlay?.(OverlayId.PAUSE);
  if (!overlay) {
    return null;
  }
  overlay.classList.add("pause-overlay");

  const panel = document.createElement("div");
  panel.className = "pause-menu";

  const title = document.createElement("div");
  title.className = "pause-menu__title";
  title.textContent = t("pause.title");

  const buttons = document.createElement("div");
  buttons.className = "pause-menu__buttons";

  const audioBlock = document.createElement("div");
  audioBlock.className = "pause-menu__audio";
  const audioTitle = document.createElement("div");
  audioTitle.className = "pause-menu__audio-title";
  audioTitle.textContent = t("label.audio");
  const audioSettings = getAudioSettings();
  const musicRow = createSliderRow(t("label.music"), audioSettings.music, "music");
  const sfxRow = createSliderRow(t("label.sfx"), audioSettings.sfx, "sfx");
  const muteRow = createToggleRow(t("label.mute"), audioSettings.mute, "mute");
  audioBlock.appendChild(audioTitle);
  audioBlock.appendChild(musicRow);
  audioBlock.appendChild(sfxRow);
  audioBlock.appendChild(muteRow);

  const resume = createIconButton({
    icon: "▶",
    label: t("button.resume"),
    onClick: () => {
      router.popOverlay();
      handlers.onResume?.();
    },
  });
  const restart = createIconButton({
    icon: "⟲",
    label: t("button.restart"),
    onClick: () => {
      router.popOverlay();
      handlers.onRestart?.();
    },
  });
  const home = createIconButton({
    icon: "⌂",
    label: t("button.home"),
    onClick: () => {
      router.popOverlay();
      router.showScreen("home");
      handlers.onHome?.();
    },
  });
  const shop = createIconButton({
    icon: "🛒",
    label: t("button.shop"),
    onClick: () => {
      router.popOverlay();
      router.showScreen("shop");
      handlers.onShop?.();
    },
  });

  buttons.appendChild(resume);
  buttons.appendChild(restart);
  buttons.appendChild(home);
  buttons.appendChild(shop);

  panel.appendChild(title);
  panel.appendChild(buttons);
  panel.appendChild(audioBlock);
  overlay.appendChild(panel);

  const musicLabel = musicRow.querySelector(".pause-menu__row-label");
  const sfxLabel = sfxRow.querySelector(".pause-menu__row-label");
  const muteLabel = muteRow.querySelector(".pause-menu__row-label");

  const applyTranslations = () => {
    title.textContent = t("pause.title");
    audioTitle.textContent = t("label.audio");
    if (musicLabel) musicLabel.textContent = t("label.music");
    if (sfxLabel) sfxLabel.textContent = t("label.sfx");
    if (muteLabel) muteLabel.textContent = t("label.mute");
    setIconButtonLabel(resume, t("button.resume"));
    setIconButtonLabel(restart, t("button.restart"));
    setIconButtonLabel(home, t("button.home"));
    setIconButtonLabel(shop, t("button.shop"));
  };

  subscribeLanguage(applyTranslations);

  return {
    open() {
      router.pushOverlay(OverlayId.PAUSE);
    },
    close() {
      router.popOverlay();
    },
  };
}

function createRow(label, control) {
  const row = document.createElement("div");
  row.className = "pause-menu__row";
  const title = document.createElement("div");
  title.className = "pause-menu__row-label";
  title.textContent = label;
  const right = document.createElement("div");
  right.className = "pause-menu__row-control";
  right.appendChild(control);
  row.appendChild(title);
  row.appendChild(right);
  return row;
}

function createSliderRow(label, value, key) {
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.value = String(value ?? 50);
  if (key) {
    input.addEventListener("input", () => {
      const next = Number.parseInt(input.value, 10);
      setAudioSettings({ [key]: Number.isFinite(next) ? next : 0 });
    });
  }
  return createRow(label, input);
}

function createToggleRow(label, checked, key) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  if (key) {
    input.addEventListener("change", () => {
      setAudioSettings({ [key]: input.checked });
    });
  }
  return createRow(label, input);
}
