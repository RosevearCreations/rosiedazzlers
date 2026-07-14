#!/usr/bin/env python3
"""Current architecture intentionally uses the protected admin bookings route; legacy public list route is not required.

Build 163 guard for booking intake/admin review workflow."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_MARKERS = {
    "functions/api/checkout.js": [
        "insertBookingWithOptionalFields",
        "condition_flags: conditionFlagRows",
        "photo_estimate_status",
        "media_privacy_status",
        "OPTIONAL_BOOKING_INTAKE_FIELDS",
    ],
    "functions/api/admin/bookings.js": [
        "loadBookingsWithOptionalIntakeFields",
        "OPTIONAL_BOOKING_INTAKE_SELECT",
        "plate_privacy_reviewed",
        "blur_crop_complete",
    ],
    "admin-booking.html": [
        "Estimate intake & media consent",
        "bookingIntakeReview",
        "renderBookingIntakeReview",
        "readBookingIntakeReview",
    ],
    "admin-booking/index.html": [
        "Estimate intake & media consent",
        "bookingIntakeReview",
        "renderBookingIntakeReview",
    ],
    "sql/2026-05-21_build163_booking_intake_admin_review.sql": [
        "photo_estimate_status",
        "condition_review_status",
        "media_privacy_status",
        "plate_privacy_reviewed",
        "blur_crop_complete",
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 163",
        "Admin Booking",
        "intake",
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 163",
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
        print("Build 163 booking intake admin review check failed:")
        for item in missing:
            print("-", item)
        return 1

    print("Build 163 booking intake admin review check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
