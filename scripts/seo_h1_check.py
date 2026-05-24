#!/usr/bin/env python3
"""Check exposed HTML pages for more than one H1."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    bad = []
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith(("archive/", "node_modules/")):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        count = len(re.findall(r"<h1\b", text, flags=re.I))
        if count > 1:
            bad.append((rel, count))
    if bad:
        print("ERROR: Pages with more than one H1:")
        for rel, count in bad[:50]:
            print(f"- {rel}: {count}")
        return 1
    print("SEO/H1 check passed: no HTML file has more than one H1.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
