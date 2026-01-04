export class ScreenRouter {
  constructor({
    shellRoot,
    overlayRoot,
    defaultScreen = "game",
    keepShellOnGame = false,
  }) {
    this.shellRoot = shellRoot;
    this.overlayRoot = overlayRoot;
    this.defaultScreen = defaultScreen;
    this.keepShellOnGame = keepShellOnGame;
    this.screens = new Map();
    this.overlays = new Map();
    this.activeScreen = null;
    this.overlayStack = [];
    this.history = [];
  }

  registerScreen(id, element) {
    if (!id || !element) {
      return;
    }
    element.dataset.screen = id;
    element.classList.add("screen");
    element.style.display = "block";
    this.screens.set(id, element);
    if (!this.shellRoot.contains(element)) {
      this.shellRoot.appendChild(element);
    }
  }

  registerOverlay(id, element) {
    if (!id || !element) {
      return;
    }
    element.dataset.overlay = id;
    element.classList.add("overlay");
    element.style.display = "none";
    this.overlays.set(id, element);
    if (!this.overlayRoot.contains(element)) {
      this.overlayRoot.appendChild(element);
    }
  }

  getOverlay(id) {
    return this.overlays.get(id) || null;
  }

  showScreen(id, options = {}) {
    const target = id || this.defaultScreen;
    if (this.activeScreen === target) {
      return;
    }
    const recordHistory = options.recordHistory !== false;
    if (this.activeScreen && recordHistory) {
      this.history.push(this.activeScreen);
    }
    for (const [screenId, element] of this.screens) {
      element.classList.toggle("is-active", screenId === target);
    }
    this.activeScreen = target;
    const hideShell = target === "game" && !this.keepShellOnGame;
    this.shellRoot.classList.toggle("is-hidden", hideShell);
  }

  pushOverlay(id) {
    const overlay = this.overlays.get(id);
    if (!overlay) {
      return;
    }
    overlay.style.display = "block";
    this.overlayRoot.classList.remove("is-hidden");
    this.overlayStack.push(overlay);
  }

  popOverlay() {
    const overlay = this.overlayStack.pop();
    if (!overlay) {
      return false;
    }
    overlay.style.display = "none";
    if (this.overlayStack.length === 0) {
      this.overlayRoot.classList.add("is-hidden");
    }
    return true;
  }

  handleBack() {
    if (this.overlayStack.length > 0) {
      return this.popOverlay();
    }
    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.showScreen(prev, { recordHistory: false });
      return true;
    }
    if (this.activeScreen && this.activeScreen !== "home") {
      this.showScreen("home", { recordHistory: false });
      return true;
    }
    return false;
  }

  back() {
    return this.handleBack();
  }
}
