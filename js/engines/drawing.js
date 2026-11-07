// Malen: Striche mit normalisierten Koordinaten (0 bis 1). Nur ein Finger malt.
export const DRAWING = {
  colors: ["red", "yellow", "green", "blue", "purple", "orange"],
  width: { small: 0.04, big: 0.02 },
  maxStrokes: 300,
  minPointDist: 0.005,
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

    // isPrimary: erster Finger einer neuen Berührung. Dann ist kein anderer Finger
    // mehr auf dem Display, ein hängender alter Finger wird verworfen.
    down(pointerId, point, isPrimary = false) {
      if (activePointer !== null && !isPrimary) return;
      activePointer = pointerId;
      current = { color: game.color, width: DRAWING.width[role], points: [point] };
      game.strokes.push(current);
      if (game.strokes.length > DRAWING.maxStrokes) game.strokes.shift();
    },

    move(pointerId, point) {
      if (pointerId !== activePointer || !current) return;
      const last = current.points[current.points.length - 1];
      if (Math.hypot(point.x - last.x, point.y - last.y) < DRAWING.minPointDist) return;
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
