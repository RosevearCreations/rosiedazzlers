#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import subprocess
import runpy
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]

def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    try:
        result = subprocess.run(
            cmd,
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=90,
        )
    except subprocess.TimeoutExpired as exc:
        print(f"FAIL: {' '.join(cmd)} timed out after 90 seconds", file=sys.stderr)
        if exc.stdout:
            print(exc.stdout, file=sys.stdout)
        if exc.stderr:
            print(exc.stderr, file=sys.stderr)
        sys.exit(1)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    if result.returncode != 0:
        sys.exit(result.returncode)

def run_python_script(script_path: str) -> None:
    print("+", sys.executable, script_path)
    old_argv = sys.argv[:]
    sys.argv = [script_path]
    try:
        runpy.run_path(str(ROOT / script_path), run_name="__main__")
    except SystemExit as exc:
        code = exc.code if isinstance(exc.code, int) else 1
        if code:
            sys.exit(code)
    finally:
        sys.argv = old_argv

def run_cloudflare_pages_functions_check() -> None:
    import importlib.util
    script = ROOT / "scripts" / "cloudflare_pages_functions_check.py"
    spec = importlib.util.spec_from_file_location("cloudflare_pages_functions_check", script)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    module.main()

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
    run_cloudflare_pages_functions_check()
    run_python_script("scripts/stale_root_function_shims_check.py")
    run_python_script("scripts/stress_static_checks.py")
    run_python_script("scripts/local_seo_audit.py")
    run_python_script("scripts/catalog_fallback_check.py")
    run_python_script("scripts/service_area_rules_check.py")
    run_python_script("scripts/catalog_quality_report.py")
    run_python_script("scripts/catalog_import_preview.py")
    run_python_script("scripts/service_product_links_check.py")
    run_python_script("scripts/amazon_match_check.py")
    run_python_script("scripts/mobile_nav_check.py")
    run_python_script("scripts/landing_photo_check.py")
    run_python_script("scripts/admin_app_editor_check.py")
    run_python_script("scripts/inventory_image_picker_check.py")
    run_python_script("scripts/media_library_picker_check.py")
    print("PASS: release checklist completed")

if __name__ == "__main__":
    main()
