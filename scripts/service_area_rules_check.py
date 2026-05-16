#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def main() -> int:
    path = ROOT / "data" / "service_area_rules.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        rows = data.get("service_areas") or data.get("items") or []
    elif isinstance(data, list):
        rows = data
    else:
        rows = []
    counties = {str(row.get("county", "")).lower() for row in rows if isinstance(row, dict)}
    if len(rows) < 20:
        print(f"FAIL: expected broad Oxford/Norfolk service-area coverage, found {len(rows)} rows")
        return 1
    if not any("oxford" in county for county in counties) or not any("norfolk" in county for county in counties):
        print("FAIL: service-area rules must include Oxford County and Norfolk County")
        return 1
    print(f"PASS: service-area rules include {len(rows)} rows and both counties")
    return 0

if __name__ == "__main__":
    sys.exit(main())
