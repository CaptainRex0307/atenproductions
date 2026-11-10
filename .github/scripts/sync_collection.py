"""
Sync media/collection/ with the photo list in content/photo.json.

Runs on GitHub Actions whenever photos are added to or removed from media/collection/
(e.g. dragged into Pages CMS → Media → "Collection photos"). It:
  * shrinks oversized photos and fixes phone rotation (EXIF), so the site stays fast
  * adds every new photo to the end of the list (next No.), titled from its file name,
    dated from the camera's EXIF date (else today), with camera / lens / settings read from EXIF
  * fills in missing camera details on existing entries (never overwrites what the owner typed)
  * removes list entries whose file was deleted from media/collection/
  * drops the demo placeholder entries (no image) once real photos exist
Existing entries keep everything the owner set (title, category, Trophy Room, shape).
"""
import datetime
import json
import os
import re
import sys

from PIL import Image, ImageOps

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
FOLDER = os.path.join(ROOT, "media", "collection")
CONTENT = os.path.join(ROOT, "content", "photo.json")
URL_PREFIX = "/media/collection/"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIDE = 2160          # longest edge after resizing (Instagram 4:5 at 1080 wide = 1350 tall)


def pretty_title(filename):
    stem = os.path.splitext(filename)[0]
    if re.fullmatch(r"(IMG|DSC|DSCF|PXL|MVIMG|Photo|image)?[\s_-]*\d[\d_\s-]*(\s*\(\d+\))?", stem, re.I):
        return "Untitled"                      # camera-style names like IMG_1234
    words = re.sub(r"[_-]+", " ", stem).strip()
    words = re.sub(r"\s+", " ", words)
    return words.title() if words == words.lower() else words


def exif_month(img):
    try:
        exif = img.getexif()
        raw = exif.get_ifd(0x8769).get(36867) or exif.get(306)   # DateTimeOriginal, else DateTime
        if raw:
            y, m = str(raw)[:7].split(":")
            return f"{y}.{m}"
    except Exception:
        pass
    return datetime.date.today().strftime("%Y.%m")


def _num(v):
    try:
        return float(v)
    except Exception:
        try:
            return v[0] / v[1]
        except Exception:
            return None


def exif_camera(img):
    """Camera body, lens and settings ('35mm · f/1.8 · 1/200s · ISO 800') from EXIF, '' when missing."""
    try:
        exif = img.getexif()
        sub = exif.get_ifd(0x8769)
    except Exception:
        return {"body": "", "lens": "", "settings": ""}
    make = str(exif.get(271) or "").strip().strip("\x00")
    model = str(exif.get(272) or "").strip().strip("\x00")
    body = model if (not make or model.lower().startswith(make.split()[0].lower())) else f"{make.title() if make.isupper() else make} {model}"
    lens = str(sub.get(42036) or "").strip().strip("\x00")
    parts = []
    focal, fnum, exp, iso = _num(sub.get(37386)), _num(sub.get(33437)), _num(sub.get(33434)), sub.get(34855)
    if focal: parts.append(f"{focal:g}mm")
    if fnum: parts.append(f"f/{fnum:.1f}".replace(".0", ""))
    if exp:
        parts.append(f"1/{round(1 / exp)}s" if exp < 1 else f"{exp:g}s")
    if isinstance(iso, (tuple, list)): iso = iso[0] if iso else None
    if iso: parts.append(f"ISO {iso}")
    return {"body": body.strip(), "lens": lens, "settings": " · ".join(parts)}


def optimise(path):
    """Fix rotation and shrink big photos in place. Returns (month, camera details) read before any change."""
    with Image.open(path) as img:
        month = exif_month(img)
        camera = exif_camera(img)
        size = os.path.getsize(path)
        rotated = img.getexif().get(274, 1) != 1     # phone photo stored sideways
        too_big = max(img.size) > MAX_SIDE
        if not (rotated or too_big):                 # already fine: never re-compress
            return month, camera
        upright = ImageOps.exif_transpose(img)
        if upright is None:
            return month, camera
        out = upright.copy()
        out.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        fmt = (img.format or "JPEG").upper()
        if fmt in ("JPEG", "MPO"):
            out.convert("RGB").save(path, "JPEG", quality=85, optimize=True, progressive=True)
        elif fmt == "WEBP":
            out.save(path, "WEBP", quality=85)
        else:
            out.save(path, optimize=True)
        print(f"optimised {os.path.basename(path)}: {img.size} {size // 1024}KB -> {out.size} {os.path.getsize(path) // 1024}KB")
        return month, camera


def main():
    with open(CONTENT, encoding="utf-8") as f:
        data = json.load(f)
    photos = [p for p in (data.get("photos") or []) if isinstance(p, dict)]
    before = json.dumps(data.get("photos"), sort_keys=True)   # snapshot: entries get edited in place below

    files = sorted(n for n in (os.listdir(FOLDER) if os.path.isdir(FOLDER) else [])
                   if os.path.splitext(n)[1].lower() in EXTS and not n.startswith("."))
    months, cameras = {}, {}
    for name in files:
        try:
            months[name], cameras[name] = optimise(os.path.join(FOLDER, name))
        except Exception as e:                 # unreadable file: leave it, don't break the run
            print(f"skipped {name}: {e}")

    on_disk = {URL_PREFIX + n for n in months}
    listed = {str(p.get("image") or "") for p in photos}

    # Remove entries whose photo was deleted from media/collection/
    kept = [p for p in photos if not (str(p.get("image") or "").startswith(URL_PREFIX)
                                      and str(p.get("image")) not in on_disk)]
    # Fill in missing camera details on existing entries (only empty fields)
    by_url = {URL_PREFIX + n: cameras[n] for n in cameras}
    for p in kept:
        found = by_url.get(str(p.get("image") or ""))
        if not found:
            continue
        cam = p.get("camera") if isinstance(p.get("camera"), dict) else {}
        merged = {k: (cam.get(k) or found.get(k) or "") for k in ("body", "lens", "settings")}
        if merged != cam:
            p["camera"] = merged
    # Add new photos at the end
    for name in files:
        url = URL_PREFIX + name
        if name in months and url not in listed:
            kept.append({"image": url, "title": pretty_title(name), "category": "",
                         "date": months[name], "location": "", "subject": "", "description": "",
                         "camera": cameras[name], "shape": "auto", "trophy": False})
            print(f"added {name}")
    # Once real photos exist, drop the demo placeholders (entries with no image)
    if any(p.get("image") for p in kept):
        kept = [p for p in kept if p.get("image")]

    if json.dumps(kept, sort_keys=True) != before:
        data["photos"] = kept
        with open(CONTENT, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"photo list updated: {len(photos)} -> {len(kept)} entries")
    else:
        print("photo list already up to date")


if __name__ == "__main__":
    main()
