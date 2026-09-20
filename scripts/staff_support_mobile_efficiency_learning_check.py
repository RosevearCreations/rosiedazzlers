#!/usr/bin/env python3
"""Build 452 source authority for Staff Workflow, Support & Mobile Efficiency Learning."""
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

helper = read("functions/api/_lib/staff-support-mobile-efficiency-learning.js")
endpoint = read("functions/api/admin/staff_support_mobile_efficiency_learning.js")
page = read("admin-staff-workflow-support-learning.html")
route = read("admin-staff-workflow-support-learning/index.html")
client = read("assets/build452-staff-support-mobile-efficiency-learning.js")
test = read("scripts/staff_support_mobile_efficiency_learning_test.mjs")
contract = read("BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")

if page != route:
    errors.append("Build 452 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("Build 452 learning page must retain exactly one H1")

require(helper, [
    "build: 452",
    'authority: "staff_support_mobile_efficiency_learning"',
    "mobile_field_workflow",
    "stage_cohorts",
    "response_counts",
    "repeated_stage_proves_mobile_friction: false",
    "stage_count_proves_delay: false",
    "pending_response_proves_refusal: false",
    "automatic_job_action_allowed: false",
    "automatic_exception_resolution_allowed: false",
    "role_ceiling_change_allowed: false",
    "background_telemetry_added: false",
    "permanent_polling_allowed: false",
    "raw_booking_ids_exposed: false"
], "Build 452 helper")

require(endpoint, [
    'capability: "manage_bookings"',
    'requireActionAccess(access.actor, "it.runtime.view")',
    "getTodayNeedsAttention",
    "getSupportExceptions",
    "getDetailerJobs",
    '"scope", "workspace"',
    "buildStaffSupportMobileEfficiencyLearning",
    "onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete"
], "Build 452 endpoint")
for forbidden in ("customer_name", "customer_email", "booking_id", "exception_id", "setInterval("):
    if forbidden in endpoint:
        errors.append(f"Build 452 endpoint contains forbidden identity/polling token {forbidden!r}")

require(page, [
    'data-build452="staff-support-mobile-efficiency-learning"',
    'data-build442="staff-workflow-support-exception-learning"',
    "Build 452 · Staff Workflow, Support &amp; Mobile Efficiency Learning",
    "Staff Workflow, Support &amp; Mobile Efficiency Learning",
    'id="refreshEfficiencyLearning452"',
    'id="mobileGrid"',
    "/assets/build452-staff-support-mobile-efficiency-learning.js",
    "No role escalation",
    "does not prove a shared root cause"
], "Build 452 page")

require(client, [
    "/api/admin/staff_support_mobile_efficiency_learning",
    'method: "GET"',
    "No background monitoring is running."
], "Build 452 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client:
        errors.append(f"Build 452 client must not contain {forbidden!r}")

require(test, ["BUILD 452 STAFF SUPPORT MOBILE EFFICIENCY LEARNING TEST: PASS"], "Build 452 test")
require(contract, [
    "# Build 452 — Staff Workflow, Support & Mobile Efficiency Learning",
    "bounded Detailer workspace",
    "does not prove mobile friction",
    "No automatic:",
    "Build 453 — Service Economics, Capacity & Pricing Review"
], "Build 452 contract")
require(blockers, ["Build 452", "staff/mobile efficiency-review", "does not close any HOLD"], "canonical HOLD backlog")
require(queue, [
    "BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md",
    "BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md",
    "FORWARD_BUILD_ROADMAP_446_455.md"
], "release queue")
require(handoff, [
    "BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md",
    "BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md",
    "staff_support_mobile_efficiency_learning_check.py"
], "handoff")
require(readme, [
    "BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md",
    "BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md",
    "staff_support_mobile_efficiency_learning_check.py",
    "**Build 453 — Service Economics, Capacity & Pricing Review**"
], "README")
for gate, label in ((dev, "Development gate"), (prod, "Production gate")):
    require(gate, ["staff_support_mobile_efficiency_learning_check.py", "staff_support_mobile_efficiency_learning_test.mjs"], label)

for path in [
    "functions/api/_lib/staff-support-mobile-efficiency-learning.js",
    "functions/api/admin/staff_support_mobile_efficiency_learning.js",
    "assets/build452-staff-support-mobile-efficiency-learning.js",
    "scripts/staff_support_mobile_efficiency_learning_test.mjs"
]:
    result = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

commands = [
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
    print("BUILD 452 STAFF SUPPORT MOBILE EFFICIENCY LEARNING AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 452 STAFF SUPPORT MOBILE EFFICIENCY LEARNING AUTHORITY: PASS")
print(" - retained staff/support learning is enriched with bounded Detailer workspace cohorts")
print(" - repeated stage/pending-response evidence remains a review prompt, not root-cause, delay or mobile-friction proof")
print(" - no identity, role escalation, automatic job/exception action, telemetry, mutation or polling")
