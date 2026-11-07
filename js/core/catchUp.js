// Wer weit hinten liegt, holt etwas schneller auf.
export function catchUpStep(base, own, other, gap = 0.15, factor = 1.5) {
  return other - own > gap ? base * factor : base;
}
