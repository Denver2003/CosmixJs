import { getAudioSettings, setAudioSettings } from "../audio/index.js";
import { getCapsuleLayout } from "./layout.js";
import { formatNumber } from "./format.js";
import { t } from "./i18n.js";

const overlayState = {
  pause: {
    handlers: {},
  },
  gameOver: {
    handlers: {},
    visible: false,
    continue: {
      visible: true,
      disabled: false,
      labelKey: "button.continue_ad",
      label: null,
    },
  },
  confirm: {
    open: false,
    title: t("confirm.title"),
    body: "",
    onConfirm: null,
    onCancel: null,
  },
};

const overlayLayout = {
  pause: null,
  gameOver: null,
  confirm: null,
  autoPause: null,
};

export function setupCanvasPauseMenu(handlers = {}) {
  overlayState.pause.handlers = handlers;
  return {
    open() {},
    close() {},
  };
}

export function setupCanvasGameOverMenu(handlers = {}) {
  overlayState.gameOver.handlers = handlers;
  return {
    open() {
      overlayState.gameOver.visible = true;
      overlayState.gameOver.openedAt = getNowMs();
    },
    close() {
      overlayState.gameOver.visible = false;
    },
    setContinueState({ visible = true, disabled = false, label, labelKey } = {}) {
      overlayState.gameOver.continue.visible = Boolean(visible);
      overlayState.gameOver.continue.disabled = Boolean(disabled);
      if (labelKey) {
        overlayState.gameOver.continue.labelKey = labelKey;
        overlayState.gameOver.continue.label = null;
      }
      if (label) {
        overlayState.gameOver.continue.label = label;
      }
    },
  };
}

export function setupCanvasConfirmDialog() {
  return {
    open: openCanvasConfirmDialog,
    close: closeCanvasConfirmDialog,
  };
}

export function openCanvasConfirmDialog({
  titleText,
  bodyText,
  onConfirm,
  onCancel,
} = {}) {
  overlayState.confirm.open = true;
  overlayState.confirm.title = titleText || t("confirm.title");
  overlayState.confirm.body = bodyText || "";
  overlayState.confirm.onConfirm = onConfirm || null;
  overlayState.confirm.onCancel = onCancel || null;
}

export function closeCanvasConfirmDialog() {
  overlayState.confirm.open = false;
  overlayState.confirm.onConfirm = null;
  overlayState.confirm.onCancel = null;
}

export function drawCanvasOverlays({
  ctx,
  render,
  getGlassRect,
  state,
  isGameActive,
}) {
  if (!ctx || !render) {
    return;
  }
  if (!state?.gameOver && overlayState.gameOver.visible) {
    overlayState.gameOver.visible = false;
  }
  const capsule = getCapsuleLayout(render, getGlassRect);
  if (!capsule) {
    return;
  }
  const showConfirm = overlayState.confirm.open;
  const showPauseMenu =
    Boolean(isGameActive) &&
    Boolean(state?.paused) &&
    state?.pausedReason === "manual";
  const showAutoPause =
    Boolean(isGameActive) &&
    Boolean(state?.paused) &&
    state?.pausedReason &&
    state?.pausedReason !== "manual";
  const showGameOverMenu =
    Boolean(isGameActive) &&
    Boolean(state?.gameOver) &&
    overlayState.gameOver.visible;

  if (!showConfirm && !showPauseMenu && !showAutoPause && !showGameOverMenu) {
    overlayLayout.pause = null;
    overlayLayout.gameOver = null;
    overlayLayout.confirm = null;
    overlayLayout.autoPause = null;
    return;
  }

  const inner = capsule.inner;
  const dimAlpha = Math.max(
    showGameOverMenu ? 0.6 : 0,
    showPauseMenu ? 0.5 : 0,
    showAutoPause ? 0.45 : 0,
    showConfirm ? 0.6 : 0
  );
  if (dimAlpha > 0) {
    drawCapsuleDim(ctx, inner, dimAlpha);
  }

  if (showPauseMenu) {
    overlayLayout.pause = drawPauseMenu(ctx, inner);
  } else {
    overlayLayout.pause = null;
  }

  if (showAutoPause) {
    overlayLayout.autoPause = drawAutoPause(ctx, inner, state);
  } else {
    overlayLayout.autoPause = null;
  }

  if (showGameOverMenu) {
    overlayLayout.gameOver = drawGameOverMenu(ctx, inner, state);
  } else {
    overlayLayout.gameOver = null;
  }

  if (showConfirm) {
    overlayLayout.confirm = drawConfirmDialog(ctx, inner);
  } else {
    overlayLayout.confirm = null;
  }
}

