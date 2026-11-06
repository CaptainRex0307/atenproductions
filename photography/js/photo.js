// =============================================================
// DYLAN'S COLLECTION: edit your gallery here.
//   src:    path to the photo, e.g. "images/alley.jpg" (leave "" for a placeholder)
//   title:  caption shown on the panel and in the lightbox
//   cat:    category, used for the filter buttons (they're built automatically)
//   date:   when it was "acquired" (shown under the title)
//   size:   "" | "wide" | "tall" | "big"  (controls the panel shape)
// This order tiles the 6-column grid with no gaps: big,_,_ | wide,_ | tall,_,_,wide
// Pieces are numbered automatically (No. 001, No. 002, ...).
// =============================================================
const PHOTOS = [
  { src: "", title: "The Midnight Platform", cat: "Night",     date: "2026.10", size: "big"  },
  { src: "", title: "Faceless Crowd",        cat: "Street",    date: "2026.09", size: ""     },
  { src: "", title: "Red Room Portrait",     cat: "Portraits", date: "2026.08", size: ""     },
  { src: "", title: "Fog Over the Overpass", cat: "Urban",     date: "2026.07", size: "wide" },
  { src: "", title: "The Masked Guest",      cat: "Cosplay",   date: "2026.06", size: ""     },
  { src: "", title: "Stairwell No. 4",       cat: "Urban",     date: "2026.05", size: "tall" },
  { src: "", title: "Neon Bleeds",           cat: "Night",     date: "2026.04", size: ""     },
  { src: "", title: "Still Watching",        cat: "Portraits", date: "2026.03", size: ""     },
  { src: "", title: "Last Train Home",       cat: "Street",    date: "2026.02", size: "wide" },
];

// Placeholder gradients (horror palettes)
const GRADIENTS = [
  "radial-gradient(circle at 70% 30%,#ff2a3a66,transparent 45%),linear-gradient(170deg,#5a1018,#120809 75%)",
  "radial-gradient(circle at 30% 20%,#9fd35633,transparent 40%),linear-gradient(200deg,#2c3d35,#0b0809 80%)",
  "radial-gradient(circle at 40% 40%,#c1121f88,transparent 50%),linear-gradient(160deg,#401019,#0a0506)",
  "radial-gradient(circle at 50% 10%,#ece3d433,transparent 45%),linear-gradient(180deg,#3d3739,#0f0c0d 85%)",
  "radial-gradient(circle at 60% 70%,#ff2a3a44,transparent 45%),linear-gradient(190deg,#1f2629,#080607)",
];

const pad = (n) => String(n).padStart(3, "0");
const grid = document.getElementById("grid");
const filters = document.querySelector(".filters");
let visible = [];

function media(p, i) {
  return p.src
    ? `<img src="${p.src}" alt="${p.title}" loading="lazy">`
    : `<div class="ph" style="--g:${GRADIENTS[i % GRADIENTS.length]}"></div>`;
}

function render() {
  PHOTOS.forEach((p, i) => {
    const el = document.createElement("figure");
    el.className = `panel ${p.size || ""}`;
    el.dataset.cat = p.cat;
    el.dataset.index = i;
    el.style.animationDelay = `${i * 60}ms`;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Open ${p.title}`);
    el.innerHTML = `${media(p, i)}
      <span class="tag">No. ${pad(i + 1)}</span>
      <figcaption class="label"><small>${p.cat.toUpperCase()} · ACQUIRED ${p.date || ""}</small>${p.title}</figcaption>`;
    el.addEventListener("click", () => openLB(i));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") openLB(i); });
    grid.appendChild(el);
  });

  ["All", ...new Set(PHOTOS.map((p) => p.cat))].forEach((c) => {
    const b = document.createElement("button");
    b.textContent = c;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", c === "All");
    b.addEventListener("click", () => setFilter(c));
    filters.appendChild(b);
  });
  visible = PHOTOS.map((_, i) => i);
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

// ---------- Acquisition counter ----------
(function counter() {
  const el = document.getElementById("count");
  const target = PHOTOS.length;
  let n = 0;
  const t = setInterval(() => { el.textContent = pad(++n); if (n >= target) clearInterval(t); }, 90);
})();

// ---------- Lightbox ----------
const lb = document.getElementById("lightbox");
const lbMedia = document.getElementById("lb-media");
const lbCap = document.getElementById("lb-cap");
let current = 0;

function openLB(i) {
  current = i;
  const p = PHOTOS[i];
  lbMedia.innerHTML = media(p, i);
  lbCap.innerHTML = `<small>No. ${pad(i + 1)} · ${p.cat.toUpperCase()}</small>${p.title}`;
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

// ---------- The eye follows you ----------
(function eye() {
  const pupil = document.getElementById("pupil");
  const svg = document.querySelector(".eye");
  if (!pupil || !svg) return;
  addEventListener("pointermove", (e) => {
    const r = svg.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const a = Math.atan2(dy, dx);
    const d = Math.min(1, Math.hypot(dx, dy) / 400);
    pupil.setAttribute("transform", `translate(${Math.cos(a) * 42 * d} ${Math.sin(a) * 14 * d})`);
  });
})();

// ---------- Drifting ash & embers ----------
(function ash() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("ash");
  const ctx = c.getContext("2d");
  let W, H;
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  resize(); addEventListener("resize", resize);

  const count = innerWidth < 700 ? 30 : 60;
  const spawn = (initial) => ({
    x: Math.random() * W, y: initial ? Math.random() * H : H + 10,
    r: .6 + Math.random() * 1.8, vy: -(.2 + Math.random() * .6), vx: (Math.random() - .5) * .3,
    ember: Math.random() < .25, life: Math.random() * 100,
  });
  const P = Array.from({ length: count }, () => spawn(true));
  (function loop(t) {
    ctx.clearRect(0, 0, W, H);
    P.forEach((p, i) => {
      p.y += p.vy; p.x += p.vx + Math.sin(t / 1400 + p.life) * .25;
      if (p.y < -10) P[i] = spawn(false);
      const flick = p.ember ? .5 + Math.sin(t / 200 + p.life) * .4 : .35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.ember ? `rgba(255,60,40,${flick})` : `rgba(200,190,180,${flick})`;
      if (p.ember) { ctx.shadowColor = "#ff2a3a"; ctx.shadowBlur = 8; } else { ctx.shadowBlur = 0; }
      ctx.fill();
    });
    requestAnimationFrame(loop);
  })(0);
})();

render();
document.getElementById("year").textContent = new Date().getFullYear();
