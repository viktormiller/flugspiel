// Malen: Striche mit normalisierten Koordinaten (0 bis 1). Nur ein Finger malt.
export const DRAWING = {
  colors: ["red", "yellow", "green", "blue", "purple", "orange"],
  width: { small: 0.04, big: 0.02 },
  maxStrokes: 300,
};

export function createDrawing({ role }) {
  let activePointer = null;
  let current = null;

  const game = {
    strokes: [],
    color: role === "big" ? "blue" : "red",

    setColor(c) {
      if (DRAWING.colors.includes(c)) game.color = c;
    },

    down(pointerId, point) {
      if (activePointer !== null) return;
      activePointer = pointerId;
      current = { color: game.color, width: DRAWING.width[role], points: [point] };
      game.strokes.push(current);
      if (game.strokes.length > DRAWING.maxStrokes) game.strokes.shift();
    },

    move(pointerId, point) {
      if (pointerId !== activePointer || !current) return;
      current.points.push(point);
    },

    up(pointerId) {
      if (pointerId !== activePointer) return;
      activePointer = null;
      current = null;
    },

    clear() {
      game.strokes = [];
      activePointer = null;
      current = null;
    },
  };

  return game;
}
