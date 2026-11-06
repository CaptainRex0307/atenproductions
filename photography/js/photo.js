// =============================================================
// DYLAN'S COLLECTION: page behaviour.
// All text and photos come from content/photo.json (edit it with Pages CMS).
// =============================================================

// Placeholder gradients (horror palettes) used when a photo has no src
const GRADIENTS = [
  "radial-gradient(circle at 70% 30%,#ff2a3a66,transparent 45%),linear-gradient(170deg,#5a1018,#120809 75%)",
  "radial-gradient(circle at 30% 20%,#9fd35633,transparent 40%),linear-gradient(200deg,#2c3d35,#0b0809 80%)",
  "radial-gradient(circle at 40% 40%,#c1121f88,transparent 50%),linear-gradient(160deg,#401019,#0a0506)",
  "radial-gradient(circle at 50% 10%,#ece3d433,transparent 45%),linear-gradient(180deg,#3d3739,#0f0c0d 85%)",
  "radial-gradient(circle at 60% 70%,#ff2a3a44,transparent 45%),linear-gradient(190deg,#1f2629,#080607)",
];
// Automatic panel shapes, by position (these patterns tile the 6-column grid with no gaps)
const FAV_LAYOUT = ["big", "", "", "wide", ""];
const AUTO_LAYOUT = ["big", "", "", "wide", "", "tall", "", "", "wide"];
const SHAPES = { square: "", wide: "wide", tall: "tall", big: "big" };

const pad = (n) => String(n).padStart(3, "0");
const grid = document.getElementById("grid");
const mode = grid ? grid.dataset.mode : null;          // "favorites" | "all"
const filters = document.querySelector(".filters");
const esc = Site.esc;
let items = [];
let visible = [];

function media(p) {
  return p.src
    ? `<img src="${esc(Site.asset(p.src))}" alt="${esc(p.title)}" loading="lazy">`
    : `<div class="ph" style="--g:${p.g}"></div>`;
}

function render() {
  if (!grid) return;
  items.forEach((p, i) => {
    const size = mode === "favorites" ? (FAV_LAYOUT[i] ?? "")
      : (p.shape && p.shape !== "auto" ? SHAPES[p.shape] ?? "" : AUTO_LAYOUT[i % AUTO_LAYOUT.length]);
    const el = document.createElement("figure");
    el.className = `panel ${size}`;
    el.dataset.cat = p.cat;
    el.dataset.index = i;
    el.style.animationDelay = `${i * 60}ms`;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Open ${p.title || "photo"}`);
    el.innerHTML = `${media(p)}
      <span class="tag${p.fav ? " fav" : ""}">No. ${pad(p.no)}${p.fav ? " ★" : ""}</span>
      <figcaption class="label"><small>${esc(p.cat.toUpperCase())}${p.date ? " · ACQUIRED " + esc(p.date) : ""}</small>${esc(p.title)}</figcaption>`;
    el.addEventListener("click", () => openLB(i));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") openLB(i); });
    grid.appendChild(el);
  });
  visible = items.map((_, i) => i);

  if (filters) {
    ["All", "★ Trophy Room", ...new Set(items.map((p) => p.cat))].forEach((c) => {
      const b = document.createElement("button");
      b.textContent = c;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", c === "All");
      b.addEventListener("click", () => setFilter(c));
      filters.appendChild(b);
    });
  }
}

function setFilter(cat) {
  filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.textContent === cat));
  visible = [];
  grid.querySelectorAll(".panel").forEach((el) => {
    const p = items[+el.dataset.index];
    const show = cat === "All" || (cat.startsWith("★") ? p.fav : p.cat === cat);
    el.classList.toggle("hide", !show);
    if (show) visible.push(+el.dataset.index);
  });
}

// ---------- Acquisition counters ----------
function counters(target) {
  document.querySelectorAll("[data-count]").forEach((el) => {
    if (!target) return (el.textContent = pad(0));
    let n = 0;
    const t = setInterval(() => { el.textContent = pad(++n); if (n >= target) clearInterval(t); }, 90);
  });
}

// ---------- Lightbox ----------
const lb = document.getElementById("lightbox");
const lbMedia = document.getElementById("lb-media");
const lbCap = document.getElementById("lb-cap");
let current = 0;

function openLB(i) {
  current = i;
  const p = items[i];
  lbMedia.innerHTML = media(p);
  lbCap.innerHTML = `<small>No. ${pad(p.no)} · ${esc(p.cat.toUpperCase())}${p.fav ? " · TROPHY ROOM" : ""}</small>${esc(p.title)}`;
  lb.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeLB() { lb.hidden = true; document.body.style.overflow = ""; }
function step(dir) {
  const pos = visible.indexOf(current);
  openLB(visible[(pos + dir + visible.length) % visible.length]);
}
if (lb) {
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
}

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
  const c = document.getElementById("ash");
  if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

// ---------- Load content ----------
function init(d) {
  Site.bind(d);
  const photos = (d.photos || []).filter((p) => p && (p.image || p.title));
  // Map CMS fields to what the gallery uses; each keeps its catalogue number
  items = photos.map((p, i) => ({
    src: p.image, title: p.title || "Untitled", cat: p.category || "Uncategorised",
    date: p.date, shape: p.shape, fav: !!p.trophy, no: i + 1, g: GRADIENTS[i % GRADIENTS.length],
  })).filter((p) => mode !== "favorites" || p.fav);
  counters(photos.length);
  render();

  const bio = document.getElementById("bio");
  if (bio) bio.innerHTML = Site.paragraphs(d.bio);
  const dossier = document.getElementById("dossier");
  if (dossier) dossier.innerHTML = (d.dossier || []).filter((x) => x && (x.label || x.value))
    .map((x) => `<div><dt>${esc((x.label || "").toUpperCase())}</dt><dd>${esc(x.value)}</dd></div>`).join("");
  const portrait = document.getElementById("portrait");
  if (portrait && d.portrait) portrait.outerHTML = `<img src="${esc(Site.asset(d.portrait))}" alt="${esc(d.name || "The curator")}">`;
  const links = document.getElementById("contact-links");
  if (links) links.insertAdjacentHTML("beforeend", Site.socials(d.contact?.socials, "btn ghost").join(""));
  booking(d.booking);
}

// ---------- Book a Shoot page ----------
function booking(b) {
  const box = document.getElementById("booking-form");
  if (!box) return;
  document.getElementById("booking-intro").innerHTML = Site.paragraphs(b?.intro);
  const url = String(b?.form_url || "").trim();
  if (!/^https?:\/\//i.test(url)) {               // no form yet → ask people to email
    document.getElementById("booking-fallback").hidden = false;
    return;
  }
  const newTab = document.getElementById("booking-newtab");
  newTab.querySelector("a").href = url;
  // Full Google Forms links can be shown right on the page
  const g = url.match(/^https:\/\/docs\.google\.com\/forms\/(?:u\/\d+\/)?d\/(e\/)?([\w-]+)/);
  if (g) {
    const src = `https://docs.google.com/forms/d/${g[1] || ""}${g[2]}/viewform?embedded=true`;
    box.innerHTML = `<iframe src="${esc(src)}" title="Booking form" loading="lazy">Loading…</iframe>`;
    newTab.hidden = false;
  } else {                                          // short forms.gle links etc. → a big button
    box.classList.add("as-button");
    box.innerHTML = `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open the booking form ↗</a>`;
  }
  box.hidden = false;
}
Site.load("photo").then(init).catch(Site.fail);
document.querySelectorAll(".year").forEach((el) => (el.textContent = new Date().getFullYear()));
