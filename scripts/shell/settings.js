import { subscribeAppState } from "./app_state.js";
import { getAudioSettings, setAudioSettings } from "../audio/index.js";
import { createHeaderBar, createIconButton, setIconButtonLabel } from "./ui/header.js";
import { getLanguage, setLanguage, subscribeLanguage, t } from "../ui/i18n.js";

export function setupSettingsScreen(screen, router, confirmDialog) {
  if (!screen) {
    return;
  }
  const userButton = createIconButton({ icon: "👤", label: t("user.guest") });
  const backButton = createIconButton({
    icon: "←",
    label: t("nav.back"),
    onClick: () => router.back?.(),
  });
  const header = createHeaderBar({
    left: [backButton],
    title: t("settings.title"),
    right: [userButton],
  });
  screen.headerBar.replaceChildren(header.header);

  const content = document.createElement("div");
  content.className = "settings-content";
  const audio = getAudioSettings();

  const musicRow = createSliderRow(t("label.music"), audio.music, "music");
  const sfxRow = createSliderRow(t("label.sfx"), audio.sfx, "sfx");
  const muteRow = createToggleRow(t("label.mute"), audio.mute, "mute");
  const audioSection = createSection(t("label.audio"), [musicRow, sfxRow, muteRow]);

  const statusRow = createInfoRow(t("label.status"), t("user.guest"));
  const loginRow = createActionRow(t("label.login"), t("button.login"));
  const languageRow = createActionRow(t("label.language"), getLanguage().toUpperCase());
  const languageButton = languageRow.querySelector("button");
  languageButton.addEventListener("click", () => {
    const next = getLanguage() === "en" ? "ru" : "en";
    setLanguage(next);
  });
  const accountSection = createSection(t("label.account"), [statusRow, loginRow, languageRow]);

  const resetButton = createActionRow(t("label.reset_progress"), t("button.reset"));
  resetButton.querySelector("button").classList.add("danger");
  resetButton.querySelector("button").addEventListener("click", () => {
    confirmDialog?.open({
      titleText: t("confirm.reset_title"),
      bodyText: t("confirm.reset_body"),
      onConfirm: () => {
        console.log("[shell] reset progress requested");
      },
    });
  });

  const restoreButton = createActionRow(t("label.restore_purchases"), t("button.restore"));
  const dataSection = createSection(t("label.data"), [resetButton, restoreButton]);

  content.appendChild(audioSection);
  content.appendChild(accountSection);
  content.appendChild(dataSection);

  screen.contentArea.replaceChildren(content);
  screen.footerNav.replaceChildren();

  const headerTitle = header.header.querySelector(".header-title");
  const audioTitle = audioSection.querySelector(".settings-section__title");
  const accountTitle = accountSection.querySelector(".settings-section__title");
  const dataTitle = dataSection.querySelector(".settings-section__title");
  const musicLabel = musicRow.querySelector(".settings-row__label");
  const sfxLabel = sfxRow.querySelector(".settings-row__label");
  const muteLabel = muteRow.querySelector(".settings-row__label");
  const statusLabel = statusRow.querySelector(".settings-row__label");
  const statusValue = statusRow.querySelector(".settings-row__control");
  const loginLabel = loginRow.querySelector(".settings-row__label");
  const loginButton = loginRow.querySelector("button");
  const languageLabel = languageRow.querySelector(".settings-row__label");
  const resetLabel = resetButton.querySelector(".settings-row__label");
  const resetAction = resetButton.querySelector("button");
  const restoreLabel = restoreButton.querySelector(".settings-row__label");
  const restoreAction = restoreButton.querySelector("button");

  let currentUserName = "";
  const applyTranslations = () => {
    setIconButtonLabel(userButton, resolveUserLabel(currentUserName));
    if (headerTitle) headerTitle.textContent = t("settings.title");
    setIconButtonLabel(backButton, t("nav.back"));
    if (audioTitle) audioTitle.textContent = t("label.audio");
    if (accountTitle) accountTitle.textContent = t("label.account");
    if (dataTitle) dataTitle.textContent = t("label.data");
    if (musicLabel) musicLabel.textContent = t("label.music");
    if (sfxLabel) sfxLabel.textContent = t("label.sfx");
    if (muteLabel) muteLabel.textContent = t("label.mute");
    if (statusLabel) statusLabel.textContent = t("label.status");
    if (statusValue) statusValue.textContent = resolveUserLabel(currentUserName);
    if (loginLabel) loginLabel.textContent = t("label.login");
    if (loginButton) loginButton.textContent = t("button.login");
    if (languageLabel) languageLabel.textContent = t("label.language");
    if (languageButton) languageButton.textContent = getLanguage().toUpperCase();
    if (resetLabel) resetLabel.textContent = t("label.reset_progress");
    if (resetAction) resetAction.textContent = t("button.reset");
    if (restoreLabel) restoreLabel.textContent = t("label.restore_purchases");
    if (restoreAction) restoreAction.textContent = t("button.restore");
  };

  subscribeLanguage(applyTranslations);
  subscribeAppState((next) => {
    currentUserName = next.userName || "";
    setIconButtonLabel(userButton, resolveUserLabel(currentUserName));
    if (statusValue) {
      statusValue.textContent = resolveUserLabel(currentUserName);
    }
  });
}

function resolveUserLabel(value) {
  if (!value || value === "Guest") {
    return t("user.guest");
  }
  return value;
}

function createSection(title, rows) {
  const section = document.createElement("div");
  section.className = "settings-section";
  const header = document.createElement("div");
  header.className = "settings-section__title";
  header.textContent = title;
  section.appendChild(header);
  const body = document.createElement("div");
  body.className = "settings-section__body";
  for (const row of rows) {
    body.appendChild(row);
  }
  section.appendChild(body);
  return section;
}

function createRow(label, control) {
  const row = document.createElement("div");
  row.className = "settings-row";
  const title = document.createElement("div");
  title.className = "settings-row__label";
  title.textContent = label;
  const right = document.createElement("div");
  right.className = "settings-row__control";
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

function createInfoRow(label, value) {
  const text = document.createElement("div");
  text.textContent = value;
  return createRow(label, text);
}

function createActionRow(label, actionLabel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.textContent = actionLabel;
  return createRow(label, button);
}
