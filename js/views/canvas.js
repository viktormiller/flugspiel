// Gemeinsame Helfer für alle Spielansichten: Canvas, Schleife, Emoji, Farben.
export const COLOR = {
  red: "#ef476f",
  yellow: "#ffd166",
  green: "#06d6a0",
  blue: "#118ab2",
  purple: "#9b5de5",
  orange: "#ff9f1c",
};

export const TOP_SAFE = 100;
export const BOTTOM_SAFE = 40;

export function setupCanvas(root) {
  const canvas = document.createElement("canvas");
  root.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const size = { w: 0, h: 0 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    size.w = root.clientWidth;
    size.h = root.clientHeight;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  return {
    canvas,
    ctx,
    size,
    destroy() {
      window.removeEventListener("resize", resize);
      canvas.remove();
    },
  };
}

// Ruft frame(now) in jedem Bild auf, now in Sekunden. Rückgabe stoppt die Schleife.
export function startLoop(frame) {
  let id = 0;
  const run = () => {
    frame(performance.now() / 1000);
    id = requestAnimationFrame(run);
  };
  id = requestAnimationFrame(run);
  return () => cancelAnimationFrame(id);
}

export function pointerPos(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

export function drawEmoji(ctx, emoji, x, y, size) {
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, x, y);
}

export function drawSky(ctx, w, h, now = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#9fd8ff");
  g.addColorStop(1, "#e3f4ff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const [i, cy] of [0.22, 0.48, 0.7].entries()) {
    const cx = ((now * (6 + i * 3) + i * 170) % (w + 160)) - 80;
    cloud(ctx, cx, h * cy, 26 + i * 6);
  }
}

export function cloud(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y + r * 0.2, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x - r * 0.9, y + r * 0.25, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

export function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export const lerp = (a, b, t) => a + (b - a) * t;

// Abprallen am Ende einer Bewegung (0 bis 1).
export function easeOutBounce(t) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}
