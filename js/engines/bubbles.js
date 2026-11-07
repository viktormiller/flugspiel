// Seifenblasen platzen: Blasen steigen auf, ein Sternenturm wächst. Kein Sieger.
// Klein: jede Blase zählt. Groß: nur Blasen in der Zielfarbe zählen.
export const BUBBLES = {
  roundDuration: 60,
  spawnInterval: 0.8,
  maxBubbles: 10,
  smallStep: 1 / 45,
  bigStep: 1 / 26,
  targetShare: 0.5,
  targetChange: 12,
  rise: { small: 7, big: 6 },
  colors: ["red", "yellow", "green", "blue"],
};

// Nach einer Pause (z. B. gesperrtes iPhone) werden verpasste Blasen nicht nachgeholt.
const MAX_GAP = 2;

export function createBubbles({ role, rng, start }) {
  const big = role === "big";
  const rise = BUBBLES.rise[role];
  const step = big ? BUBBLES.bigStep : BUBBLES.smallStep;
  let nextId = 1;
  let nextSpawn = start;
  let lastTarget = start;
  let lastUpdate = start;

  const pick = list => list[Math.floor(rng() * list.length)];

  function newTarget() {
    const others = BUBBLES.colors.filter(c => c !== game.targetColor);
    game.targetColor = pick(others);
  }

  function spawn(time) {
    const color = big && rng() < BUBBLES.targetShare ? game.targetColor : pick(BUBBLES.colors);
    game.bubbles.push({ id: nextId++, color, x: 0.1 + rng() * 0.8, born: time, rise });
  }

  const game = {
    bubbles: [],
    tower: 0,
    targetColor: null,

    y(bubble, now) {
      return 1 - (now - bubble.born) / bubble.rise;
    },

    update(now) {
      if (now - lastUpdate > MAX_GAP) nextSpawn = now;
      lastUpdate = now;
      game.bubbles = game.bubbles.filter(b => game.y(b, now) > -0.15);
      if (big && now - lastTarget >= BUBBLES.targetChange) {
        newTarget();
        lastTarget = now;
      }
      while (now >= nextSpawn) {
        if (game.bubbles.length < BUBBLES.maxBubbles) spawn(nextSpawn);
        nextSpawn += BUBBLES.spawnInterval;
      }
    },

    pop(id) {
      const index = game.bubbles.findIndex(b => b.id === id);
      if (index < 0) return "missing";
      const [bubble] = game.bubbles.splice(index, 1);
      if (big && bubble.color !== game.targetColor) return "popped";
      game.tower = Math.min(1, game.tower + step);
      return "scored";
    },

    reset(now) {
      game.bubbles = [];
      game.tower = 0;
      nextSpawn = now;
      lastTarget = now;
      lastUpdate = now;
    },
  };

  if (big) newTarget();
  return game;
}
