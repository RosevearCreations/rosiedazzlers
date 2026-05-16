#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "service_area_rules.json"

def slug(value: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return text or "service-area"

def sql_literal(value) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"

def jsonb_literal(value) -> str:
    return sql_literal(json.dumps(value if value is not None else [], ensure_ascii=False)) + "::jsonb"

def main() -> int:
    payload = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = payload.get("service_areas") if isinstance(payload, dict) else []
    if not isinstance(rows, list):
        raise SystemExit("data/service_area_rules.json does not contain service_areas[]")

    print("-- Generated from data/service_area_rules.json")
    print("-- Review before running in Supabase.")
    print("begin;")
    for index, row in enumerate(rows):
        key = slug(str(row.get("value") or row.get("label") or f"area-{index + 1}"))
        columns = [
            "key", "county", "label", "value", "municipality", "zone", "travel_tier", "area_type",
            "aliases", "bylaw_note", "parking_rule", "noise_rule", "water_rule", "access_rule",
            "official_links", "sort_order", "is_active"
        ]
        values = [
            sql_literal(key),
            sql_literal(row.get("county")),
            sql_literal(row.get("label") or row.get("value")),
            sql_literal(row.get("value") or row.get("label")),
            sql_literal(row.get("municipality")),
            sql_literal(row.get("zone")),
            sql_literal(row.get("travel_tier")),
            sql_literal(row.get("area_type")),
            jsonb_literal(row.get("aliases") or []),
            sql_literal(row.get("bylaw_note")),
            sql_literal(row.get("parking_rule")),
            sql_literal(row.get("noise_rule")),
            sql_literal(row.get("water_rule")),
            sql_literal(row.get("access_rule")),
            jsonb_literal(row.get("official_links") or []),
            str(index),
            "true"
        ]
        updates = ", ".join(f"{col}=excluded.{col}" for col in columns if col != "key")
        print(f"insert into public.service_area_rules ({', '.join(columns)}) values ({', '.join(values)}) on conflict (key) do update set {updates};")
    print("commit;")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
