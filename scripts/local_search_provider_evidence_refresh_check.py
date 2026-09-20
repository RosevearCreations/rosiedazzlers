#!/usr/bin/env python3
"""Build 440 Local Search Provider Evidence Refresh source authority."""
from pathlib import Path
import re, subprocess, sys

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

helper = read("functions/api/_lib/local-search-provider-evidence-refresh.js")
endpoint = read("functions/api/admin/local_search_provider_evidence_refresh.js")
client = read("assets/build440-local-search-provider-evidence-refresh.js")
page = read("admin-seo-tasks.html")
copy = read("admin-seo-tasks/index.html")
contract = read("BUILD440_LOCAL_SEARCH_PROVIDER_EVIDENCE_REFRESH.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
retained439 = read("scripts/maintenance_fleet_owner_approval_convergence_check.py")

require(helper, [
    "buildLocalSearchProviderEvidenceRefresh",
    "provider_dependent",
    "owner_action",
    "first_party_window_overlap",
    "google_provider_contact_performed: false",
    "provider_snapshot_write_performed: false",
    "ranking_outcome_inferred: false",
    "indexing_outcome_inferred: false",
    "maps_visibility_inferred: false",
    "permanent_polling: false"
], "Build 440 helper")

require(endpoint, [
    "getMeasurementReport",
    "buildLocalSearchProviderEvidenceRefresh",
    "local_search_provider_evidence_refresh",
    "GET,HEAD,OPTIONS"
], "Build 440 endpoint")

for token in ["onRequestPost", "onRequestPatch", "onRequestDelete", "onRequestPut", "setInterval("]:
    if token in endpoint:
        errors.append(f"Build 440 endpoint contains forbidden token {token!r}")

require(client, [
    'fetch("/api/admin/local_search_provider_evidence_refresh"',
    'method: "GET"',
    'refreshProviderEvidence440',
    "No Google/provider write was performed.",
    "first_party_window_overlap"
], "Build 440 client")

for token in ['method: "POST"', 'method: "PATCH"', 'method: "DELETE"', 'method: "PUT"', "localStorage", "sessionStorage", "setInterval("]:
    if token in client:
        errors.append(f"Build 440 client contains forbidden token {token!r}")

require(page, [
    'data-build440="local-search-provider-evidence-refresh"',
    'id="refreshProviderEvidence440"',
    'id="providerRefreshSummary440"',
    'id="providerRefreshRows440"',
    'id="providerReconciliation440"',
    '/assets/build440-local-search-provider-evidence-refresh.js'
], "Build 440 page")

if page != copy:
    errors.append("admin-seo-tasks route copies must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("admin-seo-tasks must retain exactly one H1")

require(contract, [
    "# Build 440 — Local Search Provider Evidence Refresh",
    "/api/admin/local_search_provider_evidence_refresh",
    "provider_dependent",
    "owner_action",
    "first-party",
    "approved local proof",
    "Build 441 — Booking, Quote & Retention Production Learning"
], "Build 440 contract")

require(queue, [
    "BUILD440_LOCAL_SEARCH_PROVIDER_EVIDENCE_REFRESH.md",
], "release queue retained authority")
require(handoff, [
    "BUILD440_LOCAL_SEARCH_PROVIDER_EVIDENCE_REFRESH.md",
    ".github/workflows/local-search-provider-evidence-refresh-authority.yml",
    "scripts/local_search_provider_evidence_refresh_check.py"
], "project handoff retained authority")
require(readme, [
    "BUILD440_LOCAL_SEARCH_PROVIDER_EVIDENCE_REFRESH.md",
    "scripts/local_search_provider_evidence_refresh_check.py",
    "scripts/local_search_measurement_authority_check.py"
], "README retained authority")

require(retained439, [
    "BUILD439_MAINTENANCE_FLEET_OWNER_APPROVAL_CONVERGENCE.md",
    "release queue retained authority",
    "project handoff retained authority"
], "retained Build 439 authority")

for path in [
    "functions/api/_lib/local-search-provider-evidence-refresh.js",
    "functions/api/admin/local_search_provider_evidence_refresh.js",
    "assets/build440-local-search-provider-evidence-refresh.js",
    "scripts/local_search_provider_evidence_refresh_test.mjs"
]:
    result = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

for cmd in [
    ["node", "scripts/local_search_provider_evidence_refresh_test.mjs"],
    ["python", "scripts/build414_local_seo_measurement_search_console_gbp_proof_check.py"],
    ["python", "scripts/local_acquisition_evidence_closure_check.py"],
    ["python", "scripts/local_acquisition_content_proof_check.py"]
]:
    result = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"retained authority failed: {' '.join(cmd)}: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("LOCAL SEARCH PROVIDER EVIDENCE REFRESH AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("LOCAL SEARCH PROVIDER EVIDENCE REFRESH AUTHORITY: PASS")
print(" - dated Search Console / GBP identity and freshness remain explicit")
print(" - first-party traffic and approved local proof are reconciled without ranking inference")
print(" - provider refresh is manual/read-only; no Google/provider write or permanent polling")
