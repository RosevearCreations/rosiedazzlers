#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]

def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    result = subprocess.run(cmd, cwd=ROOT, text=True)
    if result.returncode != 0:
        sys.exit(result.returncode)

def validate_json() -> None:
    for path in sorted((ROOT / "data").glob("*.json")):
        json.loads(path.read_text(encoding="utf-8"))
    print("PASS: data JSON parsed")

def validate_xml() -> None:
    ET.parse(ROOT / "sitemap.xml")
    print("PASS: sitemap XML parsed")

def main() -> None:
    validate_json()
    validate_xml()
    run([sys.executable, "scripts/stress_static_checks.py"])
    run([sys.executable, "scripts/local_seo_audit.py"])
    run([sys.executable, "scripts/catalog_fallback_check.py"])
    run([sys.executable, "scripts/service_area_rules_check.py"])
    run([sys.executable, "scripts/catalog_quality_report.py"])
    run([sys.executable, "scripts/catalog_import_preview.py"])
    run([sys.executable, "scripts/service_product_links_check.py"])
    run([sys.executable, "scripts/amazon_match_check.py"])
    run([sys.executable, "scripts/mobile_nav_check.py"])
    run([sys.executable, "scripts/landing_photo_check.py"])
    run([sys.executable, "scripts/admin_app_editor_check.py"])
    run([sys.executable, "scripts/inventory_image_picker_check.py"])
    run([sys.executable, "scripts/media_library_picker_check.py"])
    print("PASS: release checklist completed")

if __name__ == "__main__":
    main()
