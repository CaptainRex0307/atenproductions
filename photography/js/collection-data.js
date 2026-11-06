// =============================================================
// DYLAN'S COLLECTION: your photo list (shared by both pages).
//
//   src:   photo path relative to the photography/ folder,
//          e.g. "images/alley.jpg"  (leave "" for a placeholder)
//   title: caption
//   cat:   category (filter buttons on the Collection page are built from these)
//   date:  when it was "acquired"
//   size:  "" | "wide" | "tall" | "big"  (panel shape on the full Collection page)
//   fav:   true = show it in "Most Valuable" on the main photo page
//
// Pieces are numbered automatically in list order (No. 001, No. 002, ...).
// On the main page, favourites are laid out automatically: the first is big.
// 5 favourites tile perfectly (3 also works).
// =============================================================
const PHOTOS = [
  { src: "", title: "The Midnight Platform", cat: "Night",     date: "2026.10", size: "big",  fav: true  },
  { src: "", title: "Faceless Crowd",        cat: "Street",    date: "2026.09", size: "",     fav: false },
  { src: "", title: "Red Room Portrait",     cat: "Portraits", date: "2026.08", size: "",     fav: true  },
  { src: "", title: "Fog Over the Overpass", cat: "Urban",     date: "2026.07", size: "wide", fav: true  },
  { src: "", title: "The Masked Guest",      cat: "Cosplay",   date: "2026.06", size: "",     fav: true  },
  { src: "", title: "Stairwell No. 4",       cat: "Urban",     date: "2026.05", size: "tall", fav: false },
  { src: "", title: "Neon Bleeds",           cat: "Night",     date: "2026.04", size: "",     fav: false },
  { src: "", title: "Still Watching",        cat: "Portraits", date: "2026.03", size: "",     fav: true  },
  { src: "", title: "Last Train Home",       cat: "Street",    date: "2026.02", size: "wide", fav: false },
];
