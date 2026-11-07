// Ballon-Wettrennen gegen den Fuchs. Der Fuchs passt sich dem Kind an und gewinnt
// nur etwa jede dritte Runde, und dann knapp.
import { catchUpStep } from "../core/catchUp.js";

export const BALLOON = {
  smallStep: 1 / 100,
  bigStep: 1 / 50,
  minTapInterval: 1 / 6,
  roundDuration: 120,
  foxLead: 0.08,
  foxMaxSpeed: 0.03,
  foxWinChance: 1 / 3,
};

export const BALLOON_COLORS = ["red", "yellow", "green", "blue"];

const EPS = 1e-9;

export function createBalloonRace({ role, rng }) {
  let startedAt = 0;
  let lastTick = 0;
  let lastTap = -Infinity;

  const pick = list => list[Math.floor(rng() * list.length)];

  function newTarget() {
    game.targetColor = pick(BALLOON_COLORS);
    const others = BALLOON_COLORS.filter(c => c !== game.targetColor);
    const buttons = [];
    while (buttons.length < 2) {
      const c = pick(others);
      if (!buttons.includes(c)) buttons.push(c);
    }
    buttons.splice(Math.floor(rng() * 3), 0, game.targetColor);
    game.buttons = buttons;
  }

  function step(base) {
    game.kid = Math.min(1, game.kid + catchUpStep(base, game.kid, game.fox));
  }

  const game = {
    kid: 0,
    fox: 0,
    foxWins: false,
    targetColor: null,
    buttons: [],
    winner: null,

    startRound(now) {
      game.kid = 0;
      game.fox = 0;
      game.winner = null;
      game.foxWins = rng() < BALLOON.foxWinChance;
      startedAt = now;
      lastTick = now;
      lastTap = -Infinity;
      newTarget();
    },

    tap(now) {
      if (role !== "small" || game.winner) return false;
      if (now - lastTap < BALLOON.minTapInterval - EPS) return false;
      lastTap = now;
      step(BALLOON.smallStep);
      return true;
    },

    press(color) {
      if (role !== "big" || game.winner || color !== game.targetColor) return false;
      step(BALLOON.bigStep);
      newTarget();
      return true;
    },

    tick(now) {
      if (game.winner) return null;
      const dt = Math.min(1, Math.max(0, now - lastTick));
      lastTick = now;
      const desired = game.foxWins
        ? Math.min(1, game.kid + BALLOON.foxLead)
        : Math.max(0, game.kid - BALLOON.foxLead);
      if (desired > game.fox) game.fox = Math.min(desired, game.fox + BALLOON.foxMaxSpeed * dt);
      const timeUp = now - startedAt >= BALLOON.roundDuration - EPS;
      if (game.kid >= 1 || game.fox >= 1 || timeUp) {
        game.winner = game.kid >= game.fox ? "kid" : "fox";
        return "finished";
      }
      return null;
    },
  };

  newTarget();
  return game;
}
