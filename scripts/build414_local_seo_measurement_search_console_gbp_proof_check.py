#!/usr/bin/env python3
"""Build 414 release contract for local SEO measurement, Search Console and GBP proof."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.is_file():
        errors.append(f"missing required Build 414 file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

doc = read("BUILD414_LOCAL_SEO_MEASUREMENT_SEARCH_CONSOLE_GBP_PROOF.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
roadmap = read("FORWARD_BUILD_ROADMAP_405_415.md")
workflow = read(".github/workflows/local-search-measurement-authority.yml")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")
durable = read("scripts/local_search_measurement_authority_check.py")

require(doc, [
    "first-party observed evidence",
    "provider-dependent",
    "owner-action",
    "Search Console",
    "Google Business Profile",
    "dated operator-observed snapshot",
    "no Google credentials",
    "no schema migration",
    "no automatic provider call",
    "no permanent polling",
    "rankings",
    "indexing",
], "Build 414 contract")

require(queue, [
    "BUILD414_LOCAL_SEO_MEASUREMENT_SEARCH_CONSOLE_GBP_PROOF.md",
], "release queue retained authority")
require(handoff, [
    "BUILD414_LOCAL_SEO_MEASUREMENT_SEARCH_CONSOLE_GBP_PROOF.md",
], "project handoff retained authority")
require(readme, [
    "BUILD414_LOCAL_SEO_MEASUREMENT_SEARCH_CONSOLE_GBP_PROOF.md",
    "scripts/local_search_measurement_authority_check.py",
], "README retained authority")
require(roadmap, [
    "### Build 414 — Local SEO Measurement, Search Console & GBP Proof",
    "### Build 415 — Launch Readiness Consolidation & Next-Roadmap Renewal",
], "retained roadmap")
require(workflow, [
    "Build 414 — Local SEO Measurement, Search Console & GBP Proof",
    "python scripts/local_search_measurement_authority_check.py",
    "python scripts/build414_local_seo_measurement_search_console_gbp_proof_check.py",
], "focused workflow")
for gate, label in [(dev, "Development gate"), (prod, "Production gate")]:
    require(gate, ["python scripts/local_search_measurement_authority_check.py"], label)

if re.search(r"(?i)google.*(client_secret|refresh_token|access_token)", durable):
    errors.append("durable Build 414 authority must reject Google credential material")

if errors:
    print("BUILD 414 LOCAL SEO MEASUREMENT CONTRACT: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 414 LOCAL SEO MEASUREMENT CONTRACT: PASS")
print(" - retained Build 414/415 roadmap and authority pointers remain durable")
print(" - provider evidence remains source-attributed and fail-closed")
print(" - durable local-search measurement authority is wired into Development and Production")
