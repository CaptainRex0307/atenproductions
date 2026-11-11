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
// Panel shapes. Cells are Instagram 4:5. On "auto", every 9th piece is a 2×2 feature
// (big + 8 portraits fill 3 rows of 4) and landscape photos get a wide box once they load.
const FAV_LAYOUT = ["big", "", "", "", ""];          // 5 favourites = 2 full rows
const SHAPES = { portrait: "", square: "", tall: "", wide: "wide", big: "big" };
const autoShape = (i) => (i % 9 === 0 ? "big" : "");

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
    const auto = !p.shape || p.shape === "auto";
    const size = mode === "favorites" ? (FAV_LAYOUT[i] ?? "")
      : auto ? autoShape(i) : SHAPES[p.shape] ?? "";
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
      <figcaption class="label"><small>${esc([p.cat, p.character, p.date ? "ACQUIRED " + p.date : ""].map((x) => String(x || "").trim().toUpperCase()).filter(Boolean).join(" · "))}</small>${esc(p.title)}</figcaption>`;
    el.addEventListener("click", () => openLB(i));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") openLB(i); });
    // Smart auto: a landscape photo (wider than ~5:4) gets a wide box instead
    const img = el.querySelector("img");
    if (img && (auto || mode === "favorites")) {
      const fit = () => {
        if (img.naturalWidth / img.naturalHeight > 1.25) { el.classList.remove("big"); el.classList.add("wide"); }
      };
      img.complete && img.naturalWidth ? fit() : img.addEventListener("load", fit, { once: true });
    }
    grid.appendChild(el);
  });
  visible = items.map((_, i) => i);

  if (filters) buildFilters();
}

// ---------- Filters (Collection page): category buttons + Character / Cosplayer menus ----------
// Each can be linked to directly: collection/?character=Rem&cosplayer=Ana&category=Cosplay
const norm = (v) => String(v || "").trim().toLowerCase();
const filterState = { category: "All", character: "", cosplayer: "" };

function buildFilters() {
  const q = new URLSearchParams(location.search);
  filterState.category = q.get("category") || (q.get("trophy") !== null ? "★ Trophy Room" : "All");
  filterState.character = q.get("character") || "";
  filterState.cosplayer = q.get("cosplayer") || "";

  const cats = ["All", "★ Trophy Room", ...new Set(items.map((p) => p.cat).filter(Boolean))];
  filters.innerHTML = `<div class="filter-buttons">${cats.map((c) =>
    `<button role="tab" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
  filters.querySelectorAll("button[data-cat]").forEach((btn) =>
    btn.addEventListener("click", () => { filterState.category = btn.dataset.cat; applyFilters(); }));

  // Dropdowns list every character / cosplayer used, with how many pieces each has
  const menu = (key, label) => {
    const counts = new Map();
    items.forEach((p) => {
      const v = String(p[key] || "").trim();
      if (!v) return;
      const c = counts.get(norm(v)) || { name: v, n: 0 };
      c.n++; counts.set(norm(v), c);
    });
    if (!counts.size) return "";
    const opts = [...counts.values()].sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => `<option value="${esc(c.name)}">${esc(c.name)} (${c.n})</option>`).join("");
    return `<label class="filter-menu"><span>${label}</span>
      <select data-key="${key}"><option value="">All</option>${opts}</select></label>`;
  };
  const menus = menu("character", "Character") + menu("cosplayer", "Cosplayer");
  if (menus) filters.insertAdjacentHTML("beforeend", `<div class="filter-menus">${menus}
    <button type="button" class="filter-clear" hidden>✕ Clear filters</button></div>`);
  filters.querySelectorAll("select[data-key]").forEach((sel) =>
    sel.addEventListener("change", () => { filterState[sel.dataset.key] = sel.value; applyFilters(); }));
  filters.querySelector(".filter-clear")?.addEventListener("click", () => {
    Object.assign(filterState, { category: "All", character: "", cosplayer: "" });
    applyFilters();
  });
  applyFilters();
}

function applyFilters() {
  const { category, character, cosplayer } = filterState;
  filters.querySelectorAll("button[data-cat]").forEach((b) => b.setAttribute("aria-selected", b.dataset.cat === category));
  filters.querySelectorAll("select[data-key]").forEach((sel) => {
    const want = norm(filterState[sel.dataset.key]);
    const opt = [...sel.options].find((o) => norm(o.value) === want);
    sel.value = opt ? opt.value : "";
  });
  const clear = filters.querySelector(".filter-clear");
  if (clear) clear.hidden = category === "All" && !character && !cosplayer;

  visible = [];
  grid.querySelectorAll(".panel").forEach((el) => {
    const p = items[+el.dataset.index];
    const show = (category === "All" || (category.startsWith("★") ? p.fav : p.cat === category))
      && (!character || norm(p.character) === norm(character))
      && (!cosplayer || norm(p.cosplayer) === norm(cosplayer));
    el.classList.toggle("hide", !show);
    if (show) visible.push(+el.dataset.index);
  });
  const none = grid.querySelector(".empty-filter");
  if (!visible.length && items.length) {
    if (!none) grid.insertAdjacentHTML("beforeend", `<p class="empty-filter empty-archive mono">// NO PIECES MATCH THESE FILTERS.</p>`);
  } else if (none) none.remove();

  // Keep the address bar in sync so a filtered view can be shared
  const q = new URLSearchParams();
  if (category !== "All") { if (category.startsWith("★")) q.set("trophy", "1"); else q.set("category", category); }
  if (character) q.set("character", character);
  if (cosplayer) q.set("cosplayer", cosplayer);
  history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
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

// "@rem.cos", "rem.cos", "instagram.com/rem.cos" or a full link → { handle, url }; other links pass through
function instagram(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  const m = v.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})/i) || v.match(/^@?([A-Za-z0-9._]{1,30})$/);
  if (m) return { handle: m[1], url: `https://www.instagram.com/${m[1]}/` };
  return /^https?:\/\//i.test(v) ? { handle: "", url: v } : null;
}

