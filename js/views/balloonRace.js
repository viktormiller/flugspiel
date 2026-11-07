// Ansicht: Ballon-Wettrennen gegen den Fuchs.
import { createBalloonRace, BALLOON } from "../engines/balloonRace.js";
import { RoundLoop } from "../core/roundLoop.js";
import { mulberry32 } from "../core/rng.js";
import { ANIMALS } from "../core/games.js";
import { setupCanvas, startLoop, pointerPos, drawEmoji, drawSky, cloud, circle, COLOR, TOP_SAFE, BOTTOM_SAFE } from "./canvas.js";

const BUTTON_R = 48;

export function mount(root, ctx) {
  const { canvas, ctx: g, size, destroy } = setupCanvas(root);
  const race = createBalloonRace({ role: ctx.role, rng: mulberry32(Date.now() >>> 0) });
  const loop = new RoundLoop({ roundDuration: BALLOON.roundDuration });
  const big = ctx.role === "big";
  let pulse = 0;

  const layout = () => {
    const buttonsY = size.h - BOTTOM_SAFE - BUTTON_R - 10;
    const ground = big ? buttonsY - BUTTON_R - 70 : size.h - BOTTOM_SAFE - 60;
    return {
      ground,
      top: TOP_SAFE + 70,
      kidX: size.w * 0.27,
      foxX: size.w * 0.73,
      buttonsY,
      target: { x: size.w / 2, y: TOP_SAFE + 150 },
    };
  };

  const buttonPos = i => ({ x: size.w * (0.2 + i * 0.3), y: layout().buttonsY });

  function drawBalloon(x, y, color, now, phase) {
    const sway = Math.sin(now * 2 + phase) * 4;
    g.strokeStyle = "rgba(60,60,60,0.6)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + sway, y + 40);
    g.quadraticCurveTo(x - 8, y + 70, x, y + 95);
    g.stroke();
    g.beginPath();
    g.ellipse(x + sway, y, 34, 42, 0, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    circle(g, x + sway - 12, y - 14, 8, "rgba(255,255,255,0.6)");
  }

  function finish(now) {
    loop.end(now);
    ctx.effects.play("fanfare");
    ctx.stars.show("stars");
  }

  function frame(now) {
    const step = loop.tick(now);
    if (step === "start" || step === "next") race.startRound(now);
    if (loop.phase === "playing") {
      if (race.tick(now) === "finished" || step === "timeout") finish(now);
    }

    const L = layout();
    drawSky(g, size.w, size.h, now);
    g.fillStyle = "rgba(255,255,255,0.95)";
    cloud(g, size.w / 2, L.top - 10, 46);

    g.fillStyle = "#b9e4a8";
    g.fillRect(0, L.ground + 40, size.w, size.h - L.ground - 40);

    const span = L.ground - L.top - 95;
    const kidY = L.ground - 95 - race.kid * span;
    const foxY = L.ground - 95 - race.fox * span;
    drawBalloon(L.kidX, kidY, COLOR.purple, now, 0);
    drawBalloon(L.foxX, foxY, COLOR.orange, now, 1.7);
    drawEmoji(g, ANIMALS[ctx.role], L.kidX, kidY + 125, 70);
    if (pulse > now) {
      const t = 1 - (pulse - now) / 0.3;
      g.globalAlpha = 1 - t;
      drawEmoji(g, "✨", L.kidX + 30, kidY - 40 - t * 30, 40);
      g.globalAlpha = 1;
    }
    drawEmoji(g, ANIMALS.fox, L.foxX, foxY + 125, 70);

    if (loop.phase === "celebrating" && race.winner) {
      const x = race.winner === "kid" ? L.kidX : L.foxX;
      const y = (race.winner === "kid" ? kidY : foxY) - 70 + Math.sin(now * 4) * 5;
      drawEmoji(g, "👑", x, y, 56);
    }

    if (big && loop.phase === "playing") {
      const r = 38 + Math.max(0, pulse - now) * 30;
      circle(g, L.target.x, L.target.y, r + 6, "#ffffff");
      circle(g, L.target.x, L.target.y, r, COLOR[race.targetColor]);
      race.buttons.forEach((c, i) => {
        const p = buttonPos(i);
        circle(g, p.x, p.y + 4, BUTTON_R, "rgba(0,0,0,0.12)");
        circle(g, p.x, p.y, BUTTON_R, COLOR[c]);
        circle(g, p.x - 14, p.y - 14, 10, "rgba(255,255,255,0.5)");
      });
    }
  }

  function onDown(e) {
    if (loop.phase !== "playing") return;
    const now = performance.now() / 1000;
    if (!big) {
      if (race.tap(now)) {
        ctx.effects.play("rise");
        pulse = now + 0.3;
      }
      return;
    }
    const p = pointerPos(canvas, e);
    race.buttons.forEach((c, i) => {
      const b = buttonPos(i);
      if (Math.hypot(p.x - b.x, p.y - b.y) <= BUTTON_R + 10 && race.press(c)) {
        ctx.effects.play("rise");
        pulse = now + 0.3;
      }
    });
  }

  canvas.addEventListener("pointerdown", onDown);
  const stop = startLoop(frame);

  return () => {
    stop();
    destroy();
  };
}
