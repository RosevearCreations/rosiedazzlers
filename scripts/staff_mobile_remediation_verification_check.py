#!/usr/bin/env python3
"""Build 472 source authority for Staff & Mobile Remediation Verification."""
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
test = read("scripts/staff_mobile_remediation_verification_test.mjs")
contract = read("BUILD472_STAFF_MOBILE_REMEDIATION_VERIFICATION.md")
roadmap = read("FORWARD_BUILD_ROADMAP_466_475.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")

if page != route:
    errors.append("Build 472 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("Build 472 learning page must retain exactly one H1")

require(helper, [
    "release_enrichment_build: 462",
    'release_authority: "staff_mobile_friction_remediation_priorities"',
    "verification_enrichment_build: 472",
    'verification_authority: "staff_mobile_remediation_verification"',
    "remediation_verification_summary",
    "remediation_verification",
    "current_pattern_observed_no_outcome_attribution",
    "remediation_execution_evidence_present: false",
    "before_after_comparable_evidence_present: false",
    "remediation_outcome_verified: false",
    "current_pattern_proves_remediation_effect: false",
    "remediation_verification_proves_device_friction: false",
    "remediation_verification_proves_business_impact: false",
    "automatic_verification_closure_allowed: false"
], "Build 472 helper")

require(endpoint, [
    'capability: "manage_bookings"',
    'requireActionAccess(access.actor, "it.runtime.view")',
    "getTodayNeedsAttention",
    "getSupportExceptions",
    "getDetailerJobs",
    "buildStaffSupportMobileEfficiencyLearning",
    "onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete"
], "retained endpoint")

require(page, [
    'data-build472="staff-mobile-remediation-verification"',
    "Build 472 · Staff &amp; Mobile Remediation Verification",
    "Staff &amp; Mobile Remediation Verification",
    'id="remediationVerificationList"',
    "Retained Build 462 remediation priorities",
    "comparable before/after evidence",
    "/assets/build452-staff-support-mobile-efficiency-learning.js"
], "Build 472 page")

require(client, [
    "/api/admin/staff_support_mobile_efficiency_learning",
    'method: "GET"',
    "renderVerification",
    "remediationVerificationList",
    "Recorded remediation execution",
    "Comparable before/after evidence",
    "Outcome verified:",
    "No background monitoring is running."
], "Build 472 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client:
        errors.append(f"Build 472 client must not contain {forbidden!r}")

require(test, ["BUILD 472 STAFF MOBILE REMEDIATION VERIFICATION TEST: PASS"], "Build 472 test")
require(contract, [
    "# Build 472 — Staff & Mobile Remediation Verification",
    "Current pattern evidence alone",
    "does not infer that a remediation happened or worked",
    "Build 473 — Service Economics Allocation & Margin Review Readiness"
], "Build 472 contract")
require(roadmap, [
    "### Build 472 — Staff & Mobile Remediation Verification",
    "Do not infer root cause, staff fault, device friction or business impact"
], "renewed roadmap")
require(blockers, ["# Rosie Dazzlers — Current Production HOLD Inventory", "A HOLD remains open until dated, attributable evidence", "Build 462 adds ordered, aggregate remediation priorities"], "canonical HOLD backlog")
require(queue, [
    "**Build 472 — Staff & Mobile Remediation Verification** is the active bounded release.",
    "**Build 473 — Service Economics Allocation & Margin Review Readiness** is next",
    "BUILD472_STAFF_MOBILE_REMEDIATION_VERIFICATION.md"
], "release queue")
require(handoff, [
    "**Build 472 — Staff & Mobile Remediation Verification** is the active bounded release.",
    "BUILD472_STAFF_MOBILE_REMEDIATION_VERIFICATION.md",
    "staff_mobile_remediation_verification_check.py"
], "handoff")
require(readme, [
    "Current source direction: **Build 472 — Staff & Mobile Remediation Verification**.",
    "BUILD472_STAFF_MOBILE_REMEDIATION_VERIFICATION.md",
    "staff_mobile_remediation_verification_check.py",
    "Production is not considered GREEN from source promotion alone."
], "README")
for gate, label in ((dev, "Development gate"), (prod, "Production gate")):
    require(gate, [
        "staff_mobile_remediation_verification_check.py",
        "staff_mobile_remediation_verification_test.mjs"
    ], label)

for path in [
    "functions/api/_lib/staff-support-mobile-efficiency-learning.js",
    "functions/api/admin/staff_support_mobile_efficiency_learning.js",
    "assets/build452-staff-support-mobile-efficiency-learning.js",
    "scripts/staff_mobile_remediation_verification_test.mjs"
]:
    result = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

commands = [
    ["node", "scripts/staff_mobile_remediation_verification_test.mjs"],
    ["python", "scripts/staff_mobile_friction_remediation_priorities_check.py"],
    ["node", "scripts/staff_mobile_friction_remediation_priorities_test.mjs"],
    ["python", "scripts/staff_support_mobile_efficiency_learning_check.py"],
    ["node", "scripts/staff_support_mobile_efficiency_learning_test.mjs"],
    ["python", "scripts/staff_workflow_support_exception_learning_check.py"],
    ["node", "scripts/staff_workflow_support_exception_learning_test.mjs"],
    ["python", "scripts/detailer_staff_workflow_refinement_check.py"],
    ["python", "scripts/support_automation_exception_handling_check.py"],
    ["python", "scripts/build400_detailer_mobile_qol_retention_check.py"],
    ["python", "scripts/mobile_detailer_field_workflow_check.py"]
]
for command in commands:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 472 STAFF MOBILE REMEDIATION VERIFICATION AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 472 STAFF MOBILE REMEDIATION VERIFICATION AUTHORITY: PASS")
print(" - current retained remediation-priority patterns are verified only to the evidence actually present")
print(" - no remediation outcome is claimed without recorded execution and comparable before/after evidence")
print(" - root cause, staff fault, device friction, business impact and causation remain unproven")
print(" - role ceilings, owning workflows, mutation boundaries and canonical HOLD authority remain unchanged")
