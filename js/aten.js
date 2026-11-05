// Aten Productions: small interactions

// Running SMPTE-style timecode (59.94 shown as 30-frame counter for simplicity)
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
(function reveal() {
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
})();

document.getElementById("year").textContent = new Date().getFullYear();
