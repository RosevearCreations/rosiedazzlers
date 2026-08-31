#!/usr/bin/env python3
"""Check exposed HTML pages for more than one H1 and retain current public conversion guards."""
from __future__ import annotations

import re
import subprocess
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

    # Build 282 is a public acquisition/booking slice. The cumulative release check
    # already invokes this SEO guard, so retain the focused use-case contract here
    # without rewriting the older cumulative release authority.
    build282 = ROOT / "scripts/build282_release_check.py"
    if build282.exists():
        proc = subprocess.run(
            [sys.executable, str(build282)],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        if proc.stdout.strip():
            print(proc.stdout.strip())
        if proc.stderr.strip():
            print(proc.stderr.strip(), file=sys.stderr)
        if proc.returncode:
            return proc.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
