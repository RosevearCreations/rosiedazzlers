#!/usr/bin/env python3
from __future__ import annotations
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MATCHES = ROOT / "data" / "amazon_catalog_matches.json"
ENRICH = ROOT / "data" / "amazon_inventory_enrichment_preview.json"
REVIEW = ROOT / "data" / "amazon_inventory_match_review.csv"

def main() -> None:
    if not MATCHES.exists() or not ENRICH.exists() or not REVIEW.exists():
        raise SystemExit("Amazon match outputs are missing. Run scripts/amazon_catalog_match.py with the private CSV.")
    payload = json.loads(MATCHES.read_text(encoding="utf-8"))
    matches = payload.get("matches") or []
    summary = payload.get("summary") or {}
    if len(matches) < 100:
        raise SystemExit(f"Expected a full catalog match set, found only {len(matches)} rows")
    counts = summary.get("status_counts") or {}
    if not counts.get("strong"):
        raise SystemExit("No strong Amazon matches were generated; check matching thresholds or CSV input")
    if not counts.get("review"):
        raise SystemExit("No review Amazon matches were generated; review queue looks suspiciously empty")
    # Privacy guard: generated public/static files must not carry obvious private payment/account fields.
    raw = MATCHES.read_text(encoding="utf-8").lower() + ENRICH.read_text(encoding="utf-8").lower()
    forbidden = ["account_user_email", "payment_reference_id", "payment_identifier", "receiver_email", "seller_address", "Account user email", "Payment Reference ID", "Payment Identifier", "Receiver email", "Seller Address"]
    for term in forbidden:
        if term in raw:
            raise SystemExit(f"Amazon match output contains private CSV field name: {term}")
    print(f"PASS: Amazon match outputs present · {len(matches)} rows · {counts}")

if __name__ == "__main__":
    main()
