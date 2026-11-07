// Ansicht: Ball rüberwerfen. Das Kind unten, der Fuchs oben.
import { createBallToss, BALL } from "../engines/ballToss.js";
import { mulberry32 } from "../core/rng.js";
import { ANIMALS } from "../core/games.js";
import { setupCanvas, startLoop, pointerPos, drawEmoji, drawSky, circle, lerp, easeOutBounce, TOP_SAFE, BOTTOM_SAFE } from "./canvas.js";

export function mount(root, ctx) {
  const { canvas, ctx: g, size, destroy } = setupCanvas(root);
  const game = createBallToss({ role: ctx.role, rng: mulberry32(Date.now() >>> 0) });
  const radius = BALL[ctx.role].radius;

  // Position des Balls in Ruhe und beim Halten (folgt dem Finger).
  let held = null;
  let thrownFrom = null;
  let trail = [];
  let catchFlash = 0;
  let pointerId = null;

  const layout = () => ({
    kid: { x: size.w / 2, y: size.h - BOTTOM_SAFE - 70 },
    fox: { x: size.w / 2, y: TOP_SAFE + 40 },
    rest: { x: size.w / 2, y: size.h * 0.62 },
  });

  function ballPos(now) {
    const L = layout();
    const foxHands = { x: L.fox.x, y: L.fox.y + 85 };
    switch (game.ball) {
      case "held":
        return held || L.rest;
      case "toFox": {
        const p = game.progress(now);
        const from = thrownFrom || L.rest;
        return { x: lerp(from.x, foxHands.x, p), y: lerp(from.y, foxHands.y, p) - Math.sin(p * Math.PI) * 60 };
      }
      case "withFox":
        return { x: foxHands.x, y: foxHands.y - Math.abs(Math.sin(now * 6)) * 12 };
      case "fromFox": {
        const p = game.progress(now);
        return { x: lerp(foxHands.x, L.rest.x, p), y: lerp(foxHands.y, L.rest.y, easeOutBounce(p)) };
      }
      default:
        return L.rest;
    }
  }

  function drawBall(x, y, r, golden, now) {
    circle(g, x, y, r, golden ? "#ffd166" : "#ff9f1c");
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = r * 0.12;
    g.beginPath();
    g.arc(x, y, r * 0.62, 0.3, Math.PI - 0.3);
    g.stroke();
    circle(g, x - r * 0.35, y - r * 0.35, r * 0.18, "rgba(255,255,255,0.8)");
    if (golden) drawEmoji(g, "✨", x + r * 0.7, y - r * 0.7 + Math.sin(now * 5) * 4, r * 0.6);
  }

  function frame(now) {
    const changed = game.tick(now);
    if (changed === "resting") ctx.effects.play("pop");
    const L = layout();
    drawSky(g, size.w, size.h, now);

    const foxBob = game.ball === "withFox" ? Math.sin(now * 8) * 6 : Math.sin(now * 2) * 3;
    drawEmoji(g, ANIMALS.fox, L.fox.x, L.fox.y + foxBob, 90);
    drawEmoji(g, ANIMALS[ctx.role], L.kid.x, L.kid.y + Math.sin(now * 2 + 1) * 3, 100);

    // Je näher am Fuchs, desto kleiner: der Ball fliegt in die Ferne.
    const pos = ballPos(now);
    const depth = Math.min(1, Math.max(0, (pos.y - L.fox.y) / (L.rest.y - L.fox.y)));
    drawBall(pos.x, pos.y, radius * lerp(0.45, 1, depth), game.golden, now);

    if (catchFlash > now) {
      const t = 1 - (catchFlash - now) / 0.8;
      g.globalAlpha = 1 - t;
      drawEmoji(g, game.golden ? "🌟" : "⭐", pos.x, pos.y - radius - 30 - t * 60, 50);
      g.globalAlpha = 1;
    }
  }

  function onDown(e) {
    if (pointerId !== null) return;
    const p = pointerPos(canvas, e);
    const ball = ballPos(performance.now() / 1000);
    const distance = Math.hypot(p.x - ball.x, p.y - ball.y);
    if (game.ball === "resting") {
      if (!game.tap(distance)) return;
      ctx.effects.play("caught");
      catchFlash = performance.now() / 1000 + 0.8;
    } else if (game.ball !== "held" || distance > BALL[ctx.role].catchRadius) {
      return;
    }
    pointerId = e.pointerId;
    held = p;
    trail = [{ ...p, t: performance.now() / 1000 }];
  }

  function onMove(e) {
    if (e.pointerId !== pointerId) return;
    held = pointerPos(canvas, e);
    const now = performance.now() / 1000;
    trail.push({ ...held, t: now });
    trail = trail.filter(s => now - s.t <= 0.1);
  }

  function onUp(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    const now = performance.now() / 1000;
    const first = trail[0];
    const last = trail[trail.length - 1];
    const dt = Math.max(0.016, last.t - first.t);
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;
    if (game.swipe(vx, vy, now)) {
      thrownFrom = held;
      ctx.effects.play("whoosh");
      if (game.fireworks) {
        ctx.effects.play("fireworks");
        ctx.stars.show("fireworks");
      }
    }
    held = null;
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
