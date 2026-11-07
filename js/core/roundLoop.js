// Rundenablauf: spielen, feiern, nächste Runde. Zeit in Sekunden.
export class RoundLoop {
  constructor({ roundDuration, celebration = 5, maxGap = 30 }) {
    this.roundDuration = roundDuration;
    this.celebration = celebration;
    this.maxGap = maxGap;
    this.phase = "idle";
    this.round = 0;
    this.startedAt = 0;
    this.endedAt = 0;
    this.lastTick = null;
  }

  #start(now) {
    this.phase = "playing";
    this.round += 1;
    this.startedAt = now;
  }

  tick(now) {
    const gap = this.lastTick === null ? 0 : now - this.lastTick;
    this.lastTick = now;
    if (this.phase === "idle" || gap > this.maxGap) {
      this.#start(now);
      return "start";
    }
    if (this.phase === "playing" && now - this.startedAt >= this.roundDuration) return "timeout";
    if (this.phase === "celebrating" && now - this.endedAt >= this.celebration) {
      this.#start(now);
      return "next";
    }
    return null;
  }

  end(now) {
    if (this.phase !== "playing") return;
    this.phase = "celebrating";
    this.endedAt = now;
  }
}
