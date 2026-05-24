#!/usr/bin/env python3
"""Build 164 booking intake review action checks."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "admin-booking.html",
    "admin-booking/index.html",
    "functions/api/admin/booking_update.js",
    "functions/api/booking_update.js",
    "functions/api/admin/bookings.js",
    "functions/api/bookings.js",
    "sql/2026-05-22_build164_booking_intake_review_actions.sql",
]

REQUIRED_MARKERS = {
    "admin-booking.html": [
        "intakeReviewForm",
        "photoEstimateStatus",
        "conditionReviewStatus",
        "mediaPrivacyStatus",
        "platePrivacyReviewed",
        "blurCropComplete",
        "updateBookingIntakeReview",
        "readIntakeReviewFormPayload",
        "Save intake review",
    ],
    "functions/api/admin/booking_update.js": [
        'action === "set_intake_review"',
        "photo_estimate_status",
        "condition_review_status",
        "media_privacy_status",
        "intake_review_note",
        "intake_reviewed_at",
        "appendIntakeReviewFallbackNote",
        "looksLikeMissingOptionalIntakeColumn",
    ],
    "functions/api/booking_update.js": [
        'action === "set_intake_review"',
        "intake_review_note",
        "appendIntakeReviewFallbackNote",
    ],
    "functions/api/admin/bookings.js": [
        "intake_review_note",
        "intake_reviewed_at",
        "intake_reviewed_by",
    ],
    "sql/2026-05-22_build164_booking_intake_review_actions.sql": [
        "add column if not exists intake_review_note",
        "add column if not exists intake_reviewed_at",
        "add column if not exists intake_reviewed_by",
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 164",
        "Admin booking intake review actions",
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 164",
        "Apply the Build 164 migration",
    ],
}


def fail(message: str) -> int:
    print(f"FAIL: {message}")
    return 1


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8", errors="ignore")


def main() -> int:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            return fail(f"Missing required file: {rel}")

    for rel, markers in REQUIRED_MARKERS.items():
        text = read(rel)
        for marker in markers:
            if marker not in text:
                return fail(f"Missing marker {marker!r} in {rel}")

    root_import_bad = []
    for path in (ROOT / "functions" / "api").glob("*.js"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        if 'from "../_lib/' in text or "from '../_lib/" in text:
            root_import_bad.append(path.relative_to(ROOT).as_posix())
    if root_import_bad:
        return fail("Root API files still contain ../_lib imports: " + ", ".join(root_import_bad[:10]))

    print("Build 164 booking intake review action check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
