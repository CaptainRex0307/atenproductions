// =============================================================
// Aten Productions: page behaviour.
// All text comes from content/aten.json (edit it with Pages CMS).
// =============================================================

const GLYPHS = {
  "Eye of Horus": "𓂀", "Ankh": "𓋹", "Djed pillar": "𓊽", "Sun disk": "𓇳",
  "Scarab": "𓆣", "Feather": "𓆄", "Lotus": "𓆸", "Owl": "𓅓",
};
const HUES = [205, 35, 170, 265, 0, 120];
const { esc } = Site;

function renderAten(d) {
  Site.bind(d);

  document.getElementById("services-list").innerHTML = (d.services || []).map((s) => `
    <article class="card">
      <div class="glyph">${GLYPHS[s.icon] || "𓇳"}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </article>`).join("");

  document.getElementById("work-list").innerHTML = (d.projects || []).map((p, i) => `
    <article class="work">
      <div class="work-media" style="--h:${HUES[i % HUES.length]}">
        ${p.image ? `<img src="${esc(Site.asset(p.image))}" alt="${esc(p.title)}" loading="lazy">` : `<span class="mono">PROJECT STILL</span>`}
      </div>
      <div class="work-body">
        <p class="mono meta">${esc([p.year, (p.category || "").toUpperCase()].filter(Boolean).join(" · "))}</p>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        ${(p.tags || []).length ? `<ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      </div>
    </article>`).join("");

  document.getElementById("rig-list").innerHTML = (d.gear || []).map((g) => `
    <div class="spec-col">
      <h4 class="mono">${esc((g.category || "").toUpperCase())}</h4>
      <ul>${(g.items || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>`).join("");

  document.getElementById("about-text").innerHTML = Site.paragraphs(d.about);

  document.getElementById("timeline").innerHTML = (d.timeline || []).map((t) => `
    <li><span class="mono">${esc((t.dates || "").toUpperCase())}</span><h4>${esc(t.title)}</h4><p>${esc(t.text)}</p></li>`).join("");

  const links = Site.socials(d.contact?.socials);
  if (links.length) document.getElementById("socials").innerHTML = links.join("");
  else document.getElementById("socials-row").hidden = true;

  const email = d.contact?.email;
  const form = document.getElementById("contact-form");
  if (email) form.action = "mailto:" + email; else form.hidden = true;

  reveal();
}

// Running SMPTE-style timecode
(function timecode() {
  const el = document.getElementById("timecode");
  if (!el) return;
  const start = performance.now();
  const pad = (n) => String(n).padStart(2, "0");
  function tick(now) {
    const totalFrames = Math.floor(((now - start) / 1000) * 30);
    const f = totalFrames % 30;
    const s = Math.floor(totalFrames / 30) % 60;
    const m = Math.floor(totalFrames / 1800) % 60;
    const h = Math.floor(totalFrames / 108000);
    el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// Mobile nav toggle
(function nav() {
  const btn = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!btn || !links) return;
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
})();

// Reveal sections on scroll
function reveal() {
  const items = document.querySelectorAll(".card, .work, .spec-col, .timeline li, .section-head");
  if (!("IntersectionObserver" in window)) return;
  items.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

Site.load("aten").then(renderAten).catch(Site.fail);
