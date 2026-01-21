import { ScreenId } from "./screens.js";
import { subscribeAppState } from "./app_state.js";
import {
  createHeaderBar,
  createIconButton,
  createPill,
  setIconButtonLabel,
  updatePill,
} from "./ui/header.js";
import { subscribeLanguage, t } from "../ui/i18n.js";

export function setupHomeScreen(screen, router, handlers = {}) {
  if (!screen) {
    return;
  }
  const userButton = createIconButton({ icon: "👤", label: t("user.guest") });
  const coinsPill = createPill({ icon: "💰", label: t("label.coins"), value: "0" });
  const bestPill = createPill({ icon: "🏆", label: t("label.best"), value: "0" });
  const header = createHeaderBar({
    left: [userButton],
    right: [coinsPill, bestPill],
  });
  screen.headerBar.replaceChildren(header.header);

  const content = document.createElement("div");
  content.className = "home-content";

  const hero = document.createElement("div");
  hero.className = "home-hero";

  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "home-play";
  playButton.textContent = t("nav.play");
  playButton.addEventListener("click", () => {
    router.showScreen(ScreenId.GAME);
    if (typeof handlers.onPlay === "function") {
      handlers.onPlay();
    }
  });

  const subtitle = document.createElement("div");
  subtitle.className = "home-subtitle";
  subtitle.textContent = t("home.subtitle_alt");

  hero.appendChild(playButton);
  hero.appendChild(subtitle);
  content.appendChild(hero);
  screen.contentArea.replaceChildren(content);

  const footer = document.createElement("div");
  footer.className = "home-footer";
  const shopButton = createIconButton({
    icon: "🛒",
    label: t("nav.shop"),
    onClick: () => router.showScreen(ScreenId.SHOP),
  });
  const leadersButton = createIconButton({
    icon: "🏆",
    label: t("nav.leaders"),
    onClick: () => router.showScreen(ScreenId.LEADERBOARDS),
  });
  const settingsButton = createIconButton({
    icon: "⚙️",
    label: t("nav.settings"),
    onClick: () => router.showScreen(ScreenId.SETTINGS),
  });
  footer.appendChild(shopButton);
  footer.appendChild(leadersButton);
  footer.appendChild(settingsButton);
  screen.footerNav.replaceChildren(footer);

  let currentUserName = "";
  const applyTranslations = () => {
    setIconButtonLabel(userButton, resolveUserLabel(currentUserName));
    updatePill(coinsPill, { label: t("label.coins") });
    updatePill(bestPill, { label: t("label.best") });
    playButton.textContent = t("nav.play");
    subtitle.textContent = t("home.subtitle_alt");
    setIconButtonLabel(shopButton, t("nav.shop"));
    setIconButtonLabel(leadersButton, t("nav.leaders"));
    setIconButtonLabel(settingsButton, t("nav.settings"));
  };

  subscribeLanguage(applyTranslations);
  subscribeAppState((next) => {
    currentUserName = next.userName || "";
    setIconButtonLabel(userButton, resolveUserLabel(currentUserName));
    updatePill(coinsPill, { value: next.coins });
    updatePill(bestPill, { value: next.bestScore });
  });
}

function resolveUserLabel(value) {
  if (!value || value === "Guest") {
    return t("user.guest");
  }
  return value;
}
