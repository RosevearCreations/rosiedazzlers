#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "inventory_item").lower()).strip("_")[:80] or "inventory_item"

def load_rows(path: pathlib.Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for field in ("items", "products", "tools", "data"):
            if isinstance(data.get(field), list):
                return data[field]
    return []

def normalize(row: dict, item_type: str) -> dict:
    name = row.get("name") or row.get("title") or row.get("filename") or "Catalog item"
    image = row.get("image_url") or row.get("r2_url") or ((row.get("img_candidates") or [""])[0])
    return {
        "item_key": row.get("item_key") or key(name),
        "item_type": item_type,
        "name": name,
        "category": row.get("category") or "general",
        "subcategory": row.get("subcategory") or row.get("source_kind") or "",
        "image_url": image or "",
        "preferred_vendor": row.get("preferred_vendor") or row.get("brand_guess") or row.get("manufacturer") or ("Amazon" if row.get("amazon_query") else ""),
        "cost_cents": row.get("cost_cents"),
        "unit_label": row.get("unit_label") or "each",
        "amazon_query": row.get("amazon_query") or name,
    }

def score(item: dict) -> tuple[int, list[str]]:
    points = 0
    missing: list[str] = []
    checks = [
        ("image_url", 25, bool(item.get("image_url"))),
        ("name", 10, len(str(item.get("name") or "")) >= 6),
        ("category", 10, bool(item.get("category"))),
        ("subcategory", 8, bool(item.get("subcategory"))),
        ("preferred_vendor", 8, bool(item.get("preferred_vendor"))),
        ("cost_cents", 15, isinstance(item.get("cost_cents"), (int, float)) and item.get("cost_cents", 0) > 0),
        ("unit_label", 5, bool(item.get("unit_label"))),
        ("amazon_query", 8, bool(item.get("amazon_query"))),
    ]
    for name, value, ok in checks:
        if ok:
            points += value
        else:
            missing.append(name)
    if item.get("category") == "general":
        missing.append("specific_category")
    return min(100, points), missing

def main() -> int:
    rows = []
    for path, item_type in [
        (ROOT / "data" / "rosie_products_catalog.json", "consumable"),
        (ROOT / "data" / "systems_catalog.json", "tool"),
    ]:
        rows.extend(normalize(row, item_type) for row in load_rows(path))

    scored = []
    for item in rows:
        value, missing = score(item)
        scored.append({**item, "score": value, "missing": missing})

    summary = {
        "total_items": len(scored),
        "consumables": sum(1 for row in scored if row["item_type"] == "consumable"),
        "tools": sum(1 for row in scored if row["item_type"] == "tool"),
        "missing_images": sum(1 for row in scored if "image_url" in row["missing"]),
        "missing_costs": sum(1 for row in scored if "cost_cents" in row["missing"]),
        "average_score": round(sum(row["score"] for row in scored) / max(1, len(scored)), 1),
    }
    out = {"generated_by": "scripts/catalog_quality_report.py", "summary": summary, "rows": scored}
    (ROOT / "data" / "catalog_quality_report.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    if summary["total_items"] < 100:
        print(f"FAIL: expected a broad catalog, found {summary['total_items']} rows")
        return 1
    if summary["missing_images"] > 0:
        print(f"FAIL: {summary['missing_images']} catalog rows are missing images")
        return 1
    print("PASS: catalog quality report generated", summary)
    return 0

if __name__ == "__main__":
    sys.exit(main())
