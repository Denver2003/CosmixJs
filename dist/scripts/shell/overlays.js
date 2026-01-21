export const OverlayId = {
  CONFIRM: "confirm",
  TOAST: "toast",
  LOADING: "loading",
  PAUSE: "pause",
  GAME_OVER: "game_over",
};

export function createOverlay(id) {
  const root = document.createElement("div");
  root.dataset.overlay = id;
  root.className = "overlay";
  return root;
}
