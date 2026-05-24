#!/usr/bin/env python3
"""Build 166 competitor-roadmap completion guard."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "COMPETETIVE.md",
    "COMPETITOR.md",
    "COMPETETOR.md",
    "COMPETETIVE_COMPLETION_MATRIX.md",
    "specials.html",
    "specials/index.html",
    "gift-cards.html",
    "gift-cards/index.html",
    "fleet.html",
    "fleet/index.html",
    "maintenance.html",
    "maintenance/index.html",
    "blog.html",
    "blog/index.html",
    "blog/ontario-road-salt-cleanup/index.html",
    "blog/pet-hair-removal-car-detailing/index.html",
    "blog/ceramic-coating-vs-wax/index.html",
    "blog/paint-correction-basics/index.html",
    "blog/prepare-for-mobile-detailing/index.html",
]

REQUIRED_MARKERS = {
    "assets/chrome.js": ["ensureStickyConversionCta", "Send photos for estimate", "/specials", "/gift-cards", "/fleet"],
    "services.html": ["competitor-service-hub", "/specials", "/gift-cards", "/fleet", "/maintenance", "/blog"],
    "index.html": ["competitor-completion-links", "/specials", "/gift-cards", "/fleet"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Sticky CTA buttons", "Specials", "Gift cards", "Fleet/commercial", "Customer education content"],
    "DEVELOPMENT_ROADMAP.md": ["Build 166", "COMPETETIVE.md completion pass", "Next several steps after Build 166"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 166", "Direct upload is still not complete"],
}

REQUIRED_ADDONS = [
    "pet_hair_removal",
    "odor_treatment",
    "seat_shampoo",
    "carpet_shampoo",
    "salt_stain_treatment",
    "headlight_restoration_addon",
    "windshield_ceramic_coating",
    "ceramic_spray_wax",
    "trim_restoration",
    "bug_tar_removal",
    "truck_box_wash",
    "fleet_vehicle_add_on",
]

def fail(msg: str) -> int:
    print(f"FAIL: {msg}")
    return 1

def main() -> int:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            return fail(f"Missing {rel}")

    for rel, markers in REQUIRED_MARKERS.items():
        text = (ROOT / rel).read_text(encoding="utf-8", errors="ignore")
        for marker in markers:
            if marker not in text:
                return fail(f"Missing marker {marker!r} in {rel}")

    catalog = json.loads((ROOT / "data/rosie_services_pricing_and_packages.json").read_text(encoding="utf-8"))
    codes = {addon.get("code") for addon in catalog.get("addons", [])}
    missing = [code for code in REQUIRED_ADDONS if code not in codes]
    if missing:
        return fail(f"Missing add-ons: {missing}")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8", errors="ignore")
    for route in ["/specials/", "/gift-cards/", "/fleet/", "/maintenance/", "/blog/"]:
        if route not in sitemap:
            return fail(f"Missing sitemap route {route}")

    print("Build 166 competitor completion check passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
