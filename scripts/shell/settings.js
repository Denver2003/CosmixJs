import { subscribeAppState } from "./app_state.js";
import { createHeaderBar, createIconButton } from "./ui/header.js";

export function setupSettingsScreen(screen, router, confirmDialog) {
  if (!screen) {
    return;
  }
  const userButton = createIconButton({ icon: "👤", label: "Guest" });
  const header = createHeaderBar({
    left: [
      createIconButton({
        icon: "←",
        label: "Back",
        onClick: () => router.showScreen("home"),
      }),
    ],
    title: "Settings",
    right: [userButton],
  });
  screen.headerBar.replaceChildren(header.header);

  const content = document.createElement("div");
  content.className = "settings-content";

  content.appendChild(
    createSection("Audio", [
      createSliderRow("Music", 70),
      createSliderRow("SFX", 80),
      createToggleRow("Mute", false),
    ])
  );

  content.appendChild(
    createSection("Account", [
      createInfoRow("Status", "Guest"),
      createActionRow("Login", "LOGIN"),
    ])
  );

  const resetButton = createActionRow("Reset progress", "RESET");
  resetButton.querySelector("button").classList.add("danger");
  resetButton.querySelector("button").addEventListener("click", () => {
    confirmDialog?.open({
      titleText: "Reset progress?",
      bodyText: "This will clear local progress.",
      onConfirm: () => {
        console.log("[shell] reset progress requested");
      },
    });
  });

  const restoreButton = createActionRow("Restore purchases", "RESTORE");
  content.appendChild(
    createSection("Data", [resetButton, restoreButton])
  );

  screen.contentArea.replaceChildren(content);
  screen.footerNav.replaceChildren();

  subscribeAppState((next) => {
    const label = next.userName ? next.userName : "Guest";
    const labelNode = userButton.querySelector(".icon-button__label");
    if (labelNode) {
      labelNode.textContent = label;
    }
  });
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

function createSliderRow(label, value) {
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.value = String(value ?? 50);
  return createRow(label, input);
}

function createToggleRow(label, checked) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
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
