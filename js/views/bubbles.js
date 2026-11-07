// Ansicht: Seifenblasen platzen. Ein Sternenturm rechts unten wächst.
import { createBubbles, BUBBLES } from "../engines/bubbles.js";
import { RoundLoop } from "../core/roundLoop.js";
import { mulberry32 } from "../core/rng.js";
import { ANIMALS } from "../core/games.js";
import { setupCanvas, startLoop, pointerPos, drawEmoji, drawSky, circle, COLOR, TOP_SAFE, BOTTOM_SAFE } from "./canvas.js";

const TOWER_STARS = 10;

export function mount(root, ctx) {
  const { canvas, ctx: g, size, destroy } = setupCanvas(root);
  const big = ctx.role === "big";
  const radius = big ? 40 : 55;
  const start = performance.now() / 1000;
  const game = createBubbles({ role: ctx.role, rng: mulberry32(Date.now() >>> 0), start });
  const loop = new RoundLoop({ roundDuration: BUBBLES.roundDuration });
  let pops = [];

  const area = () => ({ top: TOP_SAFE + (big ? 120 : 20), bottom: size.h - BOTTOM_SAFE - 20 });

  function bubblePos(b, now) {
    const A = area();
    const y = A.top + game.y(b, now) * (A.bottom - A.top);
    const x = b.x * (size.w - 90) + Math.sin(now * 1.5 + b.id) * 12;
    return { x, y };
  }

  function drawBubble(x, y, color) {
    g.beginPath();
    g.arc(x, y, radius, 0, Math.PI * 2);
    g.fillStyle = COLOR[color] + "aa";
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = "rgba(255,255,255,0.9)";
    g.stroke();
    circle(g, x - radius * 0.35, y - radius * 0.4, radius * 0.18, "rgba(255,255,255,0.85)");
  }

  function drawTower(now) {
    const x = size.w - 45;
    const base = size.h - BOTTOM_SAFE - 40;
    const stars = Math.round(game.tower * TOWER_STARS);
    for (let i = 0; i < stars; i++) {
      const wobble = i === stars - 1 ? Math.sin(now * 6) * 3 : 0;
      drawEmoji(g, "⭐", x + wobble, base - 50 - i * 34, 34);
    }
    drawEmoji(g, ANIMALS[ctx.role], x, base, 54);
  }

  function frame(now) {
    const step = loop.tick(now);
    if (step === "start" || step === "next") {
      game.reset(now);
      pops = [];
    }
    if (step === "timeout") {
      loop.end(now);
      game.bubbles = [];
      ctx.effects.play("fanfare");
      ctx.stars.show("stars");
    }
    if (loop.phase === "playing") game.update(now);

    drawSky(g, size.w, size.h, now);

    for (const b of game.bubbles) {
      const p = bubblePos(b, now);
      drawBubble(p.x, p.y, b.color);
    }

    pops = pops.filter(p => now - p.t < 0.4);
    for (const p of pops) {
      const t = (now - p.t) / 0.4;
      g.globalAlpha = 1 - t;
      g.lineWidth = 4;
      g.strokeStyle = COLOR[p.color];
      g.beginPath();
      g.arc(p.x, p.y, radius * (1 + t * 0.8), 0, Math.PI * 2);
      g.stroke();
      if (p.scored) drawEmoji(g, "⭐", p.x, p.y - t * 50, 36);
      g.globalAlpha = 1;
    }

    drawTower(now);

    // Schild oben: diese Farbe bringt einen Stern.
    if (big && loop.phase === "playing") {
      const cx = size.w / 2;
      const cy = TOP_SAFE + 40;
      g.fillStyle = "rgba(255,255,255,0.95)";
      g.beginPath();
      g.roundRect(cx - 80, cy - 40, 160, 80, 24);
      g.fill();
      circle(g, cx - 35, cy, 28, COLOR[game.targetColor]);
      circle(g, cx - 44, cy - 10, 6, "rgba(255,255,255,0.7)");
      drawEmoji(g, "⭐", cx + 38, cy, 42);
    }
  }

  function onDown(e) {
    if (loop.phase !== "playing") return;
    const now = performance.now() / 1000;
    const p = pointerPos(canvas, e);
    for (let i = game.bubbles.length - 1; i >= 0; i--) {
      const b = game.bubbles[i];
      const pos = bubblePos(b, now);
      if (Math.hypot(p.x - pos.x, p.y - pos.y) <= radius + 12) {
        const result = game.pop(b.id);
        pops.push({ ...pos, color: b.color, t: now, scored: result === "scored" });
        ctx.effects.play("pop");
        return;
      }
    }
  }

  canvas.addEventListener("pointerdown", onDown);
  const stop = startLoop(frame);

  return () => {
    stop();
    destroy();
  };
}
