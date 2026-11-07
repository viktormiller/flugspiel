// Hält den Bildschirm an. Fehler (nicht unterstützt, nicht sichtbar) werden geschluckt.
export function createWakeLock() {
  let lock = null;

  async function acquire() {
    try {
      if (!("wakeLock" in navigator)) return;
      if (lock && !lock.released) return;
      if (document.visibilityState !== "visible") return;
      lock = await navigator.wakeLock.request("screen");
    } catch {
      lock = null;
    }
  }

  return { acquire };
}
