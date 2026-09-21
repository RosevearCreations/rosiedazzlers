#!/usr/bin/env python3
"""Build 462 source authority for Staff & Mobile Friction Remediation Priorities."""
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
test = read("scripts/staff_mobile_friction_remediation_priorities_test.mjs")
contract = read("BUILD462_STAFF_MOBILE_FRICTION_REMEDIATION_PRIORITIES.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")

if page != route:
    errors.append("Build 462 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("Build 462 learning page must retain exactly one H1")

require(helper, [
    "release_enrichment_build: 462",
    'release_authority: "staff_mobile_friction_remediation_priorities"',
    "remediation_priorities",
    "priority_basis",
    "manual_verification",
    "bounded_current_snapshot_only",
    "remediation_priority_proves_root_cause: false",
    "remediation_priority_proves_staff_fault: false",
    "remediation_priority_proves_business_impact: false",
    "automatic_exception_resolution_authorized: false",
    "automatic_remediation_authorized: false",
    "automatic_remediation_allowed: false",
    "blame_inference_allowed: false"
], "Build 462 helper")

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
    'data-build462="staff-mobile-friction-remediation-priorities"',
    "Build 462 · Staff &amp; Mobile Friction Remediation Priorities",
    "Build 452 · Staff Workflow, Support &amp; Mobile Efficiency Learning",
    'id="remediationPriorityList"',
    'id="refreshEfficiencyLearning452"',
    "/assets/build452-staff-support-mobile-efficiency-learning.js",
    "not a performance score",
    "automatic exception resolution"
], "Build 462 page")

require(client, [
    "/api/admin/staff_support_mobile_efficiency_learning",
    'method: "GET"',
    "renderRemediation",
    "remediationPriorityList",
    "Root cause proven: NO",
    "No background monitoring is running."
], "Build 462 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client:
        errors.append(f"Build 462 client must not contain {forbidden!r}")

require(test, ["BUILD 462 STAFF MOBILE FRICTION REMEDIATION PRIORITIES TEST: PASS"], "Build 462 test")
require(contract, [
    "# Build 462 — Staff & Mobile Friction Remediation Priorities",
    "Priority does **not** prove impact",
    "No automatic:",
    "does not close any provider, recovery, real-device, owner-approval or unavailable-evidence HOLD",
    "Build 463 — Service Economics Completeness & Add-On Cost Readiness"
], "Build 462 contract")
require(blockers, [
    "Build 462",
    "remediation priorities",
    "does not close any HOLD"
], "canonical HOLD backlog")
require(queue, [
    "BUILD462_STAFF_MOBILE_FRICTION_REMEDIATION_PRIORITIES.md",
    "FORWARD_BUILD_ROADMAP_456_465.md",
    "Production deployment/runtime/business acceptance"
], "retained release queue authority")
require(handoff, [
    "BUILD462_STAFF_MOBILE_FRICTION_REMEDIATION_PRIORITIES.md",
    "staff_mobile_friction_remediation_priorities_check.py"
], "handoff")
require(readme, [
    "BUILD462_STAFF_MOBILE_FRICTION_REMEDIATION_PRIORITIES.md",
    "staff_mobile_friction_remediation_priorities_check.py",
    "Production is not considered GREEN from source promotion alone."
], "README")
for gate, label in ((dev, "Development gate"), (prod, "Production gate")):
    require(gate, [
        "staff_mobile_friction_remediation_priorities_check.py",
        "staff_mobile_friction_remediation_priorities_test.mjs"
    ], label)

for path in [
    "functions/api/_lib/staff-support-mobile-efficiency-learning.js",
    "functions/api/admin/staff_support_mobile_efficiency_learning.js",
    "assets/build452-staff-support-mobile-efficiency-learning.js",
    "scripts/staff_mobile_friction_remediation_priorities_test.mjs"
]:
    result = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

commands = [
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
    print("BUILD 462 STAFF MOBILE FRICTION REMEDIATION PRIORITIES AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 462 STAFF MOBILE FRICTION REMEDIATION PRIORITIES AUTHORITY: PASS")
print(" - retained staff/support/mobile evidence is ordered into bounded manual remediation-review priorities")
print(" - priority is review order only, not proof of root cause, staff fault, delay, friction or business impact")
print(" - existing role ceilings and owning workflows remain authoritative")
print(" - automatic remediation, exception resolution, role change, blame inference, mutation and polling remain locked")
