#!/usr/bin/env python3
"""Build 162 guard for the booking condition recommender and media-consent path."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_MARKERS = {
    "book.html": [
        "bookingConditionRecommender",
        "data-condition-flag=\"pet_hair\"",
        "data-condition-flag=\"salt_stains\"",
        "data-condition-flag=\"paint_swirls\"",
        "conditionRecommendBtn",
        "photo_estimate_requested",
        "media_consent_preference",
        "booking_condition_recommendation_apply",
    ],
    "book/index.html": [
        "bookingConditionRecommender",
        "conditionRecommendBtn",
        "media_consent_preference",
    ],
    "functions/api/checkout.js": [
        "Customer notes:",
        "Condition helper flags:",
        "Photo estimate requested before final package/add-on confirmation.",
        "Media/photo consent preference:",
    ],
    "checkout.js": [
        "Customer notes:",
        "Condition helper flags:",
        "Media/photo consent preference:",
    ],
    "sql/2026-05-21_build162_booking_condition_recommender_and_consent.sql": [
        "condition_flags",
        "photo_estimate_requested",
        "media_consent_preference",
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 162",
        "condition-based booking helper",
        "media-consent preference",
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 162",
        "photo-estimate",
    ],
}


def main() -> int:
    missing: list[str] = []
    for rel, markers in REQUIRED_MARKERS.items():
        path = ROOT / rel
        if not path.exists():
            missing.append(f"{rel}: file missing")
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in markers:
            if marker not in text:
                missing.append(f"{rel}: missing marker {marker!r}")
    if missing:
        print("Build 162 booking condition recommender check failed:")
        for item in missing:
            print("-", item)
        return 1
    print("Build 162 booking condition recommender check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
