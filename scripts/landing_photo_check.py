#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REQUIRED_LOCATION_SLUGS = {
    "tillsonburg-auto-detailing",
    "woodstock-ingersoll-auto-detailing",
    "simcoe-delhi-auto-detailing",
    "port-dover-auto-detailing",
    "norwich-otterville-auto-detailing",
    "zorra-thamesford-embro-auto-detailing",
    "waterford-vittoria-auto-detailing",
    "port-rowan-turkey-point-auto-detailing",
}

def fail(message: str) -> None:
    print("FAIL:", message)
    sys.exit(1)

def main() -> None:
    photo_path = ROOT / "data" / "landing_regional_photos.json"
    if not photo_path.exists():
        fail("data/landing_regional_photos.json is missing")

    photos = json.loads(photo_path.read_text(encoding="utf-8"))
    pages = photos.get("pages") or {}

    missing = sorted(REQUIRED_LOCATION_SLUGS - set(pages))
    if missing:
        fail(f"missing regional-photo rows for {missing}")

    for slug in sorted(REQUIRED_LOCATION_SLUGS):
        row = pages.get(slug) or {}
        for key in ("hero_image_url", "region_photo_caption", "region_photo_source", "region_photo_source_url"):
            if not str(row.get(key) or "").strip():
                fail(f"{slug} missing {key}")
        html_path = ROOT / slug / "index.html"
        if not html_path.exists():
            fail(f"{slug}/index.html is missing")
        html = html_path.read_text(encoding="utf-8")
        if 'property="og:image"' not in html:
            fail(f"{slug} missing og:image")
        if "landing-static-region-photo" not in html:
            fail(f"{slug} missing static regional image fallback")

    api = (ROOT / "functions" / "api" / "landing_pages_public.js").read_text(encoding="utf-8")
    for slug in sorted(REQUIRED_LOCATION_SLUGS):
        idx = api.find(f'"{slug}"')
        if idx < 0:
            fail(f"{slug} missing from landing_pages_public.js")
        block = api[idx:api.find('\n    "', idx + 10) if api.find('\n    "', idx + 10) > 0 else idx + 3000]
        if "hero_image_url" not in block or "region_photo_caption" not in block:
            fail(f"{slug} missing dynamic regional photo fields")

    print(f"PASS: landing regional photos configured for {len(REQUIRED_LOCATION_SLUGS)} location pages")

if __name__ == "__main__":
    main()
