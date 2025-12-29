export const ScreenId = {
  HOME: "home",
  SHOP: "shop",
  SETTINGS: "settings",
  LEADERBOARDS: "leaderboards",
  GAME: "game",
};

export function createScreen(id) {
  const root = document.createElement("div");
  root.dataset.screen = id;
  root.className = "screen shell-screen";

  const screenRoot = document.createElement("div");
  screenRoot.className = "screen-root";
  const backgroundLayer = document.createElement("div");
  backgroundLayer.className = "background-layer";
  const headerBar = document.createElement("div");
  headerBar.className = "header-bar-host";
  const contentArea = document.createElement("div");
  contentArea.className = "content-area";
  const footerNav = document.createElement("div");
  footerNav.className = "footer-nav";

  screenRoot.appendChild(backgroundLayer);
  screenRoot.appendChild(headerBar);
  screenRoot.appendChild(contentArea);
  screenRoot.appendChild(footerNav);
  root.appendChild(screenRoot);

  root.screenRoot = screenRoot;
  root.backgroundLayer = backgroundLayer;
  root.headerBar = headerBar;
  root.contentArea = contentArea;
  root.footerNav = footerNav;

  return root;
}
