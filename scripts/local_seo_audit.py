#!/usr/bin/env python3
from __future__ import annotations
import json
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET_FILE = ROOT / "data" / "local_seo_targets.json"
SITEMAP = ROOT / "sitemap.xml"


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def page_path(route: str) -> pathlib.Path:
    route = route.strip()
    if route == "/":
        return ROOT / "index.html"
    return ROOT / route.strip("/") / "index.html"


def html_text(route: str) -> str:
    path = page_path(route)
    if not path.exists():
        fail(f"Missing local SEO route file: {route} -> {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8", errors="ignore")


def visible_text(value: str) -> str:
    value = re.sub(r"<script[\s\S]*?</script>", " ", value, flags=re.I)
    value = re.sub(r"<style[\s\S]*?</style>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).lower()


def require_meta(route: str, text: str) -> None:
    if len(re.findall(r"<h1\b", text, flags=re.I)) != 1:
        fail(f"{route} must have exactly one static H1 placeholder/shell")
    if not re.search(r"<title>[^<]{12,70}</title>", text, flags=re.I):
        fail(f"{route} needs a useful static title length")
    if not re.search(r'<meta\s+name=["\']description["\']\s+content=["\'][^"\']{50,240}["\']', text, flags=re.I):
        fail(f"{route} needs a useful static meta description")
    if 'rel="canonical"' not in text:
        fail(f"{route} missing canonical link")


def main() -> None:
    data = json.loads(TARGET_FILE.read_text(encoding="utf-8"))
    sitemap_text = SITEMAP.read_text(encoding="utf-8")
    ET.fromstring(sitemap_text)

    all_targets = data.get("priority_town_pages", []) + data.get("priority_service_pages", [])
    for target in all_targets:
        route = target["route"]
        text = html_text(route)
        require_meta(route, text)
        if f"https://rosiedazzlers.ca{route}" not in sitemap_text:
            fail(f"{route} missing from sitemap")

        body = visible_text(text)
        for word in [part for part in re.split(r"[^a-zA-Z]+", target.get("target_phrase", "")) if len(part) > 3]:
            if word.lower() not in body and word.lower() not in text.lower():
                fail(f"{route} target phrase component missing from static shell: {word}")

    print(f"PASS: local SEO audit checked {len(all_targets)} priority routes")


if __name__ == "__main__":
    main()
