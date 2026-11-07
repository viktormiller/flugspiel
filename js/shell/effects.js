// Leise, synthetisierte Klänge. Kein Ton, solange der AudioContext nicht durch
// eine Berührung freigeschaltet wurde oder die Töne im Elternmenü aus sind.
const VOLUME = 0.3;

export function createEffects(getSoundOn) {
  let ctx = null;
  let master = null;

  function unlock() {
    try {
      if (navigator.audioSession) navigator.audioSession.type = "ambient";
    } catch {
      // Nicht unterstützt: egal.
    }
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = VOLUME;
        master.connect(ctx.destination);
      }
      if (ctx.state !== "running") ctx.resume();
    } catch {
      ctx = null;
    }
  }

  function tone(freq, start, duration, endFreq = freq, type = "sine") {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(1, start + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(env).connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function noise(start, duration) {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, start);
    filter.frequency.exponentialRampToValueAtTime(400, start + duration);
    env.gain.value = 0.6;
    src.buffer = buffer;
    src.connect(filter).connect(env).connect(master);
    src.start(start);
  }

  const SOUNDS = {
    pop: t => tone(880, t, 0.08),
    caught: t => tone(660, t, 0.15, 990),
    whoosh: t => noise(t, 0.25),
    rise: t => tone(523, t, 0.06),
    fireworks: t => [784, 988, 1175].forEach((f, i) => tone(f, t + i * 0.12, 0.12)),
    fanfare: t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.15, i === 3 ? 0.3 : 0.15)),
  };

  function play(name) {
    if (!getSoundOn() || !ctx || ctx.state !== "running") return;
    const sound = SOUNDS[name];
    if (!sound) return;
    try {
      sound(ctx.currentTime + 0.01);
    } catch {
      // Ein verlorener Ton ist kein Problem.
    }
  }

  return { play, unlock };
}