export function handleCanvasOverlayPointer({
  x,
  y,
  render,
  state,
  isGameActive,
}) {
  if (!render) {
    return false;
  }
  if (overlayState.confirm.open) {
    if (overlayLayout.confirm) {
      if (hitButton(x, y, overlayLayout.confirm.cancel)) {
        overlayState.confirm.onCancel?.();
        closeCanvasConfirmDialog();
        return true;
      }
      if (hitButton(x, y, overlayLayout.confirm.confirm)) {
        overlayState.confirm.onConfirm?.();
        closeCanvasConfirmDialog();
        return true;
      }
    }
    return true;
  }

  if (isGameActive && state?.paused && state?.pausedReason !== "manual") {
    return true;
  }

  if (isGameActive && state?.paused && state?.pausedReason === "manual") {
    const { buttons, sliders, toggle } = overlayLayout.pause || {};
    if (hitButton(x, y, buttons?.resume)) {
      overlayState.pause.handlers.onResume?.();
      return true;
    }
    if (hitButton(x, y, buttons?.restart)) {
      overlayState.pause.handlers.onRestart?.();
      return true;
    }
    if (hitButton(x, y, buttons?.home)) {
      overlayState.pause.handlers.onHome?.();
      return true;
    }
    if (hitButton(x, y, buttons?.shop)) {
      overlayState.pause.handlers.onShop?.();
      return true;
    }
    if (sliders?.music && pointInRect(x, y, sliders.music)) {
      const next = sliderValueAt(sliders.music, x);
      setAudioSettings({ music: next });
      return true;
    }
    if (sliders?.sfx && pointInRect(x, y, sliders.sfx)) {
      const next = sliderValueAt(sliders.sfx, x);
      setAudioSettings({ sfx: next });
      return true;
    }
    if (toggle?.mute && pointInRect(x, y, toggle.mute)) {
      const current = getAudioSettings();
      setAudioSettings({ mute: !current.mute });
      return true;
    }
    return true;
  }

  if (isGameActive && state?.gameOver && overlayState.gameOver.visible) {
    const { buttons } = overlayLayout.gameOver || {};
    if (
      buttons?.continue &&
      !overlayState.gameOver.continue.disabled &&
      hitButton(x, y, buttons.continue)
    ) {
      overlayState.gameOver.handlers.onContinue?.();
      return true;
    }
    if (hitButton(x, y, buttons?.retry)) {
      overlayState.gameOver.visible = false;
      overlayState.gameOver.handlers.onRetry?.();
      return true;
    }
    if (hitButton(x, y, buttons?.home)) {
      overlayState.gameOver.visible = false;
      overlayState.gameOver.handlers.onHome?.();
      return true;
    }
    if (hitButton(x, y, buttons?.shop)) {
      overlayState.gameOver.visible = false;
      overlayState.gameOver.handlers.onShop?.();
      return true;
    }
    return true;
  }

  return false;
}

export function handleCanvasOverlayBack({ state, isGameActive } = {}) {
  if (overlayState.confirm.open) {
    overlayState.confirm.onCancel?.();
    closeCanvasConfirmDialog();
    return true;
  }
  if (isGameActive && state?.paused) {
    return true;
  }
  if (isGameActive && state?.gameOver && overlayState.gameOver.visible) {
    return true;
  }
  return false;
}

