#!/usr/bin/env python3
"""Validate the one-H1 contract for every public URL published in sitemap.xml."""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.h1_depth = 0
        self.h1s: list[list[str]] = []
        self.noindex = False

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        attr = {str(k).lower(): (v or "") for k, v in attrs}
        if tag == "h1":
            self.h1_depth += 1
            if self.h1_depth == 1:
                self.h1s.append([])
        elif tag == "meta" and attr.get("name", "").lower() == "robots":
            if "noindex" in attr.get("content", "").lower():
                self.noindex = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "h1" and self.h1_depth:
            self.h1_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.h1_depth and self.h1s:
            self.h1s[-1].append(data)


def resolve_public_file(url: str) -> Path | None:
    path = urlparse(url).path
    if path in ("", "/"):
        candidates = [ROOT / "index.html"]
    else:
        rel = path.strip("/")
        candidates = [ROOT / rel / "index.html", ROOT / f"{rel}.html"]
    return next((candidate for candidate in candidates if candidate.is_file()), None)


def sitemap_urls() -> list[str]:
    root = ET.parse(SITEMAP).getroot()
    return [node.text.strip() for node in root.findall("{*}url/{*}loc") if node.text and node.text.strip()]


def main() -> int:
    errors: list[str] = []
    urls = sitemap_urls()
    if not urls:
        errors.append("sitemap.xml contains no public URLs")

    for url in urls:
        path = resolve_public_file(url)
        if path is None:
            errors.append(f"{url}: no local HTML source found")
            continue
        parser = PageParser()
        parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
        headings = [" ".join("".join(parts).split()) for parts in parser.h1s]
        if parser.noindex:
            errors.append(f"{url}: sitemap page is marked noindex")
        if len(headings) != 1:
            errors.append(f"{url}: expected exactly one H1, found {len(headings)}")
        elif len(headings[0]) < 2:
            errors.append(f"{url}: H1 is empty or not meaningful")

    if errors:
        print("SEO/H1 check: FAIL")
        for error in errors:
            print(f" - {error}")
        return 1

    print(f"SEO/H1 check: PASS ({len(urls)} sitemap pages, exactly one meaningful H1 each)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
