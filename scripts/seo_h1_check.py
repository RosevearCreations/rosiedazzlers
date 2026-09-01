#!/usr/bin/env python3
"""Check exposed HTML pages for more than one H1 and retain current public conversion/proof guards."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run_guard(path: Path) -> int:
    proc = subprocess.run(
        [sys.executable, str(path)],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if proc.stdout.strip():
        print(proc.stdout.strip())
    if proc.stderr.strip():
        print(proc.stderr.strip(), file=sys.stderr)
    return proc.returncode


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

    # Build 282 is retained because it owns current public acquisition/booking paths.
    build282 = ROOT / "scripts/build282_release_check.py"
    if build282.exists():
        code = run_guard(build282)
        if code:
            return code

    # Build 283 owns the public proof/publication safety boundary.
    build283 = ROOT / "scripts/build283_release_check.py"
    if build283.exists():
        code = run_guard(build283)
        if code:
            return code

    # Build 284 owns contextual placement of real proof on service/location/use-case pages.
    build284 = ROOT / "scripts/build284_release_check.py"
    if build284.exists():
        code = run_guard(build284)
        if code:
            return code

    # Build 285 owns the authenticated customer-history -> current-booking handoff.
    # The cumulative release check invokes this SEO guard, keeping the latest
    # customer conversion boundary in the stable source + Cloudflare path.
    build285 = ROOT / "scripts/build285_release_check.py"
    if build285.exists():
        code = run_guard(build285)
        if code:
            return code

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
