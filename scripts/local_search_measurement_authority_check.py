#!/usr/bin/env python3
"""Durable authority for source-attributed local-search measurement and provider proof."""

from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

report = read("functions/api/admin/local_search_measurement_report.js")
save = read("functions/api/admin/local_search_provider_evidence_save.js")
page = read("admin-seo-tasks.html")
route_copy = read("admin-seo-tasks/index.html")
asset = read("assets/local-search-measurement.js")
targets_text = read("data/local_seo_targets.json")
seo_h1 = read("scripts/seo_h1_check.py")
seo_meta = read("scripts/seo_metadata_check.py")
proof = read("functions/api/admin/review_proof_local_seo_loop.js")

try:
    targets = json.loads(targets_text)
except Exception:
    targets = {}
    errors.append("data/local_seo_targets.json is not valid JSON")

require(report, [
    'const SETTING_KEY = "local_search_provider_evidence"',
    'const WINDOW_DAYS = 30',
    'const SNAPSHOT_FRESH_DAYS = 45',
    'capability: "manage_staff"',
    'dimension_type=eq.referrer',
    'dimension_type=eq.page_path',
    'limit=1200',
    'limit=2000',
    'classification: "provider_dependent"',
    'classification: "owner_action"',
    'evidence_state: "observed_snapshot"',
    'evidence_state: "stale_observed_snapshot"',
    'Google referral and on-site page-view evidence describes observed Rosie traffic only.',
    'Search Console/GBP success is never inferred from markup',
    'The report is read-only.',
], "Local-search measurement report")

for forbidden in [
    "searchconsole.googleapis.com",
    "mybusiness.googleapis.com",
    "businessprofileperformance.googleapis.com",
    "accounts.google.com/o/oauth",
    "client_secret",
    "refresh_token",
    "access_token",
    "setInterval(",
]:
    if forbidden in report:
        errors.append(f"measurement report contains forbidden provider/polling token: {forbidden}")

require(save, [
    'const SETTING_KEY = "local_search_provider_evidence"',
    'capability: "manage_staff"',
    'new Set(["search_console", "google_business_profile"])',
    'Prefer: "resolution=merge-duplicates,return=representation"',
    'search_console: ["clicks", "impressions", "ctr_percent", "average_position"]',
    'google_business_profile: ["profile_views", "website_clicks", "calls", "direction_requests"]',
    'Saved evidence is a dated operator-observed provider snapshot.',
    'POST required.',
], "Provider evidence save path")

for forbidden in [
    "searchconsole.googleapis.com",
    "mybusiness.googleapis.com",
    "businessprofileperformance.googleapis.com",
    "client_secret",
    "refresh_token",
    "access_token",
]:
    if forbidden in save:
        errors.append(f"provider save path contains forbidden credential/provider token: {forbidden}")

require(page, [
    'data-build414="local-search-measurement-search-console-gbp-proof"',
    '<h1>Search Console, GBP & local proof</h1>',
    'Record Search Console evidence',
    'Record Google Business Profile evidence',
    'Do not paste credentials, tokens or customer data.',
    'id="refreshLocalSearch"',
    'data-provider-evidence-form',
    'id="seoTasksOut"',
    '/assets/local-search-measurement.js',
], "Local-search admin page")
if page != route_copy:
    errors.append("admin-seo-tasks route copy is not synchronized")

require(asset, [
    '/api/admin/local_search_measurement_report',
    '/api/admin/local_search_provider_evidence_save',
    '/api/admin/local_seo_task_cards_list',
    'Observed snapshot',
    'first_party',
    'local_proof',
    'search_console',
    'google_business_profile',
], "Local-search admin client")
if "setInterval(" in asset:
    errors.append("local-search admin client must remain manual-refresh only")

town_slugs = [str(row.get("slug") or "") for row in targets.get("town_pages", []) if row.get("slug")]
service_slugs = [str(row) for row in targets.get("service_pages", []) if row]
for slug in town_slugs + service_slugs:
    if f'"/{slug}"' not in report:
        errors.append(f"measurement report does not cover local SEO target route /{slug}")

require(seo_h1, ["h1"], "Retained one-H1 authority")
require(seo_meta, ["canonical"], "Retained metadata authority")
require(proof, ["approved/public customer_reviews", "Build 365 is read-only"], "Retained local-proof authority")

for path in [
    "functions/api/admin/local_search_measurement_report.js",
    "functions/api/admin/local_search_provider_evidence_save.js",
    "assets/local-search-measurement.js",
]:
    proc = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("LOCAL SEARCH MEASUREMENT AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("LOCAL SEARCH MEASUREMENT AUTHORITY: PASS")
print(" - first-party analytics, approved local proof, Search Console and GBP remain separate evidence sources")
print(" - provider metrics are bounded, dated operator-observed snapshots")
print(" - missing/stale provider evidence remains provider-dependent/owner-action")
print(" - Google credentials/OAuth/provider mutation/background polling are absent")
print(" - current local town/service target routes remain covered")
