#!/usr/bin/env python3
"""Build 420 source authority for Search Console, GBP and local acquisition evidence closure."""
from pathlib import Path
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

helper = read("functions/api/_lib/local-acquisition-evidence-closure.js")
endpoint = read("functions/api/admin/local_acquisition_evidence_closure.js")
asset = read("assets/local-search-measurement.js")
page = read("admin-seo-tasks.html")
copy = read("admin-seo-tasks/index.html")
contract = read("BUILD420_SEARCH_CONSOLE_GBP_LOCAL_ACQUISITION_EVIDENCE_CLOSURE.md")
roadmap = read("FORWARD_BUILD_ROADMAP_416_425.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")
focused = read(".github/workflows/local-acquisition-evidence-closure-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")

require(helper, [
    "buildLocalAcquisitionEvidenceClosure",
    "search_console_gbp_local_acquisition_evidence_closure",
    "local_acquisition_evidence_incomplete",
    "provider_dependent",
    "owner_action",
    "unavailable",
    "ranking_inferred: false",
    "indexing_inferred: false",
    "maps_visibility_inferred: false",
    "google_credentials_exposed: false",
    "customer_identity_exposed: false",
    "provider_mutation_performed: false",
], "Build 420 helper")

require(endpoint, [
    'from "./local_search_measurement_report.js"',
    "buildLocalAcquisitionEvidenceClosure",
    "retained_measurement_build: 414",
    "GET,POST,HEAD,OPTIONS",
], "Build 420 endpoint")

require(asset, [
    "/api/admin/local_acquisition_evidence_closure",
    "renderClosure",
    "localAcquisitionClosureOut",
], "Build 420 admin client")

require(page, [
    'data-build420="search-console-gbp-local-acquisition-evidence-closure"',
    "Build 420 · Local acquisition evidence closure",
    'id="localAcquisitionClosureOut"',
    "Source/Production GREEN does not prove Google indexing, rankings or Maps visibility.",
], "Build 420 page")

if page != copy:
    errors.append("admin-seo-tasks route copy is not synchronized")

require(contract, [
    "Search Console evidence",
    "Google Business Profile evidence",
    "First-party acquisition evidence",
    "approved, public, non-sample",
    "provider_dependent",
    "owner_action",
    "unavailable",
    "no schema migration",
    "no Google OAuth flow",
    "no permanent polling",
    "Build 421 — Retention, Maintenance & Fleet Operational Pilot",
], "Build 420 contract")

for text, label in [(queue, "queue"), (handoff, "handoff"), (readme, "README")]:
    require(text, ["BUILD420_SEARCH_CONSOLE_GBP_LOCAL_ACQUISITION_EVIDENCE_CLOSURE.md"], label)

require(roadmap, [
    "Build 420 — Search Console, GBP & Local Acquisition Evidence Closure",
    "Build 421 — Retention, Maintenance & Fleet Operational Pilot",
], "active roadmap")

for gate, label in [(dev, "Development gate"), (prod, "Production gate"), (focused, "focused authority")]:
    require(gate, [
        "local_acquisition_evidence_closure_check.py",
        "local_acquisition_evidence_closure_test.mjs",
    ], label)

require(prod_check, [
    '"local_acquisition_evidence_closure"',
    "scripts/local_acquisition_evidence_closure_check.py",
    "scripts/local_acquisition_evidence_closure_test.mjs",
    "Validate local acquisition evidence closure authority",
], "Production business acceptance source authority")

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
    if forbidden in helper or forbidden in endpoint:
        errors.append(f"Build 420 source contains forbidden provider/polling token: {forbidden}")

for path in [
    "functions/api/_lib/local-acquisition-evidence-closure.js",
    "functions/api/admin/local_acquisition_evidence_closure.js",
    "assets/local-search-measurement.js",
    "scripts/local_acquisition_evidence_closure_test.mjs",
]:
    proc = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

test = subprocess.run(["node", "scripts/local_acquisition_evidence_closure_test.mjs"], cwd=ROOT, text=True, capture_output=True)
if test.returncode != 0:
    errors.append(f"Build 420 closure test failed: {test.stderr.strip() or test.stdout.strip()}")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])420(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 420 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("LOCAL ACQUISITION EVIDENCE CLOSURE AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("LOCAL ACQUISITION EVIDENCE CLOSURE AUTHORITY: PASS")
print(" - Search Console, GBP, first-party traffic and approved local proof remain separately sourced")
print(" - missing/stale/unavailable evidence remains fail-closed")
print(" - rankings, indexing and Maps visibility are never inferred from source/runtime success")
print(" - no Google credentials, provider mutation, schema migration or permanent polling are introduced")