function openLB(i) {
  current = i;
  const p = items[i];
  lbMedia.innerHTML = media(p);
  const line = (parts) => parts.map((x) => String(x || "").trim()).filter(Boolean).map(esc).join(" · ");
  // Case-file details: only the ones filled in are shown
  const ig = instagram(p.cosplayer_instagram);
  const cosName = String(p.cosplayer || "").trim() || (ig && ig.handle ? "@" + ig.handle : "");
  const cosplayer = !cosName ? "" : ig
    ? `<a href="${esc(ig.url)}" target="_blank" rel="noopener">${esc(cosName)}${ig.handle && cosName !== "@" + ig.handle ? ` <em>@${esc(ig.handle)}</em>` : ""} ↗</a>`
    : esc(cosName);
  // "⌕ all" opens the Collection filtered to that character / cosplayer
  const allLink = (key, v) => v ? ` <a class="lb-all" href="${mode === "all" ? "" : "collection/"}?${key}=${encodeURIComponent(v)}" title="All pieces with ${esc(v)}">⌕ all</a>` : "";
  const charName = String(p.character || "").trim();
  const facts = [["Character", charName ? esc(charName) + allLink("character", charName) : ""],
                 ["Cosplayer", cosplayer ? cosplayer + allLink("cosplayer", String(p.cosplayer || "").trim()) : ""],
                 ["Shot", esc(String(p.date || "").trim())], ["Convention", esc(String(p.convention || "").trim())]]
    .filter(([, v]) => v)
    .map(([k, v]) => `<span class="lb-fact"><i>${k}</i><span>${v}</span></span>`).join("");
  lbCap.innerHTML = `<small>${line(["No. " + pad(p.no), p.cat.toUpperCase(), p.fav ? "TROPHY ROOM" : ""])}</small>
    <span class="lb-title">${esc(p.title)}</span>
    ${facts ? `<span class="lb-facts">${facts}</span>` : ""}`;
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
  // Piece No.: the number typed in the CMS, else the position in the list. Gallery is sorted by it.
  const pieceNo = (p, i) => { const n = parseInt(p.number, 10); return n > 0 ? n : i + 1; };
  items = photos.map((p, i) => ({
    src: p.image, title: p.title || "Untitled", cat: String(p.category || "").trim(),
    date: p.date, shape: p.shape, fav: !!p.trophy, no: pieceNo(p, i), g: GRADIENTS[i % GRADIENTS.length],
    character: p.character, convention: p.convention,
    cosplayer: p.cosplayer, cosplayer_instagram: p.cosplayer_instagram,
  })).map((p, i) => ({ ...p, order: i })).sort((a, b) => a.no - b.no || a.order - b.order);
  if (mode === "favorites") {
    // Ticked "Trophy Room" photos; if none are ticked yet, show the 5 newest pieces
    const favs = items.filter((p) => p.fav);
    items = favs.length ? favs : items.slice(-5).reverse();
  }
  counters(photos.length);
  render();
  if (grid && !items.length) {
    grid.innerHTML = `<p class="empty-archive mono">// THE ARCHIVE IS EMPTY. NEW ACQUISITIONS ARRIVING SOON.</p>`;
  }

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
// Two Google Forms: booking.convention and booking.anytime. Options without a link are hidden.
const BOOKING_TYPES = [
  { key: "convention", jp: "イベント撮影", fallback: "Convention Shoot" },
  { key: "anytime",    jp: "通常撮影",     fallback: "Any Time" },
];
const isUrl = (u) => /^https?:\/\//i.test(String(u || "").trim());

function booking(b) {
  const box = document.getElementById("booking-form");
  if (!box) return;
  document.getElementById("booking-intro").innerHTML = Site.paragraphs(b?.intro);
  const options = BOOKING_TYPES.map((t) => ({ ...t, ...(b?.[t.key] || {}) })).filter((o) => isUrl(o.form_url));
  if (!options.length) {                             // no forms yet → ask people to email
    document.getElementById("booking-fallback").hidden = false;
    return;
  }
  const choices = document.getElementById("booking-choices");
  choices.innerHTML = options.map((o) => `
    <button class="booking-choice" role="tab" data-key="${o.key}" aria-selected="false">
      <small>${esc(o.jp)}</small>
      <b>${esc(o.title || o.fallback)}</b>
      ${o.text ? `<span>${esc(o.text)}</span>` : ""}
    </button>`).join("");
  choices.hidden = false;
  choices.querySelectorAll(".booking-choice").forEach((btn) =>
    btn.addEventListener("click", () => { showForm(options.find((o) => o.key === btn.dataset.key)); history.replaceState(null, "", "#" + btn.dataset.key); }));
  // Open the one named in the link (#convention / #anytime), else the first
  showForm(options.find((o) => "#" + o.key === location.hash) || options[0]);
}

function showForm(o) {
  const box = document.getElementById("booking-form");
  const newTab = document.getElementById("booking-newtab");
  document.querySelectorAll(".booking-choice").forEach((btn) => btn.setAttribute("aria-selected", btn.dataset.key === o.key));
  const url = String(o.form_url).trim();
  newTab.querySelector("a").href = url;
  // Full Google Forms links can be shown right on the page
  const g = url.match(/^https:\/\/docs\.google\.com\/forms\/(?:u\/\d+\/)?d\/(e\/)?([\w-]+)/);
  if (g) {
    const src = `https://docs.google.com/forms/d/${g[1] || ""}${g[2]}/viewform?embedded=true`;
    box.className = "booking-frame";
    box.innerHTML = `<iframe src="${esc(src)}" title="${esc(o.title || o.fallback)} booking form" loading="lazy">Loading…</iframe>`;
    newTab.hidden = false;
  } else {                                          // short forms.gle links etc. → a big button
    box.className = "booking-frame as-button";
    box.innerHTML = `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open the ${esc(o.title || o.fallback)} form ↗</a>`;
    newTab.hidden = true;
  }
  box.hidden = false;
}

Site.load("photo").then(init).catch(Site.fail);
