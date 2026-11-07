// Sternenregen und Feuerwerk als Überlagerung. Blockiert keine Eingaben.
const DURATION = 3000;

function rain(layer) {
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("div");
    el.className = "star";
    el.textContent = i % 3 === 0 ? "🌟" : "⭐";
    el.style.left = `${Math.random() * 92}vw`;
    el.style.animationDelay = `${Math.random() * 0.6}s`;
    layer.appendChild(el);
  }
}

function fireworks(layer) {
  for (let burst = 0; burst < 3; burst++) {
    const cx = 20 + Math.random() * 60;
    const cy = 20 + Math.random() * 40;
    for (let i = 0; i < 10; i++) {
      const el = document.createElement("div");
      const angle = (i / 10) * Math.PI * 2;
      el.className = "spark";
      el.textContent = ["✨", "🎆", "⭐"][i % 3];
      el.style.left = `${cx}vw`;
      el.style.top = `${cy}vh`;
      el.style.setProperty("--dx", `${Math.cos(angle) * 30}vw`);
      el.style.setProperty("--dy", `${Math.sin(angle) * 30}vw`);
      el.style.animationDelay = `${burst * 0.35}s`;
      layer.appendChild(el);
    }
  }
}

export function createStars(root) {
  function show(style) {
    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.inset = "0";
    root.appendChild(layer);
    if (style === "fireworks") fireworks(layer);
    else rain(layer);
    setTimeout(() => layer.remove(), DURATION);
  }

  return { show };
}
