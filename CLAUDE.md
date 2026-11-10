# Working on this site

Static site on GitHub Pages (branch `main`, root). No build step.
The owner edits content through **Pages CMS** (app.pagescms.org), which commits straight to `main`.

## Rules that keep CMS edits and code changes from colliding
1. **Pull before every change:** `git pull origin main`. The owner may have saved edits in the CMS since the last session.
2. **Never hardcode content in HTML/JS.** Names, contact info, projects, gear, timeline, bios and photos belong in
   `content/aten.json` / `content/photo.json`. HTML holds only slots (`data-bind`, `data-href`, or an empty container filled by JS).
3. **Keep `.pages.yml` in sync with the JSON.** When adding, renaming or removing a key in `content/*.json`, make the same change
   in `.pages.yml`. A key missing from `.pages.yml` can be dropped the next time the owner saves in the CMS.
4. **Don't rewrite content files wholesale.** Edit only the keys you need, and keep the owner's existing values.
5. **Code must tolerate CMS data:** any field can be empty, `null` or missing, lists can be empty, and filenames can contain spaces.
   Always escape user text with `Site.esc()` and resolve media paths with `Site.asset()`.

## Map
- `content/aten.json` → `index.html` (rendered by `js/aten.js`)
- `content/photo.json` → `photography/index.html` (Trophy Room: photos with `trophy: true`) `photography/collection/` (all photos) and `photography/book/` (booking page: two Google Forms, `booking.convention.form_url` and `booking.anytime.form_url`; options without a link are hidden), rendered by `photography/js/photo.js`
- `js/content.js` → shared loader; each page sets `<html data-root="...">` = path back to the site root
- `media/collection/` → photos dropped here are added to `content/photo.json` → `photos` automatically by
  `.github/workflows/sync-collection.yml` (runs `.github/scripts/sync_collection.py`: resizes, fixes rotation, strips EXIF/GPS/XMP metadata from the files
  (the owner doesn't want camera settings published), appends new
  entries, removes entries whose file was deleted, drops imageless placeholders). Don't hand-edit entries for those files' paths.
- `media/` → CMS uploads, stored in JSON as `/media/<file>` (resolved relative to the page, since the site lives under `/atenproductions/`)
- Preview: `python3 -m http.server` from the repo root (content won't load over file://)
