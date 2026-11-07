# Aten Productions + Dylan's Collection

Live site: https://captainrex0307.github.io/atenproductions/

## ✏️ How to update the site (no code)

All text, contact info, projects and photos live in two files, and you edit them with forms:

1. Go to **https://app.pagescms.org** and sign in with GitHub.
2. The first time, click to install the Pages CMS app on GitHub and give it access to **atenproductions**.
3. Open **atenproductions**. In the left menu you'll see:
   - **Aten Productions (main site):** name, intro, email, phone, socials, projects, services, gear, about, résumé, timeline
   - **Dylan's Collection (photo site):** photos (with upload + "Trophy Room" checkbox), bio, dossier, contact
   - **Media:** every image or PDF you've uploaded
4. Change anything and click **Save**. The live site updates on its own in about 1–2 minutes.

Tips
- Leave a field empty to hide it (e.g. no phone number = no phone row).
- Drag list items to reorder them. The top photo is No. 001.
- Tick **In the Trophy Room** on up to 5 photos to feature them on the photo home page. The first one is shown big.
  Rows come out even with 5 portrait photos, or 4 if one of them is a landscape shot.
- Gallery boxes are **Instagram 4:5**, so portrait posts (1080×1350) fit with no cropping; 3:4 and square shots lose a sliver.
  Leave **Panel shape** on *auto*: landscape photos get a wide box automatically, and every 9th piece is a big feature.
- **Bookings:** there are two Google Form slots under *Bookings*: **Convention bookings** and **Any-time bookings**. In Google Forms: **Send → link icon → untick "Shorten URL" → Copy**, then paste. The full link shows the form right on the page; a short forms.gle link becomes a button instead. Leave a link empty to hide that option.
  Direct links: `photography/book/#convention` and `photography/book/#anytime`.

## How it's built

```
content/aten.json        ← everything on the Aten page
content/photo.json       ← everything on the photo pages
media/                   ← uploaded photos & PDFs
.pages.yml               ← defines the Pages CMS forms

index.html               → Aten Productions (main page)
photography/             → Dylan's Collection home (Trophy Room favourites)
photography/collection/  → The Collection (full gallery with filters)
photography/book/        → Book a Shoot (shows your Google Form)
js/content.js            → loads content/*.json into the pages
```

You can also edit `content/*.json` directly on GitHub (pencil icon) if you prefer.

## Preview locally
The pages load their content with `fetch`, so opening the HTML file directly (file://) won't work. Run:
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000
