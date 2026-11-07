// Ansicht: Malen. Weiße Leinwand, sechs Farben unten, Mülleimer oben links
// (1,5 Sekunden gedrückt halten löscht).
import { createDrawing, DRAWING } from "../engines/drawing.js";
import { ANIMALS } from "../core/games.js";
import { setupCanvas, startLoop, pointerPos, drawEmoji, circle, COLOR, TOP_SAFE, BOTTOM_SAFE } from "./canvas.js";

const CLEAR_HOLD = 1.5;

export function mount(root, ctx) {
  const { canvas, ctx: g, size, destroy } = setupCanvas(root);
  const drawing = createDrawing({ role: ctx.role });
  let trashPointer = null;
  let trashSince = 0;

  const layout = () => {
    const paletteY = size.h - BOTTOM_SAFE - 36;
    return {
      area: { x: 12, y: TOP_SAFE, w: size.w - 24, h: paletteY - 50 - TOP_SAFE },
      paletteY,
      trash: { x: 52, y: TOP_SAFE - 40 },
    };
  };

  const swatchX = i => (size.w / DRAWING.colors.length) * (i + 0.5);

  function toNorm(p) {
    const { area } = layout();
    return { x: (p.x - area.x) / area.w, y: (p.y - area.y) / area.h };
  }

  function frame(now) {
    const L = layout();
    g.fillStyle = "#f4f9fc";
    g.fillRect(0, 0, size.w, size.h);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(L.area.x, L.area.y, L.area.w, L.area.h, 20);
    g.fill();

    g.save();
    g.beginPath();
    g.roundRect(L.area.x, L.area.y, L.area.w, L.area.h, 20);
    g.clip();
    g.lineCap = "round";
    g.lineJoin = "round";
    for (const s of drawing.strokes) {
      g.strokeStyle = COLOR[s.color];
      g.fillStyle = COLOR[s.color];
      g.lineWidth = s.width * L.area.w;
      const pts = s.points.map(p => ({ x: L.area.x + p.x * L.area.w, y: L.area.y + p.y * L.area.h }));
      if (pts.length === 1) {
        circle(g, pts[0].x, pts[0].y, g.lineWidth / 2, COLOR[s.color]);
        continue;
      }
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.stroke();
    }
    g.restore();

    DRAWING.colors.forEach((c, i) => {
      const selected = c === drawing.color;
      circle(g, swatchX(i), L.paletteY, selected ? 34 : 28, selected ? "#1d2b3a" : "#ffffff");
      circle(g, swatchX(i), L.paletteY, selected ? 29 : 25, COLOR[c]);
    });

    drawEmoji(g, ANIMALS[ctx.role], size.w / 2, TOP_SAFE - 40, 44);

    drawEmoji(g, "🗑️", L.trash.x, L.trash.y, 46);
    if (trashPointer !== null) {
      const t = Math.min(1, (now - trashSince) / CLEAR_HOLD);
      g.lineWidth = 6;
      g.strokeStyle = COLOR.orange;
      g.beginPath();
      g.arc(L.trash.x, L.trash.y, 38, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
      g.stroke();
      if (t >= 1) {
        drawing.clear();
        trashPointer = null;
        ctx.effects.play("pop");
      }
    }
  }

  function onDown(e) {
    const L = layout();
    const p = pointerPos(canvas, e);
    if (Math.hypot(p.x - L.trash.x, p.y - L.trash.y) <= 44) {
      if (trashPointer === null) {
        trashPointer = e.pointerId;
        trashSince = performance.now() / 1000;
      }
      return;
    }
    if (Math.abs(p.y - L.paletteY) <= 40) {
      const i = Math.floor(p.x / (size.w / DRAWING.colors.length));
      const c = DRAWING.colors[Math.max(0, Math.min(DRAWING.colors.length - 1, i))];
      if (c !== drawing.color) {
        drawing.setColor(c);
        ctx.effects.play("pop");
      }
      return;
    }
    if (p.y >= L.area.y && p.y <= L.area.y + L.area.h) drawing.down(e.pointerId, toNorm(p));
  }

  function onMove(e) {
    const p = pointerPos(canvas, e);
    const n = toNorm(p);
    drawing.move(e.pointerId, { x: Math.max(0, Math.min(1, n.x)), y: Math.max(0, Math.min(1, n.y)) });
  }

  function onUp(e) {
    if (e.pointerId === trashPointer) trashPointer = null;
    drawing.up(e.pointerId);
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  const stop = startLoop(frame);

  return () => {
    stop();
    destroy();
  };
}