function drawPauseMenu(ctx, inner) {
  const scale = getUiScale(inner);
  const panelWidth = clamp(inner.width * 0.78, 260 * scale, 420 * scale);
  const pad = clamp(16 * scale, 8, 22);
  const gap = clamp(10 * scale, 6, 12);
  const titleSize = clamp(Math.round(inner.height * 0.05), 12, 22);
  const buttonHeight = clamp(Math.round(inner.height * 0.075), 28, 48);
  const rowGap = clamp(8 * scale, 6, 10);
  const audioTitleSize = clamp(Math.round(inner.height * 0.032), 9, 12);
  const audioRowHeight = clamp(Math.round(inner.height * 0.06), 20, 30);
  const audioPad = clamp(10 * scale, 6, 10);

  const buttonsHeight = buttonHeight * 2 + rowGap;
  const audioBlockHeight =
    audioPad * 2 + audioTitleSize + rowGap + audioRowHeight * 3;
  const panelHeight = pad * 2 + titleSize + gap + buttonsHeight + gap + audioBlockHeight;
  const panelX = inner.x + (inner.width - panelWidth) / 2;
  const panelY = inner.y + (inner.height - panelHeight) / 2;

  drawModalPanel(ctx, panelX, panelY, panelWidth, panelHeight);
  drawModalTitle(ctx, panelX, panelY, panelWidth, titleSize, t("pause.title"));

  const buttonWidth = (panelWidth - pad * 2 - rowGap) / 2;
  const buttonsY = panelY + pad + titleSize + gap;

  const resume = drawModalButton(
    ctx,
    panelX + pad,
    buttonsY,
    buttonWidth,
    buttonHeight,
    t("button.resume"),
    { primary: true }
  );
  const restart = drawModalButton(
    ctx,
    panelX + pad + buttonWidth + rowGap,
    buttonsY,
    buttonWidth,
    buttonHeight,
    t("button.restart")
  );
  const home = drawModalButton(
    ctx,
    panelX + pad,
    buttonsY + buttonHeight + rowGap,
    buttonWidth,
    buttonHeight,
    t("button.home")
  );
  const shop = drawModalButton(
    ctx,
    panelX + pad + buttonWidth + rowGap,
    buttonsY + buttonHeight + rowGap,
    buttonWidth,
    buttonHeight,
    t("button.shop")
  );

  const audioY = buttonsY + buttonsHeight + gap;
  drawModalPanel(
    ctx,
    panelX + pad,
    audioY,
    panelWidth - pad * 2,
    audioBlockHeight,
    {
      fill: "rgba(255, 255, 255, 0.06)",
      stroke: "rgba(255, 255, 255, 0.12)",
    }
  );
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  drawFittedText(ctx, t("label.audio_caps"), panelX + pad + audioPad, audioY + audioPad, {
    size: audioTitleSize,
    minSize: Math.max(9, audioTitleSize - 3),
    maxWidth: panelWidth - pad * 2 - audioPad * 2,
  });
  ctx.restore();

  const audio = getAudioSettings();
  const sliderWidth = Math.max(64, panelWidth * 0.35);
  const sliderHeight = clamp(Math.round(audioRowHeight * 0.25), 4, 8);
  const rowStartY = audioY + audioPad + audioTitleSize + rowGap;
  const labelsX = panelX + pad + audioPad;
  const controlX = panelX + panelWidth - pad - audioPad - sliderWidth;

  const music = drawAudioRow(
    ctx,
    labelsX,
    controlX,
    rowStartY,
    audioRowHeight,
    t("label.music_caps"),
    sliderWidth,
    sliderHeight,
    audio.music ?? 50
  );
  const sfx = drawAudioRow(
    ctx,
    labelsX,
    controlX,
    rowStartY + audioRowHeight,
    audioRowHeight,
    t("label.sfx_caps"),
    sliderWidth,
    sliderHeight,
    audio.sfx ?? 50
  );
  const mute = drawAudioToggle(
    ctx,
    labelsX,
    controlX,
    rowStartY + audioRowHeight * 2,
    audioRowHeight,
    t("label.mute_caps"),
    sliderWidth,
    Boolean(audio.mute)
  );

  return {
    buttons: { resume, restart, home, shop },
    sliders: { music, sfx },
    toggle: { mute },
    panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
  };
}

function drawAutoPause(ctx, inner, state) {
  const scale = getUiScale(inner);
  const panelWidth = Math.min(260, inner.width * 0.7);
  const panelHeight = clamp(Math.round(inner.height * 0.12), 42, 64);
  const panelX = inner.x + (inner.width - panelWidth) / 2;
  const panelY = inner.y + (inner.height - panelHeight) / 2;
  drawModalPanel(ctx, panelX, panelY, panelWidth, panelHeight);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, t("pause.auto"), panelX + panelWidth / 2, panelY + panelHeight * 0.4, {
    size: Math.max(10, Math.round(14 * scale)),
    minSize: 9,
    maxWidth: panelWidth - 16,
  });
  if (state?.pausedResumeMs) {
    const nowMs = getNowMs();
    const remaining = Math.max(0, state.pausedResumeMs - nowMs);
    const seconds = Math.ceil(remaining / 1000);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    drawFittedText(
      ctx,
      t("pause.resuming_in", { seconds: formatNumber(seconds) }),
      panelX + panelWidth / 2,
      panelY + panelHeight * 0.68,
      {
        size: Math.max(9, Math.round(12 * scale)),
        minSize: 8,
        maxWidth: panelWidth - 16,
      }
    );
  }
  ctx.restore();
  return { panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight } };
}

