#!/usr/bin/env python3
"""Synchronize root HTML pages with matching folder index.html route copies.

Build 201 uses this as a packaging/release helper so Cloudflare Pages can serve
/admin-app and /admin-app.html from identical files without manual copy drift.
"""
from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Keep this list tight: root admin pages are the ones most often edited in build passes.
ROUTE_COPY_PAGES = [
    "admin.html",
    "admin-app.html",
    "admin-site-settings.html",
    "admin-integrations.html",
    "admin-recovery.html",
    "admin-water-rules.html",
    "admin-social.html",
    "admin-booking.html",
    "admin-staff.html",
    "admin-assign.html",
    "admin-leads.html",
    "admin-catalog.html",
    "admin-incident-reports.html",
    "admin-marketing.html",
    "admin-sanity.html",
    "admin-quotes.html",
    "admin-followup-workload.html",
    "admin-growth.html",
    "admin-gallery.html",
    "admin-customers.html",
    "admin-docs.html",
    "admin-ui-health.html",
    "admin-daip-intake-dry-run.html",
    "admin-daip-media.html",
    "admin-creative-projects.html",
    "admin-startup-guide.html",
    "admin-launch-readiness.html",
    "admin-inventory-manager.html",
    "admin-inventory-posting.html",
    "admin-roadmap-execution.html",
    "admin-workflow.html",
    "admin-today.html",
    "admin-production.html",
    "admin-test-centre.html",
    "admin-security.html",
    "admin-media-health.html",
    "admin-photo-studio.html",
    "admin-daip.html",
    "admin-daip-governance.html",
    "admin-daip-readiness.html",
    "admin-daip-design.html",
    "admin-daip-gate-c.html",
    "admin-progress.html",
    "detailer-jobs.html",
    "progress.html",
    "final-balance-payment.html",
    "gift-certificate-print.html",
    "gifts.html",
    "services.html",
    "pricing.html",
    "gift-cards.html",
    "book.html",
    "contact.html",
    "faq.html",
    "login.html",
    "gallery.html",
]


def route_dir_for(page: str) -> Path:
    stem = page[:-5] if page.endswith(".html") else page
    return ROOT / stem


def sync_route_copies(check_only: bool = False) -> list[str]:
    changed: list[str] = []
    for page in ROUTE_COPY_PAGES:
        source = ROOT / page
        if not source.exists():
            continue
        target_dir = route_dir_for(page)
        target = target_dir / "index.html"
        if not target_dir.exists():
            continue
        src_text = source.read_text(encoding="utf-8")
        dst_text = target.read_text(encoding="utf-8") if target.exists() else ""
        if src_text != dst_text:
            changed.append(f"{page} -> {target.relative_to(ROOT)}")
            if not check_only:
                target.write_text(src_text, encoding="utf-8")
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if a route copy differs")
    parser.add_argument("--only", metavar="PAGE", help="synchronize just the named HTML page")
    args = parser.parse_args()
    if args.only:
        if args.only not in ROUTE_COPY_PAGES:
            parser.error(f"--only must be one of: {', '.join(ROUTE_COPY_PAGES)}")
        source = ROOT / args.only
        target = route_dir_for(args.only) / "index.html"
        changed = [f"{args.only} -> {target.relative_to(ROOT)}"] if source.exists() and target.exists() and source.read_bytes() != target.read_bytes() else []
        if changed and not args.check:
            target.write_bytes(source.read_bytes())
    else:
        changed = sync_route_copies(check_only=args.check)
    if args.check and changed:
        print("Route-copy drift found:")
        for row in changed:
            print(f"- {row}")
        return 1
    if changed:
        print("Synchronized route copies:")
        for row in changed:
            print(f"- {row}")
    else:
        print("Route copies already synchronized.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
