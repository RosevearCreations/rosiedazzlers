#!/usr/bin/env python3
"""Build 442 source authority for Staff Workflow & Support Exception Learning."""
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

helper = read("functions/api/_lib/staff-workflow-support-exception-learning.js")
endpoint = read("functions/api/admin/staff_workflow_support_exception_learning.js")
page = read("admin-staff-workflow-support-learning.html")
route = read("admin-staff-workflow-support-learning/index.html")
client = read("assets/build442-staff-workflow-support-learning.js")
test = read("scripts/staff_workflow_support_exception_learning_test.mjs")
contract = read("BUILD442_STAFF_WORKFLOW_SUPPORT_EXCEPTION_LEARNING.md")
readme = read("README.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
auth = read("assets/admin-auth.js")
nav = read("assets/app-core/module-navigation.js")
retained_441 = read("scripts/booking_quote_retention_production_learning_check.py")

if page != route:
    errors.append("Build 442 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, flags=re.I)) != 1:
    errors.append("Build 442 page must contain exactly one H1")

require(helper, [
    "build: 442",
    'mode: "staff_workflow_support_exception_learning"',
    "repeated_task_patterns",
    "repeated_exception_patterns",
    "root_cause_proven: false",
    "root_cause_inference_allowed: false",
    "role_ceiling_change_allowed: false",
    "automatic_completion_allowed: false",
    "automatic_exception_correction_allowed: false",
    "silent_posting_allowed: false",
    "automatic_outreach_allowed: false",
    "provider_transaction_allowed: false",
    "permanent_polling_allowed: false",
    "customer_identity_exposed: false",
    "raw_booking_ids_exposed: false",
    "raw_exception_ids_exposed: false"
], "Build 442 helper")

require(endpoint, [
    '"manage_bookings"',
    'requireActionAccess(access.actor, "it.runtime.view")',
    "getTodayNeedsAttention",
    "getSupportExceptions",
    "buildStaffWorkflowSupportExceptionLearning",
    "onRequestPost",
    "onRequestPut",
    "onRequestPatch",
    "onRequestDelete"
], "Build 442 endpoint")

require(page, [
    'data-build442="staff-workflow-support-exception-learning"',
    "Staff Workflow &amp; Support Exception Learning",
    "does not prove a shared root cause",
    "No role escalation",
    'id="refreshLearning"',
    "/assets/build442-staff-workflow-support-learning.js"
], "Build 442 page")

require(client, [
    "/api/admin/staff_workflow_support_exception_learning",
    'method: "GET"',
    "No automatic correction or polling is running."
], "Build 442 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client:
        errors.append(f"Build 442 client must not contain {forbidden!r}")

for forbidden in ("customer_name", "customer_email", "booking_id:", "exception_id:"):
    if forbidden in helper:
        errors.append(f"Build 442 helper must not expose {forbidden!r}")

require(test, ["BUILD 442 STAFF WORKFLOW SUPPORT EXCEPTION LEARNING TEST: PASS"], "Build 442 test")
require(contract, [
    "# Build 442 — Staff Workflow & Support Exception Learning",
    "Today Needs Attention",
    "Support Exceptions",
    "does not prove root cause",
    "No role escalation",
    "Build 443 — Service Economics & Commercial Capacity Review"
], "Build 442 contract")
require(readme, [
    "BUILD442_STAFF_WORKFLOW_SUPPORT_EXCEPTION_LEARNING.md",
    "scripts/staff_workflow_support_exception_learning_check.py"
], "README retained authority")
require(queue, [
    "BUILD442_STAFF_WORKFLOW_SUPPORT_EXCEPTION_LEARNING.md"
], "release queue retained authority")
require(handoff, [
    "BUILD442_STAFF_WORKFLOW_SUPPORT_EXCEPTION_LEARNING.md"
], "handoff retained authority")
require(auth, ['case "admin-staff-workflow-support-learning"'], "admin route ceiling")
require(nav, [
    '"/admin-staff-workflow-support-learning.html"',
    '"page_key":"admin-staff-workflow-support-learning"',
    '"label":"Staff Workflow Learning"'
], "module navigation")
require(retained_441, [
    'BUILD441_BOOKING_QUOTE_RETENTION_PRODUCTION_LEARNING.md',
    'booking-quote-retention-production-learning-authority.yml',
    'booking_quote_retention_production_learning_check.py'
], "durable Build 441 checker")

commands = [
    ["node", "--check", "functions/api/_lib/staff-workflow-support-exception-learning.js"],
    ["node", "--check", "functions/api/admin/staff_workflow_support_exception_learning.js"],
    ["node", "--check", "assets/build442-staff-workflow-support-learning.js"],
    ["node", "scripts/staff_workflow_support_exception_learning_test.mjs"]
]
for command in commands:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{' '.join(command)} failed: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 442 STAFF WORKFLOW SUPPORT EXCEPTION LEARNING AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 442 STAFF WORKFLOW SUPPORT EXCEPTION LEARNING AUTHORITY: PASS")
print(" - repeated staff/support patterns are aggregate and read-only")
print(" - repetition remains a learning signal, not root-cause proof")
print(" - role ceilings and canonical owning workflows remain authoritative")
print(" - automatic correction, completion, posting, outreach, provider transactions and polling remain locked")
