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
import { refreshAllTimeLeaderboard } from "../leaderboards/index.js";

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

  const allTimePanel = document.createElement("div");
  allTimePanel.className = "tab-panel is-active";
  const list = buildBoardList([], t("label.all_time_title"));
  allTimePanel.appendChild(list);

  const content = document.createElement("div");
  content.className = "leaderboards-content";
  content.appendChild(allTimePanel);

  screen.contentArea.replaceChildren(content);
  screen.footerNav.replaceChildren();

  const headerTitle = header.header.querySelector(".header-title");
  const allTimePeriod = allTimePanel.querySelector(".leaderboards-period");
  let currentUserName = "";
  let leaderboardTitle = "";
  const applyTranslations = () => {
    setIconButtonLabel(backButton, t("nav.back"));
    setIconButtonLabel(refreshButton, t("label.refresh"));
    if (headerTitle) headerTitle.textContent = t("leaderboards.title");
    if (allTimePeriod) {
      allTimePeriod.textContent = leaderboardTitle || t("label.all_time_title");
    }
    updatePill(userPill, { label: resolveUserLabel(currentUserName), value: "" });
  };

  subscribeLanguage(applyTranslations);
  subscribeAppState((next) => {
    currentUserName = next.userName || "";
    updatePill(userPill, { label: resolveUserLabel(currentUserName), value: "" });
    leaderboardTitle = next.leaderboards?.title || "";
    renderBoardList(
      list,
      next.leaderboards?.allTime || [],
      leaderboardTitle || t("label.all_time_title")
    );
  });

  refreshButton.addEventListener("click", () => {
    refreshAllTimeLeaderboard();
  });
  refreshAllTimeLeaderboard();
}

function resolveUserLabel(value) {
  if (!value || value === "Guest") {
    return t("user.guest");
  }
  return value;
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

  return list;
}

function renderBoardList(list, rows, label) {
  list.replaceChildren();
  const period = document.createElement("div");
  period.className = "leaderboards-period";
  period.textContent = label;
  list.appendChild(period);
  for (const row of rows) {
    list.appendChild(buildRow(row, row.highlight));
  }
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
