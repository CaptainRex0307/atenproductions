# Aten Productions + Kōsen Photo portfolio

Plain HTML, CSS and JS. No build step.

```
index.html               → Aten Productions (main page: TD / video engineering)
css/aten.css, js/aten.js
assets/                  → put resume.pdf and project stills here
photography/index.html   → Kōsen Photo (anime-themed photography sub-brand)
photography/css, js
photography/images/      → put your photos here
```

## Customize
- Search both `index.html` files for `[` to find every placeholder (name, projects, bio, contact).
- **Gallery:** edit the `PHOTOS` array at the top of `photography/js/photo.js` (`src: "images/your.jpg"`).
  Filter buttons are generated from the categories automatically.
- **Project stills:** replace a `<div class="work-media">…</div>` with `<img src="assets/img/x.jpg" alt="">` inside it.
- **Colors:** change the `:root` variables at the top of each CSS file.
- **Contact form** uses `mailto:`. For real submissions, point `action` at Formspree or Netlify Forms.

## Preview locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000

## Host for free
Push the folder to a GitHub repo and enable **Settings → Pages**, or drag the folder onto Netlify Drop.
