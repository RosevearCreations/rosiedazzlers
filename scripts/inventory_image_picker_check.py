#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

REQUIRED_MARKERS = [
    'id="inventoryImagePicker"',
    'id="useMatchingImageBtn"',
    'function collectImageCandidates',
    'function findMatchingBundledImage',
    'id="scanImageHealthBtn"',
    'id="bulkRepairImagesBtn"',
    'function findMatchingBundledImageForItem',
    'normalized._image_from_fallback=true',
    'findMatchingBundledImage()?.url',
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def load_json(path: pathlib.Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # pragma: no cover - release script guard
        fail(f"{path.relative_to(ROOT)} did not parse: {exc}")


def main() -> None:
    admin = (ROOT / "admin-catalog.html").read_text(encoding="utf-8")
    wrapper = (ROOT / "admin-catalog" / "index.html").read_text(encoding="utf-8")
    for marker in REQUIRED_MARKERS:
        if marker not in admin:
            fail(f"admin-catalog.html missing marker: {marker}")
        if marker not in wrapper:
            fail(f"admin-catalog/index.html missing marker: {marker}")

    fallback_files = [ROOT / "data" / "rosie_products_catalog.json", ROOT / "data" / "systems_catalog.json"]
    total_rows = 0
    rows_with_images = 0
    for path in fallback_files:
        rows = load_json(path)
        if not isinstance(rows, list):
            fail(f"{path.relative_to(ROOT)} must be a list")
        total_rows += len(rows)
        rows_with_images += sum(1 for row in rows if row.get("image_url") or row.get("r2_url") or row.get("img_candidates"))
    if total_rows <= 0:
        fail("No bundled inventory fallback rows found")
    if rows_with_images != total_rows:
        fail(f"Bundled inventory fallback images incomplete: {rows_with_images}/{total_rows}")

    print(f"PASS: inventory image picker and fallback image coverage checked ({rows_with_images}/{total_rows} fallback rows have images)")


if __name__ == "__main__":
    main()
