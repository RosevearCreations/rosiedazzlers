#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGETS = json.loads((ROOT / "data/local_seo_targets.json").read_text(encoding="utf-8"))

CORE_PUBLIC = [
    "index.html",
    "services.html",
    "pricing.html",
    "book.html",
    "about.html",
    "contact.html",
]

def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)

def read(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")

def strip_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text)

def check_page(rel: str, required_terms: list[str]) -> None:
    path = ROOT / rel
    if not path.exists():
        fail(f"missing SEO page: {rel}")
    text = read(path)
    plain = strip_tags(text).lower()
    for needle in ["<title>", 'name="description"', 'rel="canonical"']:
        if needle not in text:
            fail(f"{rel} missing {needle}")
    if len(re.findall(r"<h1\b", text, flags=re.I)) != 1:
        fail(f"{rel} should have exactly one H1")
    for term in required_terms:
        if term.lower() not in plain:
            fail(f"{rel} missing local/search term: {term}")

def main() -> None:
    for rel in CORE_PUBLIC:
        check_page(rel, ["detailing"])
    for page in TARGETS.get("town_pages", []):
        slug = page.get("slug")
        if not slug:
            continue
        rel = f"{slug}/index.html"
        terms = ["detailing"] + [town for town in page.get("towns", []) if town]
        check_page(rel, terms)
    for slug in TARGETS.get("service_pages", []):
        rel = f"{slug}/index.html" if (ROOT / slug / "index.html").exists() else f"{slug}.html"
        if (ROOT / rel).exists():
            check_page(rel, ["detailing"])
    sitemap = read(ROOT / "sitemap.xml") if (ROOT / "sitemap.xml").exists() else ""
    for page in TARGETS.get("town_pages", []):
        if page.get("slug") and page["slug"] not in sitemap:
            fail(f"sitemap missing {page['slug']}")
    print("PASS: local SEO audit completed")

if __name__ == "__main__":
    main()
