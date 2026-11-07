// Einstellungen dieses Geräts. Jeder Speicherfehler führt zu Standardwerten.
const KEY = "flugspiel.settings";
const ROLES = ["small", "big"];
const GAME_IDS = ["ballToss", "balloonRace", "bubbles", "drawing"];

export const DEFAULTS = Object.freeze({ role: "small", lastGame: "ballToss", soundOn: true });

export function loadSettings(storage) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const s = JSON.parse(raw);
    if (!ROLES.includes(s.role) || !GAME_IDS.includes(s.lastGame) || typeof s.soundOn !== "boolean") {
      return { ...DEFAULTS };
    }
    return { role: s.role, lastGame: s.lastGame, soundOn: s.soundOn };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(storage, settings) {
  try {
    storage?.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Speicher nicht verfügbar: Einstellungen gelten nur bis zum Schließen.
  }
}
