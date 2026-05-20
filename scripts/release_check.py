#!/usr/bin/env python3
"""Rosie Dazzlers release smoke checks."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKS = [
    [sys.executable, "scripts/cloudflare_pages_functions_check.py"],
    [sys.executable, "scripts/social_dispatch_workflow_check.py"],
    [sys.executable, "scripts/seo_h1_check.py"],
]


def main() -> int:
    for cmd in CHECKS:
        print("Running", " ".join(cmd))
        proc = subprocess.run(cmd, cwd=ROOT)
        if proc.returncode != 0:
            return proc.returncode
    print("Release check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
