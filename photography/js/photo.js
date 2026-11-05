// =============================================================
// KŌSEN PHOTO: edit your gallery here.
//   src:    path to the photo, e.g. "images/tokyo-night.jpg" (leave "" for a placeholder)
//   title:  caption shown on the panel and in the lightbox
//   cat:    category, used for the filter buttons (they're built automatically)
//   size:   "" | "wide" | "tall" | "big"  (controls the manga-panel shape)
// =============================================================
const PHOTOS = [
  // This order tiles the 6-column grid with no gaps: big,_,_ | wide,_ | tall,_,_,wide
  { src: "", title: "Golden Hour Rooftop", cat: "Street",    size: "big"  },
  { src: "", title: "Neon Alley",          cat: "Night",     size: ""     },
  { src: "", title: "Portrait in Bloom",   cat: "Portraits", size: ""     },
  { src: "", title: "Train Crossing",      cat: "Street",    size: "wide" },
  { src: "", title: "Sunset Ridge",        cat: "Landscape", size: ""     },
  { src: "", title: "Convention Hero",     cat: "Cosplay",   size: "tall" },
  { src: "", title: "Rain Reflections",    cat: "Night",     size: ""     },
  { src: "", title: "Final Boss Pose",     cat: "Cosplay",   size: ""     },
  { src: "", title: "Shrine Path",         cat: "Landscape", size: "wide" },
];

// Placeholder gradients (anime sky palettes)
const GRADIENTS = [
  "linear-gradient(160deg,#8fd3ff,#9b8cff 55%,#ff8fb1)",
  "linear-gradient(200deg,#1a1a2e,#4b2a7a 50%,#ff5fa2)",
  "linear-gradient(170deg,#ffd166,#ff8fb1 60%,#9b8cff)",
  "linear-gradient(150deg,#a8ffdf,#8fd3ff 50%,#5865f2)",
  "linear-gradient(190deg,#ff9a76,#ffd166 45%,#fff3c4)",
];

const grid = document.getElementById("grid");
const filters = document.querySelector(".filters");
let visible = [];

function render() {
  PHOTOS.forEach((p, i) => {
    const el = document.createElement("figure");
    el.className = `panel ${p.size || ""}`;
    el.dataset.cat = p.cat;
    el.dataset.index = i;
    el.style.animationDelay = `${i * 50}ms`;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Open ${p.title}`);
    el.innerHTML = `${media(p, i)}<span class="cat">${p.cat.toUpperCase()}</span><figcaption class="label">${p.title}</figcaption>`;
    el.addEventListener("click", () => openLB(i));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") openLB(i); });
    grid.appendChild(el);
  });

  const cats = ["All", ...new Set(PHOTOS.map((p) => p.cat))];
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.textContent = c;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", c === "All");
    b.addEventListener("click", () => setFilter(c));
    filters.appendChild(b);
  });
  visible = PHOTOS.map((_, i) => i);
}

function media(p, i) {
  return p.src
    ? `<img src="${p.src}" alt="${p.title}" loading="lazy">`
    : `<div class="ph" style="--g:${GRADIENTS[i % GRADIENTS.length]}"></div>`;
}

function setFilter(cat) {
  filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.textContent === cat));
  visible = [];
  grid.querySelectorAll(".panel").forEach((el) => {
    const show = cat === "All" || el.dataset.cat === cat;
    el.classList.toggle("hide", !show);
    if (show) visible.push(+el.dataset.index);
  });
}

// ---------- Lightbox ----------
const lb = document.getElementById("lightbox");
const lbMedia = document.getElementById("lb-media");
const lbCap = document.getElementById("lb-cap");
let current = 0;

function openLB(i) {
  current = i;
  const p = PHOTOS[i];
  lbMedia.innerHTML = media(p, i);
  lbCap.textContent = `${p.title} · ${p.cat}`;
  lb.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeLB() { lb.hidden = true; document.body.style.overflow = ""; }
function step(dir) {
  const pos = visible.indexOf(current);
  openLB(visible[(pos + dir + visible.length) % visible.length]);
}
lb.querySelector(".lb-close").addEventListener("click", closeLB);
lb.querySelector(".prev").addEventListener("click", () => step(-1));
lb.querySelector(".next").addEventListener("click", () => step(1));
lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
document.addEventListener("keydown", (e) => {
  if (lb.hidden) return;
  if (e.key === "Escape") closeLB();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

// ---------- Falling sakura petals ----------
(function petals() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("petals");
  const ctx = c.getContext("2d");
  let W, H;
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  resize(); addEventListener("resize", resize);

  const count = innerWidth < 700 ? 14 : 28;
  const P = Array.from({ length: count }, () => spawn(true));
  function spawn(initial) {
    return {
      x: Math.random() * W, y: initial ? Math.random() * H : -20,
      r: 5 + Math.random() * 6, vy: .4 + Math.random() * .9, vx: -.3 + Math.random() * .6,
      a: Math.random() * Math.PI * 2, va: (Math.random() - .5) * .04, sway: Math.random() * 100,
    };
  }
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.beginPath();
    ctx.moveTo(0, -p.r);
    ctx.bezierCurveTo(p.r, -p.r, p.r, p.r * .6, 0, p.r);
    ctx.bezierCurveTo(-p.r, p.r * .6, -p.r, -p.r, 0, -p.r);
    ctx.fillStyle = "rgba(255,143,177,.75)";
    ctx.fill();
    ctx.restore();
  }
  (function loop(t) {
    ctx.clearRect(0, 0, W, H);
    P.forEach((p, i) => {
      p.y += p.vy; p.x += p.vx + Math.sin((t / 1000) + p.sway) * .3; p.a += p.va;
      if (p.y > H + 20) P[i] = spawn(false);
      drawPetal(p);
    });
    requestAnimationFrame(loop);
  })(0);
})();

render();
document.getElementById("year").textContent = new Date().getFullYear();
