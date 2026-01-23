export function updateGunMarks(state) {
  const marks = state.bonusGunMarks;
  if (!marks || marks.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const next = [];
  for (const mark of marks) {
    if (now - mark.startMs <= 2000) {
      next.push(mark);
    }
  }
  state.bonusGunMarks = next;
}

export function drawGunMarks(state, ctx) {
  const marks = state.bonusGunMarks;
  if (!marks || marks.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  ctx.save();
  for (const mark of marks) {
    const t = Math.min(1, (now - mark.startMs) / 2000);
    const alpha = 1 - t;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    for (const ray of mark.rays || []) {
      ctx.moveTo(mark.x, mark.y);
      ctx.lineTo(mark.x + ray.x, mark.y + ray.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function buildGunRays() {
  const rays = [];
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const length = 5 + Math.random() * 6;
    rays.push({ x: Math.cos(angle) * length, y: Math.sin(angle) * length });
  }
  return rays;
}
