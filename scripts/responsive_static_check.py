#!/usr/bin/env python3
"""Static responsive-layout contract for public pages and active staff/customer app shells."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]


class ViewportParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.viewports: list[str] = []
        self.root_min_widths: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        attr = {str(k).lower(): (v or "") for k, v in attrs}
        if tag == "meta" and attr.get("name", "").lower() == "viewport":
            self.viewports.append(attr.get("content", "").lower())
        if tag in {"html", "body"}:
            style = attr.get("style", "")
            match = re.search(r"min-width\s*:\s*(\d+)px", style, flags=re.I)
            if match:
                self.root_min_widths.append(match.group(1))


def resolve_public_file(url: str) -> Path | None:
    path = urlparse(url).path
    if path in ("", "/"):
        candidates = [ROOT / "index.html"]
    else:
        rel = path.strip("/")
        candidates = [ROOT / rel / "index.html", ROOT / f"{rel}.html"]
    return next((candidate for candidate in candidates if candidate.is_file()), None)


def public_pages() -> list[Path]:
    tree = ET.parse(ROOT / "sitemap.xml").getroot()
    paths: list[Path] = []
    for node in tree.findall("{*}url/{*}loc"):
        if node.text and node.text.strip():
            resolved = resolve_public_file(node.text.strip())
            if resolved:
                paths.append(resolved)
    return paths


def active_app_pages() -> list[Path]:
    found: set[Path] = set()
    for path in ROOT.glob("admin*.html"):
        found.add(path)
    app_root = ROOT / "app"
    if app_root.exists():
        for path in app_root.rglob("index.html"):
            found.add(path)
    return sorted(found)


def main() -> int:
    errors: list[str] = []
    pages = sorted(set(public_pages() + active_app_pages()))
    if not pages:
        errors.append("no responsive HTML surfaces discovered")

    for path in pages:
        parser = ViewportParser()
        parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
        rel = path.relative_to(ROOT).as_posix()
        if not parser.viewports:
            errors.append(f"{rel}: missing viewport meta")
        elif not any("width=device-width" in content.replace(" ", "") for content in parser.viewports):
            errors.append(f"{rel}: viewport does not use device width")
        for width in parser.root_min_widths:
            if int(width) > 768:
                errors.append(f"{rel}: root inline min-width {width}px blocks mobile layout")

    if errors:
        print("Responsive source contract: FAIL")
        for error in errors:
            print(f" - {error}")
        return 1

    print(f"Responsive source contract: PASS ({len(pages)} public/app HTML surfaces)")
    print(" - device-width viewport is present")
    print(" - no oversized root inline min-width blocks mobile rendering")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
