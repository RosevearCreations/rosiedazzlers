#!/usr/bin/env python3
"""Build 482 source authority for Staff & Mobile Remediation Execution Evidence Readiness."""
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

helper = read("functions/api/_lib/staff-support-mobile-efficiency-learning.js")
endpoint = read("functions/api/admin/staff_support_mobile_efficiency_learning.js")
page = read("admin-staff-workflow-support-learning.html")
route = read("admin-staff-workflow-support-learning/index.html")
client = read("assets/build452-staff-support-mobile-efficiency-learning.js")
test = read("scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs")
contract = read("BUILD482_STAFF_MOBILE_REMEDIATION_EXECUTION_EVIDENCE_READINESS.md")
roadmap = read("FORWARD_BUILD_ROADMAP_476_485.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow = read(".github/workflows/staff-mobile-remediation-execution-evidence-readiness-authority.yml")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")
retained472 = read("scripts/staff_mobile_remediation_verification_check.py")

if page != route:
    errors.append("Build 482 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("Build 482 learning page must retain exactly one H1")

require(helper, [
    "execution_evidence_readiness_build: 482",
    'execution_evidence_readiness_authority: "staff_mobile_remediation_execution_evidence_readiness"',
    "remediation_execution_evidence_readiness_summary",
    "remediation_execution_evidence_readiness",
    "separately_authorized_execution_record_required",
    "authorization_reference",
    "remediation_change_reference",
    "executed_at",
    "evidence_source_reference",
    "device_browser_context",
    "observation_protocol_reference",
    "material_confounders_recorded",
    '"cold_snap_capable"',
    '"temperature_limited_outdoor"',
    '"controlled_environment_required"',
    "current_pattern_is_not_a_before_measurement: true",
    "counts_as_staff_or_mobile_friction: false",
    "service_temperature_limit_inferred: false",
    "execution_record_readiness_proves_remediation_occurred: false",
    "before_after_template_proves_effectiveness: false",
    "automatic_execution_record_creation_allowed: false",
    "automatic_before_after_conclusion_allowed: false",
    "weather_site_constraint_mutation_allowed: false"
], "Build 482 helper")

require(endpoint, [
    'capability: "manage_bookings"',
    'requireActionAccess(access.actor, "it.runtime.view")',
    "buildStaffSupportMobileEfficiencyLearning",
    "onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete"
], "retained GET-only endpoint")

require(page, [
    'data-build482="staff-mobile-remediation-execution-evidence-readiness"',
    "Build 482 · Staff &amp; Mobile Remediation Execution Evidence Readiness",
    "Staff &amp; Mobile Remediation Execution Evidence Readiness",
    'id="remediationExecutionReadinessList"',
    "Build 472 · Staff &amp; Mobile Remediation Verification",
    "Weather/site restrictions are a separate operational classification",
    "/assets/build452-staff-support-mobile-efficiency-learning.js"
], "Build 482 page")

require(client, [
    "/api/admin/staff_support_mobile_efficiency_learning",
    'method: "GET"',
    "renderExecutionEvidenceReadiness",
    "remediationExecutionReadinessList",
    "Minimum execution record",
    "Before/after comparability",
    "Weather/site classification",
    "Temperature limit inferred:",
    "No background monitoring is running."
], "Build 482 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client:
        errors.append(f"Build 482 client must not contain {forbidden!r}")

require(test, ["BUILD 482 STAFF MOBILE REMEDIATION EXECUTION EVIDENCE READINESS TEST: PASS"], "Build 482 test")
require(contract, [
    "# Build 482 — Staff & Mobile Remediation Execution Evidence Readiness",
    "Minimum attributable remediation-execution record",
    "Materially comparable before/after evidence",
    "Southern Ontario weather/site classification",
    "Build 483 — Service & Add-On Allocation Evidence Closure"
], "Build 482 contract")
require(roadmap, [
    "### Build 482 — Staff & Mobile Remediation Execution Evidence Readiness",
    "Weather/site constraints must remain a separate operational classification",
    "cold-weather service limits are not mislabeled as staff or mobile friction"
], "Build 482 roadmap")
require(queue, [
    "BUILD482_STAFF_MOBILE_REMEDIATION_EXECUTION_EVIDENCE_READINESS.md",
    "**Build 497 — Winter Booking & Quote Rule Activation Readiness** is the active bounded release.",
    "**Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence** is next",
    "it has not run out"
], "retained Build 482 queue")
require(handoff, [
    "BUILD482_STAFF_MOBILE_REMEDIATION_EXECUTION_EVIDENCE_READINESS.md",
    "staff_mobile_remediation_execution_evidence_readiness_check.py",
    "**Build 497 — Winter Booking & Quote Rule Activation Readiness** is the active bounded release."
], "retained Build 482 handoff")
require(readme, [
    "BUILD482_STAFF_MOBILE_REMEDIATION_EXECUTION_EVIDENCE_READINESS.md",
    "staff_mobile_remediation_execution_evidence_readiness_check.py",
    "staff_mobile_remediation_execution_evidence_readiness_test.mjs",
    "Current source direction: **Build 497 — Winter Booking & Quote Rule Activation Readiness**.",
    "Production is not considered GREEN from source promotion alone."
], "retained Build 482 README")
require(blockers, [
    "# Rosie Dazzlers — Current Production HOLD Inventory",
    "A HOLD remains open until dated, attributable evidence"
], "canonical HOLD backlog")
require(workflow, [
    "Build 482 — Staff & Mobile Remediation Execution Evidence Readiness Authority",
    "staff-mobile-remediation-execution-evidence-readiness",
    "staff_mobile_remediation_execution_evidence_readiness_check.py",
    "staff_mobile_remediation_execution_evidence_readiness_test.mjs"
], "Build 482 focused workflow")
for gate, label in ((dev, "Development source gate"), (prod, "Production business acceptance")):
    require(gate, [
        "python -m py_compile scripts/staff_mobile_remediation_execution_evidence_readiness_check.py",
        "node --check scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs",
        "python scripts/staff_mobile_remediation_execution_evidence_readiness_check.py",
        "node scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs"
    ], label)
require(prod_check, [
    '"staff_mobile_remediation_execution_evidence_readiness"',
    "scripts/staff_mobile_remediation_execution_evidence_readiness_check.py",
    "scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs",
    "Validate staff & mobile remediation execution evidence readiness authority"
], "central Production acceptance")
require(retained472, [
    "BUILD472_STAFF_MOBILE_REMEDIATION_VERIFICATION.md",
    "staff_mobile_remediation_verification_test.mjs"
], "retained Build 472 authority")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])482(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 482 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/staff-support-mobile-efficiency-learning.js",
    "functions/api/admin/staff_support_mobile_efficiency_learning.js",
    "assets/build452-staff-support-mobile-efficiency-learning.js",
    "scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs"
]:
    result = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

commands = [
    ["node", "scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs"],
    ["python", "scripts/staff_mobile_remediation_verification_check.py"],
    ["node", "scripts/staff_mobile_remediation_verification_test.mjs"]
]
for command in commands:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 482 STAFF MOBILE REMEDIATION EXECUTION EVIDENCE READINESS AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 482 STAFF MOBILE REMEDIATION EXECUTION EVIDENCE READINESS AUTHORITY: PASS")
print(" - current staff/mobile patterns remain descriptive and are not execution or effectiveness proof")
print(" - separately authorized execution evidence and materially comparable before/after observations are required")
print(" - weather/site constraints remain separate from staff/mobile friction and no service temperature is inferred")
print(" - no automatic remediation, evidence creation, role/business mutation, telemetry or polling is authorized")
