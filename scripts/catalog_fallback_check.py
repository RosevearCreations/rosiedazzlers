#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def load_json(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def count_rows(payload) -> int:
    if isinstance(payload, list):
        return len(payload)
    if isinstance(payload, dict):
        for key in ("items", "products", "tools", "data"):
            if isinstance(payload.get(key), list):
                return len(payload[key])
    return 0

def assert_public_page_merges(page: str) -> None:
    html = (ROOT / page).read_text(encoding="utf-8")
    required = ["mergeCatalogRows", "loadBundledCatalog", "loadDatabaseCatalog", "loadCatalog"]
    missing = [name for name in required if name not in html]
    if missing:
        raise AssertionError(f"{page} is missing catalog merge helpers: {', '.join(missing)}")

def main() -> None:
    consumable_count = count_rows(load_json("data/rosie_products_catalog.json"))
    gear_count = count_rows(load_json("data/systems_catalog.json"))

    if consumable_count < 25:
        raise AssertionError(f"Expected a healthy consumables fallback catalog; found only {consumable_count} rows")
    if gear_count < 20:
        raise AssertionError(f"Expected a healthy gear fallback catalog; found only {gear_count} rows")

    for page in ("consumables.html", "consumables/index.html", "gear.html", "gear/index.html"):
        assert_public_page_merges(page)

    print(f"PASS: catalog fallback check found {consumable_count} consumables and {gear_count} gear/tool rows")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
