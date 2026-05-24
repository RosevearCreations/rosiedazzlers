#!/usr/bin/env python3
"""Build 161 conversion-path guard.

Checks that the public booking/contact service-chooser and photo-estimate markers
stay present while the competitor roadmap is being implemented.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_MARKERS = {
    "book.html": [
        "bookingServiceChooser",
        'data-package-suggest="complete_detail"',
        "Photo estimate checklist",
        "booking_package_recommendation_click",
    ],
    "contact.html": [
        "Send photos before we recommend a package",
        "Email photo estimate",
    ],
    "services.html": [
        "service-decision-guide",
        "Full Detail alias note",
    ],
}

PACKAGE_FIELDS = [
    "display_alias",
    "customer_goal",
    "best_for",
    "recommendation_tags",
]

def main() -> int:
    missing = []
    for rel, markers in REQUIRED_MARKERS.items():
        text = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
        for marker in markers:
            if marker not in text:
                missing.append(f"{rel}: missing {marker}")

    data = json.loads((ROOT / "data/rosie_services_pricing_and_packages.json").read_text(encoding="utf-8"))
    for pkg in data.get("packages", []):
        for field in PACKAGE_FIELDS:
            if not pkg.get(field):
                missing.append(f"package {pkg.get('code')}: missing {field}")

    if missing:
        print("Conversion path check failed:")
        for item in missing:
            print("-", item)
        return 1
    print("Conversion path check passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
