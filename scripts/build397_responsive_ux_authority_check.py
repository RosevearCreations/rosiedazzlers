#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def require(path, needles):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return
    text = p.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{path}: missing {needle!r}")

require("assets/site.css", [
    "site-base-build396.css",
    "build397-responsive-baseline.css",
])
require("assets/site-base-build396.css", ["Rosie Dazzlers", "--accent"])
require("assets/build397-responsive-baseline.css", [
    "Build 397",
    "@media (max-width: 900px)",
    "@media (max-width: 720px)",
    "min-height: 44px",
    "font-size: 16px",
    "max-height: min(92dvh, 960px)",
    "overflow-x: auto",
    "prefers-reduced-motion",
])

for page in ("index.html", "book.html", "admin/index.html", "admin/it.html"):
    require(page, [
        'name="viewport"',
        "/assets/site.css",
    ])

# Compatibility entry points must continue routing historical screens through site.css.
for compat in ("assets/admin.css", "assets/style.css", "assets/styles.css"):
    require(compat, ["/assets/site.css"])

if errors:
    print("BUILD 397 RESPONSIVE AUTHORITY: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BUILD 397 RESPONSIVE AUTHORITY: GREEN")
print("Validated shared responsive layer, touch/form/dialog/table contracts, viewport metadata, and compatibility routes.")
