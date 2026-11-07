// Ball rüberwerfen: das Kind wirft den Ball zum Fuchs, der Fuchs wirft ihn zurück.
// Zeit in Sekunden, Abstände in CSS-Pixeln.
export const BALL = {
  small: { radius: 70, catchRadius: Infinity, anyDirection: true },
  big: { radius: 45, catchRadius: 75, anyDirection: false },
  minSwipeSpeed: 300,
  goldenChance: 0.2,
  foxHold: 1.2,
  flight: 1.0,
};

const EPS = 1e-9;

export function createBallToss({ role, rng }) {
  const cfg = BALL[role];
  let since = 0;

  const game = {
    ball: "resting",
    golden: false,
    throws: 0,
    stars: 0,
    fireworks: false,

    tap(distance) {
      if (game.ball !== "resting" || distance > cfg.catchRadius) return false;
      game.ball = "held";
      game.stars += game.golden ? 3 : 1;
      return true;
    },

    swipe(vx, vy, now) {
      if (game.ball !== "held") return false;
      if (Math.hypot(vx, vy) < BALL.minSwipeSpeed) return false;
      if (!cfg.anyDirection && vy >= 0) return false;
      game.ball = "toFox";
      game.golden = false;
      game.throws += 1;
      game.fireworks = game.throws % 10 === 0;
      since = now;
      return true;
    },

    tick(now) {
      const elapsed = now - since + EPS;
      if (game.ball === "toFox" && elapsed >= BALL.flight) {
        game.ball = "withFox";
      } else if (game.ball === "withFox" && elapsed >= BALL.foxHold) {
        game.ball = "fromFox";
        game.golden = role === "big" && rng() < BALL.goldenChance;
      } else if (game.ball === "fromFox" && elapsed >= BALL.flight) {
        game.ball = "resting";
      } else {
        return null;
      }
      since = now;
      return game.ball;
    },

    // Wie weit die aktuelle Flug- oder Halte-Phase ist (0 bis 1), für Animationen.
    progress(now) {
      const span = game.ball === "withFox" ? BALL.foxHold : BALL.flight;
      return Math.min(1, Math.max(0, (now - since) / span));
    },
  };

  return game;
}
