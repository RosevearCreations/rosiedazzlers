#!/usr/bin/env python3
"""Validate metadata, canonical, robots and JSON-LD for every sitemap page."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
ROBOTS = ROOT / "robots.txt"


class MetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title_parts: list[str] = []
        self.descriptions: list[str] = []
        self.canonicals: list[str] = []
        self.noindex = False
        self.in_ldjson = False
        self.ldjson_parts: list[str] = []
        self.ldjson_blocks: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        attr = {str(k).lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            name = attr.get("name", "").lower()
            if name == "description":
                self.descriptions.append(attr.get("content", "").strip())
            elif name == "robots" and "noindex" in attr.get("content", "").lower():
                self.noindex = True
        elif tag == "link":
            rel = {part.lower() for part in attr.get("rel", "").split()}
            if "canonical" in rel:
                self.canonicals.append(attr.get("href", "").strip())
        elif tag == "script" and attr.get("type", "").lower() == "application/ld+json":
            self.in_ldjson = True
            self.ldjson_parts = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self.in_ldjson:
            self.ldjson_blocks.append("".join(self.ldjson_parts).strip())
            self.ldjson_parts = []
            self.in_ldjson = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self.in_ldjson:
            self.ldjson_parts.append(data)


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


def canonical_key(raw: str) -> tuple[str, str, str]:
    parsed = urlparse(raw.strip())
    path = re.sub(r"/+", "/", parsed.path or "/")
    if path != "/":
        path = path.rstrip("/")
    return parsed.scheme.lower(), parsed.netloc.lower(), path


def main() -> int:
    errors: list[str] = []
    urls = sitemap_urls()
    robots = ROBOTS.read_text(encoding="utf-8", errors="ignore") if ROBOTS.exists() else ""
    if not re.search(r"(?im)^\s*sitemap:\s*https://rosiedazzlers\.ca/sitemap\.xml\s*$", robots):
        errors.append("robots.txt does not advertise the canonical sitemap URL")

    for url in urls:
        path = resolve_public_file(url)
        if path is None:
            errors.append(f"{url}: no local HTML source found")
            continue
        parser = MetadataParser()
        parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
        title = " ".join("".join(parser.title_parts).split())
        if not title:
            errors.append(f"{url}: missing non-empty title")
        if len(parser.descriptions) != 1 or not parser.descriptions[0]:
            errors.append(f"{url}: expected one non-empty meta description, found {len(parser.descriptions)}")
        if len(parser.canonicals) != 1 or not parser.canonicals[0]:
            errors.append(f"{url}: expected one canonical link, found {len(parser.canonicals)}")
        elif canonical_key(parser.canonicals[0]) != canonical_key(url):
            errors.append(f"{url}: canonical mismatch -> {parser.canonicals[0]}")
        if parser.noindex:
            errors.append(f"{url}: sitemap page is marked noindex")
        for index, block in enumerate(parser.ldjson_blocks, start=1):
            if not block:
                errors.append(f"{url}: JSON-LD block {index} is empty")
                continue
            try:
                json.loads(block)
            except json.JSONDecodeError as exc:
                errors.append(f"{url}: JSON-LD block {index} is invalid JSON ({exc.msg})")

    if errors:
        print("SEO metadata check: FAIL")
        for error in errors:
            print(f" - {error}")
        return 1

    print(f"SEO metadata check: PASS ({len(urls)} sitemap pages)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
