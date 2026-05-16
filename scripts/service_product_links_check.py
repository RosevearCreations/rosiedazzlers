#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def main() -> int:
    path = ROOT / "data" / "service_product_links.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    links = data.get("links", [])
    if len(links) < 5:
        print("FAIL: expected at least five service/product link rows")
        return 1
    missing = [row for row in links if not row.get("service_slug") or not row.get("recommended_item_keywords")]
    if missing:
        print("FAIL: service product links missing slug or keywords")
        return 1
    print(f"PASS: service/product link map has {len(links)} rows")
    return 0

if __name__ == "__main__":
    sys.exit(main())