function drawGameOverMenu(ctx, inner) {
  const scale = getUiScale(inner);
  const panelWidth = clamp(inner.width * 0.78, 260 * scale, 420 * scale);
  const pad = clamp(16 * scale, 8, 22);
  const gap = clamp(10 * scale, 6, 12);
  const titleSize = clamp(Math.round(inner.height * 0.05), 12, 22);
  const buttonHeight = clamp(Math.round(inner.height * 0.075), 28, 48);
  const rowGap = clamp(8 * scale, 6, 10);
  const buttonWidth = (panelWidth - pad * 2 - rowGap) / 2;

  const buttons = [];
  if (overlayState.gameOver.continue.visible) {
    buttons.push({
      key: "continue",
      label: resolveContinueLabel(),
      primary: true,
      full: true,
      disabled: overlayState.gameOver.continue.disabled,
    });
  }
  buttons.push(
    { key: "retry", label: t("button.retry"), primary: true },
    { key: "home", label: t("button.home") },
    { key: "shop", label: t("button.shop") }
  );

  const fullButtonCount = buttons.filter((button) => button.full).length;
  const fullButtonsHeight = fullButtonCount
    ? fullButtonCount * buttonHeight + (fullButtonCount - 1) * rowGap
    : 0;
  const gridButtons = buttons.filter((button) => !button.full);
  const gridRows = Math.ceil(gridButtons.length / 2);
  const gridHeight =
    gridRows > 0 ? gridRows * buttonHeight + (gridRows - 1) * rowGap : 0;

  const panelHeight =
    pad * 2 +
    titleSize +
    gap +
    fullButtonsHeight +
    (fullButtonsHeight && gridHeight ? gap : 0) +
    gridHeight;
  const panelX = inner.x + (inner.width - panelWidth) / 2;
  const panelY = inner.y + (inner.height - panelHeight) / 2;

  drawModalPanel(ctx, panelX, panelY, panelWidth, panelHeight);
  drawModalTitle(ctx, panelX, panelY, panelWidth, titleSize, t("game_over.title"));

  let buttonY = panelY + pad + titleSize + gap;
  const outButtons = {};
  for (const button of buttons) {
    if (!button.full) {
      continue;
    }
    const rect = drawModalButton(
      ctx,
      panelX + pad,
      buttonY,
      panelWidth - pad * 2,
      buttonHeight,
      button.label,
      { primary: button.primary, disabled: button.disabled }
    );
    outButtons[button.key] = rect;
    buttonY += buttonHeight + rowGap;
  }
  if (fullButtonsHeight && gridHeight) {
    buttonY += gap - rowGap;
  }
  for (let i = 0; i < gridButtons.length; i += 1) {
    const button = gridButtons[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const rect = drawModalButton(
      ctx,
      panelX + pad + col * (buttonWidth + rowGap),
      buttonY + row * (buttonHeight + rowGap),
      buttonWidth,
      buttonHeight,
      button.label,
      { primary: button.primary }
    );
    outButtons[button.key] = rect;
  }

  return {
    buttons: outButtons,
    panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
  };
}

function drawConfirmDialog(ctx, inner) {
  const scale = getUiScale(inner);
  const panelWidth = clamp(inner.width * 0.72, 200 * scale, 360 * scale);
  const pad = clamp(16 * scale, 8, 22);
  const gap = clamp(8 * scale, 6, 10);
  const titleSize = clamp(Math.round(inner.height * 0.045), 12, 20);
  const bodySize = clamp(Math.round(inner.height * 0.032), 9, 13);
  const buttonHeight = clamp(Math.round(inner.height * 0.07), 26, 42);
  const rowGap = clamp(8 * scale, 6, 10);

  ctx.save();
  ctx.font = `${bodySize}px "RussoOne", sans-serif`;
  const lines = wrapText(ctx, overlayState.confirm.body || "", panelWidth - pad * 2);
  ctx.restore();
  const bodyHeight = lines.length * (bodySize + 4);
  const panelHeight =
    pad * 2 + titleSize + gap + bodyHeight + gap + buttonHeight;
  const panelX = inner.x + (inner.width - panelWidth) / 2;
  const panelY = inner.y + (inner.height - panelHeight) / 2;

  drawModalPanel(ctx, panelX, panelY, panelWidth, panelHeight);
  drawModalTitle(ctx, panelX, panelY, panelWidth, titleSize, overlayState.confirm.title);

  const bodyX = panelX + pad;
  let bodyY = panelY + pad + titleSize + gap;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const line of lines) {
    drawFittedText(ctx, line, bodyX, bodyY, {
      size: bodySize,
      minSize: Math.max(8, bodySize - 2),
      maxWidth: panelWidth - pad * 2,
    });
    bodyY += bodySize + 4;
  }
  ctx.restore();

  const buttonWidth = (panelWidth - pad * 2 - rowGap) / 2;
  const buttonsY = panelY + panelHeight - pad - buttonHeight;
  const cancel = drawModalButton(
    ctx,
    panelX + pad,
    buttonsY,
    buttonWidth,
    buttonHeight,
    t("button.cancel")
  );
  const confirm = drawModalButton(
    ctx,
    panelX + pad + buttonWidth + rowGap,
    buttonsY,
    buttonWidth,
    buttonHeight,
    t("button.confirm"),
    { primary: true }
  );

  return {
    buttons: { cancel, confirm },
    cancel,
    confirm,
    panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
  };
}

