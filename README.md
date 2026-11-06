# Aten Productions + Dylan's Collection portfolio

Plain HTML, CSS and JS. No build step.

```
index.html               → Aten Productions (main page: TD / video engineering)
css/aten.css, js/aten.js
assets/                  → put resume.pdf and project stills here
photography/index.html   → Dylan's Collection home (hero + Most Valuable favourites)
photography/collection/  → The Collection: full gallery with filters
photography/css, js
photography/images/      → put your photos here
```

## Customize
- Search both `index.html` files for `[` to find every placeholder (name, projects, bio, contact).
- **Gallery:** edit `photography/js/collection-data.js` (`src: "images/your.jpg"`). Both photo pages read this one list.
  Set `fav: true` on a photo to feature it in Most Valuable (5 favourites tile best). Filter buttons build themselves.
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
