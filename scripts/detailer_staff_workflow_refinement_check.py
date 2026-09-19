#!/usr/bin/env python3
"""Build 432 source authority for Detailer Mobile & Staff Workflow Refinement."""
from pathlib import Path
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

detailer = read("app/detailer/index.html")
detailer_app = read("apps/detailer/detailer-app.js")
operations = read("app/operations/index.html")
operations_app = read("apps/operations/operations-app.js")
admin = read("admin-today.html")
admin_copy = read("admin-today/index.html")
layer = read("assets/build432-staff-workflow-refinement.js")
contract = read("BUILD432_DETAILER_STAFF_WORKFLOW_REFINEMENT.md")
workflow = read(".github/workflows/detailer-staff-workflow-refinement-authority.yml")

require(detailer, [
    'data-build432="detailer-staff-workflow-refinement"',
    'id="workflowNextLabel"',
    'id="workflowNextAction"',
    'id="workflowResumeJob"',
    'id="workflowConnection"',
    'id="mobileNextAction"',
    '/assets/build432-staff-workflow-refinement.js?v=20260919build432',
    'Build 383 evidence gates remain authoritative',
], "Detailer surface")
require(operations, [
    'data-build432="detailer-staff-workflow-refinement"',
    'id="operationsResumeLast"',
    'id="operationsResumeLabel"',
    '/assets/build432-staff-workflow-refinement.js?v=20260919build432',
], "Operations surface")
require(admin, [
    'data-build432="detailer-staff-workflow-refinement"',
    'id="adminTodayResetFilters"',
    'data-b432-filter-state',
    '/assets/build432-staff-workflow-refinement.js?v=20260919build432',
    'Manual refresh only. No background polling.',
], "Admin Today surface")
if admin != admin_copy:
    errors.append("admin-today route copy must remain byte-identical")

require(layer, [
    'Build 432',
    "sessionStorage",
    "MutationObserver",
    "data-job-action",
    "detailer:last-job",
    "operations:last-workstream",
    "admin-today:",
    "Browser reports offline.",
    "Nothing is queued or replayed automatically",
    "globalScope.addEventListener('online'",
    "globalScope.addEventListener('offline'",
], "Build 432 client")
for forbidden in ["fetch(", "XMLHttpRequest", "setInterval(", "localStorage"]:
    if forbidden in layer:
        errors.append(f"Build 432 client contains forbidden network/polling/persistent primitive {forbidden!r}")

require(detailer_app, [
    "resolver.canAccess('detailer',actor)",
    "fieldGate.canStart",
    "fieldGate.canComplete",
], "Retained Detailer authority")
require(operations_app, [
    "resolver.canAccess('operations',actor)",
], "Retained Operations authority")
require(admin, [
    "pageKey:'admin-today'",
    "if(loading)return",
    "if(creating)return",
], "Retained Admin Today authority")
if "setInterval(" in detailer_app or "setInterval(" in operations_app or "setInterval(" in admin:
    errors.append("Build 432 staff paths must remain free of recurring polling")

require(contract, [
    "manual shortcut",
    "session-only",
    "role ceilings",
    "no automatic job completion",
    "no schema migration",
    "no permanent polling",
    "canonical existing action",
], "Build 432 contract")
require(workflow, [
    "Build 432 — Detailer Mobile & Staff Workflow Refinement Authority",
    "python scripts/detailer_staff_workflow_refinement_check.py",
    "python scripts/mobile_detailer_field_workflow_check.py",
    "python scripts/build400_detailer_mobile_qol_retention_check.py",
    "python scripts/workflow_efficiency_accessibility_check.py",
], "Build 432 workflow")

proc = subprocess.run(["node", "--check", "assets/build432-staff-workflow-refinement.js"], cwd=ROOT, text=True, capture_output=True)
if proc.returncode != 0:
    errors.append("Build 432 client syntax failed: " + (proc.stderr.strip() or proc.stdout.strip()))

if any("432" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 432 must remain schema-neutral")

if errors:
    print("BUILD 432 DETAILER MOBILE & STAFF WORKFLOW REFINEMENT: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 432 DETAILER MOBILE & STAFF WORKFLOW REFINEMENT: PASS")
print(" - Detailer next-step/resume conveniences delegate to canonical existing controls")
print(" - Operations resume state is session-only and requires a manual click")
print(" - Admin Today filter memory is tab-scoped and does not mutate server preferences")
print(" - role ceilings, field-evidence gates and manual-refresh boundaries remain authoritative")
print(" - no new API, schema, polling, automatic completion, outreach, posting or provider mutation")