function drawAudioRow(
  ctx,
  labelX,
  controlX,
  y,
  height,
  label,
  sliderWidth,
  sliderHeight,
  value
) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, labelX, y + height / 2, {
    size: Math.max(9, Math.round(height * 0.4)),
    minSize: 8,
    maxWidth: Math.max(40, controlX - labelX - 8),
  });
  ctx.restore();
  const sliderY = y + (height - sliderHeight) / 2;
  drawSlider(ctx, controlX, sliderY, sliderWidth, sliderHeight, value);
  return { x: controlX, y: sliderY, width: sliderWidth, height: sliderHeight };
}

function drawAudioToggle(ctx, labelX, controlX, y, height, label, width, on) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, labelX, y + height / 2, {
    size: Math.max(9, Math.round(height * 0.4)),
    minSize: 8,
    maxWidth: Math.max(40, controlX - labelX - 8),
  });
  ctx.restore();
  const toggleWidth = Math.max(36, Math.min(width * 0.35, 46));
  const toggleHeight = Math.max(16, Math.min(height * 0.7, 20));
  const toggleX = controlX + width - toggleWidth;
  const toggleY = y + (height - toggleHeight) / 2;
  drawToggle(ctx, toggleX, toggleY, toggleWidth, toggleHeight, on);
  return { x: toggleX, y: toggleY, width: toggleWidth, height: toggleHeight };
}

function resolveContinueLabel() {
  if (overlayState.gameOver.continue.label) {
    return overlayState.gameOver.continue.label;
  }
  const key = overlayState.gameOver.continue.labelKey;
  if (key) {
    return t(key);
  }
  return t("button.continue_ad");
}

