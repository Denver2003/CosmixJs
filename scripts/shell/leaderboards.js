import { subscribeAppState } from "./app_state.js";
import { createHeaderBar, createIconButton, createPill, updatePill } from "./ui/header.js";

const SAMPLE_ROWS = [
  { rank: 1, name: "You", score: "12 450" },
  { rank: 2, name: "Guest_42", score: "10 880" },
  { rank: 3, name: "PlayerX", score: "9 640" },
  { rank: 4, name: "Guest_9", score: "8 210" },
  { rank: 5, name: "Neo", score: "7 980" },
];

export function setupLeaderboardsScreen(screen, router) {
  if (!screen) {
    return;
  }
  const userPill = createPill({ icon: "👤", label: "Guest", value: "" });
  const header = createHeaderBar({
    left: [
      createIconButton({
        icon: "←",
        label: "Back",
        onClick: () => router.showScreen("home"),
      }),
    ],
    title: "Leaderboards",
    right: [
      createIconButton({
        icon: "⟳",
        label: "Refresh",
      }),
      userPill,
    ],
  });
  screen.headerBar.replaceChildren(header.header);

  const tabs = document.createElement("div");
  tabs.className = "tabs";

  const allTimeTab = createTabButton("ALL-TIME", true);
  const weeklyTab = createTabButton("WEEKLY", false);

  tabs.appendChild(allTimeTab.button);
  tabs.appendChild(weeklyTab.button);

  const allTimePanel = document.createElement("div");
  allTimePanel.className = "tab-panel is-active";
  allTimePanel.appendChild(buildBoardList(SAMPLE_ROWS, "All-time"));

  const weeklyPanel = document.createElement("div");
  weeklyPanel.className = "tab-panel";
  weeklyPanel.appendChild(buildBoardList(SAMPLE_ROWS, "Week #01"));

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

  subscribeAppState((next) => {
    const label = next.userName ? next.userName : "Guest";
    updatePill(userPill, { label, value: "" });
  });
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

  const youRow = buildRow({ rank: "-", name: "You", score: "5 020" }, true);
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
  scoreNode.textContent = score;

  row.appendChild(rankNode);
  row.appendChild(nameNode);
  row.appendChild(scoreNode);
  return row;
}
