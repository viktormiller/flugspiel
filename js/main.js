// Start der App: Einstellungen laden, Spiel anzeigen, Lebenszyklus.
import { loadSettings, saveSettings } from "./core/settings.js";
import { ANIMALS } from "./core/games.js";
import { createEffects } from "./shell/effects.js";
import { createStars } from "./shell/stars.js";
import { createWakeLock } from "./shell/wakeLock.js";
import { installParentCorner } from "./shell/parentMenu.js";

import { mount as mountBallToss } from "./views/ballToss.js";
import { mount as mountBalloonRace } from "./views/balloonRace.js";

// Spiele, die schon gebaut sind. Fehlende zeigen einen Platzhalter.
const VIEWS = {
  ballToss: mountBallToss,
  balloonRace: mountBalloonRace,
};

function mountPlaceholder(root, ctx) {
  const el = document.createElement("div");
  el.className = "placeholder";
  el.textContent = ANIMALS[ctx.role];
  root.appendChild(el);
  return () => el.remove();
}

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
})();

let settings = loadSettings(storage);
const gameRoot = document.getElementById("game");
const overlay = document.getElementById("overlay");
const effects = createEffects(() => settings.soundOn);
const stars = createStars(overlay);
const wakeLock = createWakeLock();
let unmount = null;

function showGame() {
  if (unmount) unmount();
  gameRoot.replaceChildren();
  const ctx = { role: settings.role, effects, stars };
  const mount = VIEWS[settings.lastGame] || mountPlaceholder;
  unmount = mount(gameRoot, ctx);
}

installParentCorner(document.body, {
  getSettings: () => settings,
  onChange(next) {
    const remount = next.role !== settings.role || next.lastGame !== settings.lastGame;
    settings = next;
    saveSettings(storage, settings);
    if (remount) showGame();
  },
});

// Keine Browser-Gesten: Zoomen, Doppeltippen, Scrollen außerhalb des Elternmenüs.
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("dblclick", e => e.preventDefault());
document.addEventListener(
  "touchmove",
  e => {
    if (!e.target.closest?.(".parent-menu .panel")) e.preventDefault();
  },
  { passive: false },
);
document.addEventListener("contextmenu", e => e.preventDefault());

// Ton und Wake Lock brauchen eine Berührung.
document.addEventListener(
  "pointerdown",
  () => {
    effects.unlock();
    wakeLock.acquire();
  },
  { capture: true },
);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") wakeLock.acquire();
});

// Neue Version aktiv (nur mit Internet möglich): einmal neu laden.
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

showGame();

