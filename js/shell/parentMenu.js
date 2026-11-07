// Eltern-Ecke oben rechts: 3 Sekunden gedrückt halten öffnet das Elternmenü.
import { GAMES } from "../core/games.js";

const HOLD_MS = 3000;

const ROLE_CHOICES = [
  { id: "small", label: "🐻 Klein (leicht)" },
  { id: "big", label: "🐰 Groß (mit Zusatzaufgabe)" },
];

export function installParentCorner(root, { getSettings, onChange }) {
  const corner = document.createElement("div");
  corner.className = "parent-corner";
  root.appendChild(corner);

  // Nach 3 s Halten erscheint ein Zahnrad, beim Loslassen öffnet das Menü.
  // Öffnen erst beim Loslassen, weil iOS sonst den nächsten Tipp verschluckt.
  let timer = null;
  let armed = false;
  const reset = () => {
    clearTimeout(timer);
    timer = null;
    armed = false;
    corner.textContent = "";
  };

  const begin = () => {
    reset();
    timer = setTimeout(() => {
      timer = null;
      armed = true;
      corner.textContent = "⚙️";
    }, HOLD_MS);
  };
  const finish = () => {
    const open = armed;
    reset();
    if (open) openMenu(root, getSettings, onChange);
  };

  // Auf dem iPhone direkt mit Touch-Ereignissen: preventDefault verhindert die
  // Lang-Druck-Geste von iOS, unterdrückt aber auch die Pointer-Ereignisse.
  corner.addEventListener(
    "touchstart",
    e => {
      e.preventDefault();
      e.stopPropagation();
      begin();
    },
    { passive: false },
  );
  corner.addEventListener("touchend", finish);
  corner.addEventListener("touchcancel", finish);
  // Maus (Test am Mac).
  corner.addEventListener("mousedown", begin);
  corner.addEventListener("mouseup", finish);
}

// iOS-Safari verschluckt in Vollbild-Web-Apps mit touch-action: none manchmal
// "click". Deshalb lösen Knöpfe direkt beim Loslassen auf demselben Element aus.
function onTap(el, fn) {
  let down = false;
  const start = () => {
    down = true;
  };
  const end = e => {
    if (!down) return;
    down = false;
    e.preventDefault();
    fn();
  };
  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchend", end);
  el.addEventListener("touchcancel", () => {
    down = false;
  });
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", end);
}

function button(className, html, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = className;
  b.innerHTML = html;
  onTap(b, onClick);
  return b;
}

function heading(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

function openMenu(root, getSettings, onChange) {
  if (root.querySelector(".parent-menu")) return;
  const settings = { ...getSettings() };

  const menu = document.createElement("div");
  menu.className = "parent-menu";
  const panel = document.createElement("div");
  panel.className = "panel";
  menu.appendChild(panel);

  const close = () => menu.remove();
  const apply = patch => {
    Object.assign(settings, patch);
    onChange({ ...settings });
  };

  panel.appendChild(heading("h1", "Elternmenü"));

  panel.appendChild(heading("h2", "Spiel"));
  const tiles = document.createElement("div");
  tiles.className = "tiles";
  for (const game of GAMES) {
    const active = game.id === settings.lastGame ? " active" : "";
    tiles.appendChild(
      button(`tile${active}`, `<span class="icon">${game.icon}</span><span>${game.title}</span>`, () => {
        apply({ lastGame: game.id });
        close();
      }),
    );
  }
  panel.appendChild(tiles);

  panel.appendChild(heading("h2", "Dieses iPhone gehört"));
  const choices = document.createElement("div");
  choices.className = "choices";
  for (const role of ROLE_CHOICES) {
    const b = button(`choice${role.id === settings.role ? " active" : ""}`, role.label, () => {
      apply({ role: role.id });
      for (const other of choices.children) other.classList.toggle("active", other === b);
    });
    choices.appendChild(b);
  }
  panel.appendChild(choices);

  const soundLabel = () => (settings.soundOn ? "🔊 Töne an" : "🔇 Töne aus");
  const sound = button(`choice${settings.soundOn ? " active" : ""}`, soundLabel(), () => {
    apply({ soundOn: !settings.soundOn });
    sound.innerHTML = soundLabel();
    sound.classList.toggle("active", settings.soundOn);
  });
  panel.appendChild(heading("h2", "Ton"));
  panel.appendChild(sound);

  panel.appendChild(
    heading(
      "p",
      "Tipp: Mit Geführtem Zugriff (Einstellungen → Bedienungshilfen) bleibt das Kind in der App. Dreimal die Seitentaste drücken startet ihn.",
    ),
  );

  panel.appendChild(button("done", "Fertig", close));
  root.appendChild(menu);
}
