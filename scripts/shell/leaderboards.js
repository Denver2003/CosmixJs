import { subscribeAppState } from "./app_state.js";
import { formatNumber } from "../ui/format.js";
import {
  createHeaderBar,
  createIconButton,
  createPill,
  setIconButtonLabel,
  updatePill,
} from "./ui/header.js";
import { subscribeLanguage, t } from "../ui/i18n.js";

const SAMPLE_ROWS = [
  { rank: 1, name: "You", score: 12450 },
  { rank: 2, name: "Guest_42", score: 10880 },
  { rank: 3, name: "PlayerX", score: 9640 },
  { rank: 4, name: "Guest_9", score: 8210 },
  { rank: 5, name: "Neo", score: 7980 },
];

export function setupLeaderboardsScreen(screen, router) {
  if (!screen) {
    return;
  }
  const userPill = createPill({ icon: "👤", label: t("user.guest"), value: "" });
  const backButton = createIconButton({
    icon: "←",
    label: t("nav.back"),
    onClick: () => router.back?.(),
  });
  const refreshButton = createIconButton({
    icon: "⟳",
    label: t("label.refresh"),
  });
  const header = createHeaderBar({
    left: [backButton],
    title: t("leaderboards.title"),
    right: [refreshButton, userPill],
  });
  screen.headerBar.replaceChildren(header.header);

  const tabs = document.createElement("div");
  tabs.className = "tabs";

  const allTimeTab = createTabButton(t("label.all_time"), true);
  const weeklyTab = createTabButton(t("label.weekly"), false);

  tabs.appendChild(allTimeTab.button);
  tabs.appendChild(weeklyTab.button);

  const allTimePanel = document.createElement("div");
  allTimePanel.className = "tab-panel is-active";
  allTimePanel.appendChild(buildBoardList(SAMPLE_ROWS, t("label.all_time_title")));

  const weeklyPanel = document.createElement("div");
  weeklyPanel.className = "tab-panel";
  weeklyPanel.appendChild(buildBoardList(SAMPLE_ROWS, t("label.week_01")));

  allTimeTab.button.addEventListener("click", () => {
    setTabActive(allTimeTab, weeklyTab, allTimePanel, weeklyPanel);
  });
  weeklyTab.button.addEventListener("click", () => {
    setTabActive(weeklyTab, allTimeTab, weeklyPanel, allTimePanel);
  });

  const content = document.createElement("div");
  content.className = "leaderboards-content";
  content.appendChild(tabs);
  content.appendChild(allTimePanel);
  content.appendChild(weeklyPanel);

  screen.contentArea.replaceChildren(content);
  screen.footerNav.replaceChildren();

  const headerTitle = header.header.querySelector(".header-title");
  const allTimePeriod = allTimePanel.querySelector(".leaderboards-period");
  const weeklyPeriod = weeklyPanel.querySelector(".leaderboards-period");
  let currentUserName = "";
  const applyTranslations = () => {
    setIconButtonLabel(backButton, t("nav.back"));
    setIconButtonLabel(refreshButton, t("label.refresh"));
    if (headerTitle) headerTitle.textContent = t("leaderboards.title");
    allTimeTab.button.textContent = t("label.all_time");
    weeklyTab.button.textContent = t("label.weekly");
    if (allTimePeriod) allTimePeriod.textContent = t("label.all_time_title");
    if (weeklyPeriod) weeklyPeriod.textContent = t("label.week_01");
    updatePill(userPill, { label: resolveUserLabel(currentUserName), value: "" });
  };

  subscribeLanguage(applyTranslations);
  subscribeAppState((next) => {
    currentUserName = next.userName || "";
    updatePill(userPill, { label: resolveUserLabel(currentUserName), value: "" });
  });
}

function resolveUserLabel(value) {
  if (!value || value === "Guest") {
    return t("user.guest");
  }
  return value;
}

function createTabButton(label, active) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tab ${active ? "is-active" : ""}`;
  button.textContent = label;
  return { button };
}

function setTabActive(activeTab, inactiveTab, activePanel, inactivePanel) {
  activeTab.button.classList.add("is-active");
  inactiveTab.button.classList.remove("is-active");
  activePanel.classList.add("is-active");
  inactivePanel.classList.remove("is-active");
}

function buildBoardList(rows, label) {
  const list = document.createElement("div");
  list.className = "leaderboards-list";

  const period = document.createElement("div");
  period.className = "leaderboards-period";
  period.textContent = label;
  list.appendChild(period);

  for (const row of rows) {
    list.appendChild(buildRow(row, row.name === "You"));
  }

  const youRow = buildRow({ rank: "-", name: "You", score: 5020 }, true);
  youRow.classList.add("is-you");
  list.appendChild(youRow);

  return list;
}

function buildRow({ rank, name, score }, highlight) {
  const row = document.createElement("div");
  row.className = "leaderboards-row";
  if (highlight) {
    row.classList.add("is-highlight");
  }

  const rankNode = document.createElement("div");
  rankNode.textContent = rank;
  const nameNode = document.createElement("div");
  nameNode.textContent = name;
  const scoreNode = document.createElement("div");
  scoreNode.textContent = formatScore(score);

  row.appendChild(rankNode);
  row.appendChild(nameNode);
  row.appendChild(scoreNode);
  return row;
}

function formatScore(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return formatNumber(value);
  }
  const compact = String(value).replace(/\s+/g, "");
  if (/^-?\d+(\.\d+)?$/.test(compact)) {
    return formatNumber(Number(compact));
  }
  return String(value);
}
