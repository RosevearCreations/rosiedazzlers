#!/usr/bin/env python3
"""Build 431 source authority for Local Acquisition & Content Proof."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.is_file():
        errors.append(f"missing required Build 431 file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper = read("functions/api/_lib/local-acquisition-content-proof.js")
endpoint = read("functions/api/admin/local_acquisition_content_proof.js")
asset = read("assets/local-acquisition-content-proof.js")
page = read("admin-seo-tasks.html")
copy = read("admin-seo-tasks/index.html")
contract = read("BUILD431_LOCAL_ACQUISITION_CONTENT_PROOF.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
focused = read(".github/workflows/local-acquisition-content-proof-authority.yml")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")

require(helper, [
    "build: 431", 'mode: "local_acquisition_content_proof"', "LOCAL_CONTENT_TARGETS",
    "genuine_public_proof_count", "attention_score", "low_view_threshold_is_ranking_benchmark: false",
    "thin_copy_inferred: false", "duplicate_copy_inferred: false", "ranking_outcome_inferred: false",
    "indexing_outcome_inferred: false", "maps_visibility_inferred: false",
    "automatic_content_publishing_allowed: false", "third_party_provider_mutation_allowed: false",
    "fabricated_review_allowed: false", "fabricated_location_content_allowed: false",
    "schema_authority: false", "permanent_polling_allowed: false"
], "Build 431 helper")

require(endpoint, [
    'from "./local_search_measurement_report.js"', "site_activity_dimension_daily_rollups",
    "before_after_gallery", "local_seo_task_cards", "buildLocalAcquisitionContentProof",
    "page_source_truncated_possible", "mutation_authority: false", "onRequestPatch",
    "onRequestDelete", "onRequestPut"
], "Build 431 endpoint")

require(asset, [
    "/api/admin/local_acquisition_content_proof", "DOMParser", 'doc.querySelectorAll("h1").length',
    'link[rel="canonical"]', 'meta[name="description"]', "thin_copy_review", "duplicate_copy_review",
    "Source-copy flags are review heuristics, not ranking signals."
], "Build 431 admin client")

require(page, [
    'data-build431="local-acquisition-content-proof"', "Build 431 · Local Acquisition & Content Proof",
    'id="refreshContentProof"', 'id="localContentProofSummary"', 'id="localContentProofCandidates"',
    "/assets/local-acquisition-content-proof.js"
], "Build 431 page")
if page != copy:
    errors.append("admin-seo-tasks route copy is not synchronized")
if "setInterval(" in asset or "setInterval(" in page:
    errors.append("Build 431 must not introduce permanent polling")

require(contract, [
    "first-party traffic", "genuine local proof", "dated provider evidence", "weak first-party engagement",
    "duplicate or thin service explanations", "gaps between public copy and actual services offered",
    "No search rank", "one meaningful H1", "no fabricated reviews", "No automatic publishing",
    "no DNS change", "no customer outreach", "no ad-spend mutation"
], "Build 431 contract")
require(queue, [
    "**Build 431 — Local Acquisition & Content Proof** is the active bounded release.",
    "**Build 432 — Detailer Mobile & Staff Workflow Refinement** is next only after"
], "release queue")
require(handoff, [
    "**Build 431 — Local Acquisition & Content Proof** is the active bounded release.",
    "**Build 432 — Detailer Mobile & Staff Workflow Refinement** is next only after"
], "project handoff")
require(readme, [
    "Current source direction: **Build 431 — Local Acquisition & Content Proof**.",
    "local_acquisition_content_proof_check.py", "local_acquisition_content_proof_test.mjs"
], "README")

for gate, label in [(focused, "focused authority"), (dev, "Development gate"), (prod, "Production gate")]:
    require(gate, ["local_acquisition_content_proof_check.py", "local_acquisition_content_proof_test.mjs"], label)
require(focused, ["seo_h1_check.py", "seo_metadata_check.py", "local_acquisition_evidence_closure_check.py", "media_photo_studio_proof_operations_check.py"], "focused retained authority")
require(prod_check, [
    '"local_acquisition_content_proof"', "scripts/local_acquisition_content_proof_check.py",
    "scripts/local_acquisition_content_proof_test.mjs", "Validate local acquisition & content proof authority"
], "Production business acceptance source authority")

for forbidden in ["searchconsole.googleapis.com", "mybusiness.googleapis.com", "businessprofileperformance.googleapis.com", "accounts.google.com/o/oauth", "client_secret", "refresh_token", "access_token"]:
    if forbidden in helper or forbidden in endpoint:
        errors.append(f"Build 431 contains forbidden provider credential/API token: {forbidden}")

for path in ["functions/api/_lib/local-acquisition-content-proof.js", "functions/api/admin/local_acquisition_content_proof.js", "assets/local-acquisition-content-proof.js", "scripts/local_acquisition_content_proof_test.mjs"]:
    proc = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

test_run = subprocess.run(["node", "scripts/local_acquisition_content_proof_test.mjs"], cwd=ROOT, text=True, capture_output=True)
if test_run.returncode != 0:
    errors.append(f"Build 431 content proof test failed: {test_run.stderr.strip() or test_run.stdout.strip()}")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])431(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 431 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 431 LOCAL ACQUISITION & CONTENT PROOF AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 431 LOCAL ACQUISITION & CONTENT PROOF AUTHORITY: PASS")
print(" - first-party traffic, genuine public proof and provider evidence stay source-attributed")
print(" - deployed-page copy checks are heuristic review signals, not ranking outcomes")
print(" - sample/private proof and missing provider evidence fail closed")
print(" - no publishing, outreach, provider, DNS, ad-spend, schema or permanent-polling mutation is authorized")
