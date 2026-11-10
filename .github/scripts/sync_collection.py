"""
Sync media/collection/ with the photo list in content/photo.json.

Runs on GitHub Actions whenever photos are added to or removed from media/collection/
(e.g. dragged into Pages CMS → Media → "Collection photos"). It:
  * shrinks oversized photos and fixes phone rotation, so the site stays fast
  * strips hidden metadata (camera, lens, settings, GPS location) from every photo file,
    losslessly for JPEGs, so none of it is published
  * adds every new photo to the end of the list (next No.), titled from its file name,
    with the date it was shot (from the camera, else today)
  * removes list entries whose file was deleted from media/collection/
  * drops the demo placeholder entries (no image) once real photos exist
Existing entries keep everything the owner set (title, date, character, convention, category, Trophy Room, shape).
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


# JPEG segments that carry hidden metadata: APP1 (EXIF: camera, settings, GPS / XMP), APP13 (IPTC), COM (comments).
# Colour profiles (APP2) and the JFIF/Adobe headers are kept so colours stay right.
_META_MARKERS = {0xE1, 0xED, 0xFE}


def _jpeg_segments(data):
    """Yield (marker, start, end) for each header segment of a JPEG, stopping at the image data."""
    i = 2
    while i + 4 <= len(data) and data[i] == 0xFF:
        marker = data[i + 1]
        if marker == 0xDA:                      # start of image data: everything after is pixels
            return
        if marker == 0xFF:                      # padding byte
            i += 1
            continue
        if 0xD0 <= marker <= 0xD9 or marker == 0x01:
            i += 2
            continue
        length = int.from_bytes(data[i + 2:i + 4], "big")
        yield marker, i, i + 2 + length
        i += 2 + length


def strip_jpeg_metadata(path):
    """Remove EXIF/XMP/IPTC/comments from a JPEG without re-compressing it. Returns True if anything was removed."""
    with open(path, "rb") as f:
        data = f.read()
    if data[:2] != b"\xff\xd8":
        return False
    cut = [(a, b) for m, a, b in _jpeg_segments(data) if m in _META_MARKERS]
    if not cut:
        return False
    out, pos = bytearray(), 0
    for a, b in cut:
        out += data[pos:a]
        pos = b
    out += data[pos:]
    with open(path, "wb") as f:
        f.write(out)
    return True


_KEEP_INFO = {"icc_profile", "dpi", "gamma", "transparency", "srgb", "aspect", "chromaticity", "loop", "duration", "background"}


def optimise(path):
    """Fix rotation, shrink big photos and strip hidden metadata (camera, settings, GPS) in place.
    Returns the month the photo was shot, read before the metadata is removed."""
    with Image.open(path) as img:
        month = exif_month(img)
        size = os.path.getsize(path)
        fmt = (img.format or "JPEG").upper()
        icc = img.info.get("icc_profile")
        rotated = img.getexif().get(274, 1) != 1     # phone photo stored sideways
        too_big = max(img.size) > MAX_SIDE
        if rotated or too_big:                       # re-encode once; metadata is not carried over
            upright = ImageOps.exif_transpose(img) or img
            out = upright.copy()
            out.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            kw = {"icc_profile": icc} if icc else {}
            if fmt in ("JPEG", "MPO"):
                out.convert("RGB").save(path, "JPEG", quality=85, optimize=True, progressive=True, **kw)
            elif fmt == "WEBP":
                out.save(path, "WEBP", quality=85, **kw)
            else:
                out.save(path, optimize=True, **kw)
            print(f"optimised {os.path.basename(path)}: {img.size} {size // 1024}KB -> {out.size} {os.path.getsize(path) // 1024}KB")
            return month
        has_meta = bool(img.getexif()) or any(k not in _KEEP_INFO for k in img.info)
        if not has_meta:                             # already clean: never touch it again
            return month
        if fmt in ("JPEG", "MPO"):
            pass                                     # handled losslessly below, after the file is closed
        else:                                        # PNG (lossless) / WebP: re-save without metadata
            out = img.copy()
            kw = {"icc_profile": icc} if icc else {}
            if fmt == "WEBP":
                out.save(path, "WEBP", quality=90, **kw)
            else:
                out.save(path, optimize=True, **kw)
            print(f"removed hidden metadata from {os.path.basename(path)}")
            return month
    if strip_jpeg_metadata(path):
        print(f"removed hidden metadata from {os.path.basename(path)}")
    return month


def main():
    with open(CONTENT, encoding="utf-8") as f:
        data = json.load(f)
    photos = [p for p in (data.get("photos") or []) if isinstance(p, dict)]
    before = json.dumps(data.get("photos"), sort_keys=True)   # snapshot: entries get edited in place below

    files = sorted(n for n in (os.listdir(FOLDER) if os.path.isdir(FOLDER) else [])
                   if os.path.splitext(n)[1].lower() in EXTS and not n.startswith("."))
    months = {}
    for name in files:
        try:
            months[name] = optimise(os.path.join(FOLDER, name))
        except Exception as e:                 # unreadable file: leave it, don't break the run
            print(f"skipped {name}: {e}")

    on_disk = {URL_PREFIX + n for n in months}
    listed = {str(p.get("image") or "") for p in photos}

    # Remove entries whose photo was deleted from media/collection/
    kept = [p for p in photos if not (str(p.get("image") or "").startswith(URL_PREFIX)
                                      and str(p.get("image")) not in on_disk)]
    # Add new photos at the end
    for name in files:
        url = URL_PREFIX + name
        if name in months and url not in listed:
            kept.append({"image": url, "title": pretty_title(name), "date": months[name],
                         "character": "", "cosplayer": "", "cosplayer_instagram": "",
                         "convention": "", "category": "",
                         "shape": "auto", "trophy": False})
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
