#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def make_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "inventory_item").lower()).strip("_")[:80] or "inventory_item"

def load(path: pathlib.Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("items", [])

def norm(row: dict, kind: str) -> dict:
    name = row.get("name") or row.get("title") or row.get("filename") or "Catalog item"
    return {
        "item_key": row.get("item_key") or make_key(name),
        "item_type": "tool" if kind == "tool" else "consumable",
        "name": name,
        "image_url": row.get("image_url") or row.get("r2_url") or ((row.get("img_candidates") or [""])[0]),
        "category": row.get("category") or "general",
    }

def main() -> int:
    bundled = [norm(row, "consumable") for row in load(ROOT / "data" / "rosie_products_catalog.json")]
    bundled += [norm(row, "tool") for row in load(ROOT / "data" / "systems_catalog.json")]
    seen: set[str] = set()
    duplicate_keys = []
    for row in bundled:
        key = row["item_key"]
        if key in seen:
            duplicate_keys.append(key)
        seen.add(key)
    out = {
        "generated_by": "scripts/catalog_import_preview.py",
        "total_bundled_rows": len(bundled),
        "duplicate_item_keys": sorted(set(duplicate_keys)),
        "recommended_first_import": [row for row in bundled if row["image_url"]][:25],
        "review_rule": "Use Admin Catalog preview for live DB create/update/skip decisions before import.",
    }
    (ROOT / "data" / "catalog_import_preview.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    if duplicate_keys:
        print("FAIL: duplicate bundled item keys:", sorted(set(duplicate_keys))[:10])
        return 1
    print(f"PASS: import preview generated for {len(bundled)} bundled rows")
    return 0

if __name__ == "__main__":
    sys.exit(main())
