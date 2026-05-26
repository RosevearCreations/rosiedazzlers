#!/usr/bin/env python3
"""Build 178 guard: status saving, price review saving, public content rendering, privacy badges, and proof recommendations."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "admin-conversions.html": ["data-build178=\"status-price-review-save\"", "lead_conversion_status_save", "lead_conversion_price_review_save", "Save price review", "Save status"],
    "admin-conversions/index.html": ["data-build178=\"status-price-review-save\"", "lead_conversion_status_save", "lead_conversion_price_review_save"],
    "functions/api/admin/lead_conversion_status_save.js": ["Build 178", "ALLOWED_STATUS", "lead_conversion_drafts"],
    "functions/api/admin/lead_conversion_price_review_save.js": ["Build 178", "final_price_review", "final_price_status", "final_price_reviewed_at"],
    "functions/api/admin/lead_conversion_drafts_list.js": ["Build 178", "final_price_review", "final_price_status"],
    "functions/api/admin/local_seo_proof_report.js": ["Build 178", "proof_recommendations", "buildProofRecommendations"],
    "assets/public-content-blocks.js": ["Build 178", "data-content-blocks", "public_content_blocks"],
    "index.html": ["data-build178=\"public-content-blocks\"", "public-content-blocks.js"],
    "services.html": ["data-build178=\"public-content-blocks\"", "public-content-blocks.js"],
    "specials.html": ["data-build178=\"public-content-blocks\"", "public-content-blocks.js"],
    "fleet.html": ["data-build178=\"public-content-blocks\"", "public-content-blocks.js"],
    "maintenance.html": ["data-build178=\"public-content-blocks\"", "public-content-blocks.js"],
    "blog.html": ["data-build178=\"public-content-blocks\"", "public-content-blocks.js"],
    "admin-social.html": ["data-build178=\"social-privacy-readiness-badges\"", "socialPrivacyBox", "media_privacy_review_summary", "Media privacy not fully approved"],
    "admin-app.html": ["data-build178=\"admin-publish-privacy-badges\""],
    "sql/2026-05-25_build178_conversion_status_price_content_privacy_no_ddl_note.sql": ["Build 178", "No new DDL", "lead_conversion_status_save"],
    "SUPABASE_SCHEMA.sql": ["Build 178 note", "lead_conversion_price_review_save"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 178", "saved price review"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 178 update", "status update endpoint", "public content blocks"],
}

def fail(msg: str) -> int:
    print(f"Build 178 check failed: {msg}")
    return 1

def main() -> int:
    for rel, markers in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            return fail(f"missing {rel}")
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in markers:
            if marker not in text:
                return fail(f"{rel} missing marker {marker!r}")
    print("Build 178 status/price/content/privacy guard passed.")
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
