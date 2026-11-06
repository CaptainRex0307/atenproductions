// =============================================================
// Shared content loader for every page.
// Pages pull their text and photos from /content/*.json, which you
// edit with Pages CMS (see README). You shouldn't need to edit this file.
// =============================================================
const Site = (() => {
  // Path from the current page back to the site root, set on <html data-root="...">
  const root = document.documentElement.dataset.root || "";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Turn a stored media path ("/media/x.jpg") into a working URL for this page
  const asset = (p) => !p ? "" : /^(https?:|data:|mailto:|tel:)/.test(p) ? p : root + String(p).replace(/^\/+/, "");

  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

  const paragraphs = (text) => String(text || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)
    .map((t) => `<p>${esc(t).replace(/\n/g, "<br>")}</p>`).join("");

  const hide = (el) => (el.closest("[data-optional]") || el).setAttribute("hidden", "");

  async function load(name) {
    const res = await fetch(`${root}content/${name}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Could not load content/${name}.json (${res.status})`);
    return res.json();
  }

  // data-bind="contact.email"            → sets text
  // data-href="contact.email|mailto:"    → sets link (mailto:, tel:, or a file/URL)
  // data-optional on a parent            → hides it when the value is empty
  function bind(data, scope = document) {
    scope.querySelectorAll("[data-bind]").forEach((el) => {
      const v = get(data, el.dataset.bind);
      if (v) el.textContent = v; else hide(el);
    });
    scope.querySelectorAll("[data-href]").forEach((el) => {
      const [path, prefix = ""] = el.dataset.href.split("|");
      const v = get(data, path);
      if (!v) return hide(el);
      if (prefix === "tel:") el.href = "tel:" + String(v).replace(/[^\d+]/g, "");
      else if (prefix) el.href = prefix + v;
      else el.href = asset(v);
    });
  }

  function socials(list, className = "") {
    return (list || []).filter((s) => s && s.url)
      .map((s) => `<a class="${className}" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || s.url)}</a>`);
  }

  function fail(err) {
    console.error(err);
    const bar = document.createElement("div");
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:999;padding:.8rem 1rem;background:#c1121f;color:#fff;font:14px/1.4 system-ui;text-align:center";
    bar.textContent = location.protocol === "file:"
      ? "Content can't load from a file:// link. Preview with a local server (see README) or view the live site."
      : "Couldn't load the site content. Check the content/*.json files for a typo.";
    document.body.appendChild(bar);
  }

  return { root, esc, asset, get, paragraphs, load, bind, socials, fail };
})();
