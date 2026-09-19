#!/usr/bin/env python3
"""Build 433 source authority for Support Automation & Exception Handling."""
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

page = read("admin-support-exceptions.html")
route_page = read("admin-support-exceptions/index.html")
client = read("assets/build433-support-exceptions.js")
endpoint = read("functions/api/admin/support_exceptions.js")
auth = read("assets/admin-auth.js")
nav = read("assets/app-core/module-navigation.js")
contract = read("BUILD433_SUPPORT_AUTOMATION_EXCEPTION_HANDLING.md")
readme = read("README.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")

if page != route_page:
    errors.append("support-exception .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, flags=re.I)) != 1:
    errors.append("support exception page must contain exactly one H1")

require(page, [
    'data-build433="support-automation-exception-handling"',
    'id="refreshSupportExceptions"',
    'id="exceptionQueue"',
    'id="exceptionSummary"',
    'id="sourceStatus"',
    'id="evidenceSurfaces"',
    'Fail-closed automation boundary',
    '/assets/build433-support-exceptions.js'
], "support exception page")

require(client, [
    'pageKey: "admin-support-exceptions"',
    'fetch("/api/admin/support_exceptions"',
    'method: "GET"',
    'refreshSupportExceptions',
    'severityFilter',
    'dependencyFilter',
    'No automatic refresh is running.'
], "support exception client")

for forbidden in ["setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"']:
    if forbidden in client:
        errors.append(f"support exception client must not contain {forbidden!r}")

require(endpoint, [
    'Build 433 — Support Automation & Exception Handling',
    'requireActionAccess(access.actor, "it.runtime.view")',
    'getSupportDiagnostics',
    'getPaymentReconciliation',
    'PAYMENT_LIMIT = 5',
    'manual_refresh_only: true',
    'permanent_polling: false',
    'provider_mutation_allowed: false',
    'business_mutation_allowed: false',
    'customer_records_included: false',
    'secret_values_included: false',
    'evidence_surfaces',
    'safe_next_action',
    'provider_dependent',
    'owner_action'
], "support exception endpoint")

for forbidden in ["onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete", "customer_name", "customer_email", "request_id:", "booking_id:"]:
    if forbidden in endpoint:
        errors.append(f"support exception endpoint must not expose or implement {forbidden!r}")

require(auth, ['case "admin-support-exceptions"'], "admin auth route ceiling")
require(nav, [
    '"/admin-support-exceptions.html"',
    '"page_key":"admin-support-exceptions"',
    '"label":"Support Exceptions"'
], "module navigation")

require(contract, [
    "# Build 433 — Support Automation & Exception Handling",
    "manual refresh",
    "payment reconciliation",
    "provider_dependent",
    "owner_action",
    "Build 434 — Reliability, Security & Cost Reassessment"
], "Build 433 contract")
require(readme, [
    "BUILD433_SUPPORT_AUTOMATION_EXCEPTION_HANDLING.md"
], "README retained Build 433 authority")
require(queue, [
    "BUILD433_SUPPORT_AUTOMATION_EXCEPTION_HANDLING.md"
], "release queue retained Build 433 authority")
require(handoff, [
    "BUILD433_SUPPORT_AUTOMATION_EXCEPTION_HANDLING.md",
    ".github/workflows/support-automation-exception-handling-authority.yml"
], "handoff retained Build 433 authority")

if endpoint.count("new Request(") > 1:
    errors.append("Build 433 endpoint should create at most one bounded derived request")

if errors:
    print("Build 433 Support Automation & Exception Handling authority: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

for script in [
    "scripts/production_support_diagnostics_check.py",
    "scripts/payment_reconciliation_check.py",
]:
    result = subprocess.run([sys.executable, str(ROOT / script)], cwd=ROOT)
    if result.returncode:
        sys.exit(result.returncode)

print("Build 433 Support Automation & Exception Handling authority: PASS")
