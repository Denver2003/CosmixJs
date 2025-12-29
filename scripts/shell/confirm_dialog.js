import { OverlayId } from "./overlays.js";

export function setupConfirmDialog(router) {
  const overlay = router.getOverlay?.(OverlayId.CONFIRM);
  if (!overlay) {
    return null;
  }
  overlay.classList.add("confirm-overlay");

  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";

  const title = document.createElement("div");
  title.className = "confirm-dialog__title";
  const body = document.createElement("div");
  body.className = "confirm-dialog__body";

  const actions = document.createElement("div");
  actions.className = "confirm-dialog__actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "icon-button confirm-dialog__cancel";
  cancelBtn.textContent = "Cancel";

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "icon-button confirm-dialog__confirm";
  confirmBtn.textContent = "Confirm";

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  dialog.appendChild(title);
  dialog.appendChild(body);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);

  let onConfirm = null;
  let onCancel = null;

  function close() {
    router.popOverlay();
    onConfirm = null;
    onCancel = null;
  }

  cancelBtn.addEventListener("click", () => {
    if (typeof onCancel === "function") {
      onCancel();
    }
    close();
  });
  confirmBtn.addEventListener("click", () => {
    if (typeof onConfirm === "function") {
      onConfirm();
    }
    close();
  });

  return {
    open({ titleText, bodyText, onConfirm: confirmCb, onCancel: cancelCb } = {}) {
      title.textContent = titleText || "Confirm";
      body.textContent = bodyText || "";
      onConfirm = confirmCb || null;
      onCancel = cancelCb || null;
      router.pushOverlay(OverlayId.CONFIRM);
    },
  };
}