function drawCapsuleDim(ctx, inner, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(5, 8, 12, ${alpha})`;
  ctx.fillRect(inner.x, inner.y, inner.width, inner.height);
  ctx.restore();
}

function drawModalPanel(ctx, x, y, width, height, options = {}) {
  const radius = Math.min(20, height * 0.2);
  drawPrismPanel(ctx, x, y, width, height, radius, options);
}

function drawModalTitle(ctx, panelX, panelY, panelWidth, size, text) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  drawFittedText(ctx, text, panelX + panelWidth / 2, panelY + Math.max(6, size * 0.15), {
    size,
    minSize: Math.max(9, Math.round(size * 0.7)),
    maxWidth: panelWidth - 24,
  });
  ctx.restore();
}

function drawModalButton(ctx, x, y, width, height, label, options = {}) {
  const primary = Boolean(options.primary);
  const disabled = Boolean(options.disabled);
  const fill = primary ? "rgba(95, 227, 255, 0.28)" : "rgba(255, 255, 255, 0.08)";
  const stroke = primary ? "rgba(95, 227, 255, 0.8)" : "rgba(255, 255, 255, 0.35)";
  ctx.save();
  roundRect(ctx, x, y, width, height, Math.min(14, height / 2));
  ctx.fillStyle = disabled ? "rgba(255, 255, 255, 0.08)" : fill;
  ctx.strokeStyle = disabled ? "rgba(255, 255, 255, 0.25)" : stroke;
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = disabled ? "rgba(255, 255, 255, 0.55)" : "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, x + width / 2, y + height / 2, {
    size: Math.max(9, Math.round(height * 0.32)),
    minSize: 8,
    maxWidth: width - 16,
  });
  ctx.restore();
  return { x, y, width, height };
}

function drawPrismPanel(ctx, x, y, width, height, radius, options = {}) {
  const fill = options.fill || "rgba(12, 18, 26, 0.85)";
  const stroke = options.stroke || "rgba(95, 227, 255, 0.45)";
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  roundRect(ctx, x + 1.5, y + 1.5, width - 3, height - 3, Math.max(2, radius - 1));
  ctx.stroke();
  ctx.restore();
}

function drawSlider(ctx, x, y, width, height, value) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  const fillWidth = Math.max(0, Math.min(1, (value || 0) / 100)) * width;
  ctx.fillStyle = "rgba(95, 227, 255, 0.9)";
  roundRect(ctx, x, y, fillWidth, height, height / 2);
  ctx.fill();
  ctx.restore();
}

function drawToggle(ctx, x, y, width, height, on) {
  ctx.save();
  ctx.fillStyle = on ? "rgba(95, 227, 255, 0.7)" : "rgba(255, 255, 255, 0.2)";
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  const knobX = on ? x + width - height + 2 : x + 2;
  ctx.beginPath();
  ctx.arc(knobX + height / 2 - 2, y + height / 2, height / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wrapText(ctx, text, maxWidth) {
  if (!text) {
    return [""];
  }
  const lines = [];
  const chunks = String(text).split("\n");
  for (const chunk of chunks) {
    const words = chunk.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const next = `${line} ${words[i]}`;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
      } else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
  }
  return lines;
}

function sliderValueAt(rect, x) {
  if (!rect || rect.width <= 0) {
    return 0;
  }
  const t = (x - rect.x) / rect.width;
  return Math.max(0, Math.min(100, Math.round(t * 100)));
}

function hitButton(x, y, rect) {
  return rect && pointInRect(x, y, rect);
}

function pointInRect(x, y, rect) {
  return (
    rect &&
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getUiScale(inner) {
  const scale = Math.min(inner.width / 360, inner.height / 640);
  return clamp(scale, 0.6, 1.1);
}

function drawFittedText(ctx, text, x, y, options = {}) {
  const fontFamily = options.fontFamily ?? "\"RussoOne\", sans-serif";
  const maxWidth = options.maxWidth ?? Infinity;
  let size = Math.round(options.size ?? 12);
  const minSize = Math.round(options.minSize ?? Math.max(8, size - 3));

  if (Number.isFinite(maxWidth) && maxWidth > 0) {
    ctx.font = `${size}px ${fontFamily}`;
    while (size > minSize && ctx.measureText(text).width > maxWidth) {
      size -= 1;
      ctx.font = `${size}px ${fontFamily}`;
    }
  }

  let drawText = text;
  if (Number.isFinite(maxWidth) && maxWidth > 0) {
    ctx.font = `${size}px ${fontFamily}`;
    if (ctx.measureText(drawText).width > maxWidth) {
      drawText = ellipsizeText(ctx, drawText, maxWidth);
    }
  }

  ctx.font = `${size}px ${fontFamily}`;
  ctx.fillText(drawText, x, y);
  return { size, text: drawText };
}

function ellipsizeText(ctx, text, maxWidth) {
  if (!text) {
    return "";
  }
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    return text;
  }
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  const ellipsis = "...";
  let end = text.length;
  while (end > 0) {
    const candidate = `${text.slice(0, end)}${ellipsis}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      return candidate;
    }
    end -= 1;
  }
  return ellipsis;
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function getNowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}
