#!/usr/bin/env python3
"""Build 413 source authority: Admin / Detailer / Customer workflow efficiency & accessibility audit."""

from pathlib import Path
import re
import subprocess
import tempfile
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles, label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")


detailer_page = read("app/detailer/index.html")
detailer_js = read("apps/detailer/detailer-app.js")
admin_page = read("admin-today.html")
customer_page = read("my-account.html")
customer_js = read("assets/my-account-v296.js")
responsive = read("assets/build397-responsive-baseline.css")
a11y = read("assets/build376-accessibility.css")
doc = read("BUILD413_WORKFLOW_EFFICIENCY_ACCESSIBILITY_AUDIT.md")
workflow = read(".github/workflows/workflow-efficiency-accessibility-authority.yml")
dev_gate = read(".github/workflows/development-source-gate.yml")
prod_gate = read(".github/workflows/production-business-acceptance-authority.yml")

require(detailer_page, [
    'name="viewport"',
    '/assets/site.css',
    'id="appStatus" class="notice" role="status" aria-live="polite" aria-atomic="true"',
    'id="jobsList" role="region" aria-label="Assigned jobs" aria-live="polite" aria-busy="true"',
    'id="jobSummary" class="mini" role="status" aria-live="polite" aria-atomic="true"',
    'id="runtimeMessage" class="idle-panel" role="status" aria-live="polite" aria-atomic="true"',
    'type="button" data-job-action="accept"',
    'type="button" data-job-action="complete"',
], "Detailer high-frequency surface")

require(detailer_js, [
    "let workspaceLoading=false",
    "function setWorkspaceBusy(busy)",
    "if(workspaceLoading)return",
    "list.setAttribute('aria-busy'",
    "button.disabled=workspaceLoading",
    "finally{",
    "setWorkspaceBusy(false)",
    "box.setAttribute('role',type==='bad'?'alert':'status')",
    "box.focus({preventScroll:true})",
    "resolver.canAccess('detailer',actor)",
], "Detailer interaction logic")
if "setInterval(" in detailer_js:
    errors.append("Detailer Build 413 path must not add recurring polling")

require(admin_page, [
    'id="todayStatus" class="notice" role="status" aria-live="polite" aria-atomic="true"',
    'id="attentionSummary" class="cockpit-grid" role="status" aria-live="polite" aria-busy="true"',
    '<label>Task title<input id="manualTitle"',
    '<label>Urgency<select id="manualUrgency"',
    '<label>Optional due date<input id="manualDueAt"',
    '<label>Optional internal link<input id="manualTarget"',
    '<label>Short safe note<textarea id="manualDetail"',
    'id="urgentList" class="attention-list" aria-live="polite" aria-busy="true"',
    'id="normalList" class="attention-list" aria-live="polite" aria-busy="true"',
    "loading=false,creating=false",
    "function setTodayStatus(message,tone='')",
    "function setQueueBusy(busy)",
    "if(loading)return",
    "if(creating)return",
    "titleField.setAttribute('aria-invalid','true')",
    "titleField.focus()",
    "btn.setAttribute('aria-busy','true')",
    "button.textContent='Adding…'",
    "pageKey:'admin-today'",
], "Admin Today workflow")
if "setInterval(" in admin_page:
    errors.append("Admin Build 413 path must remain manual-refresh only")

require(customer_page, [
    'name="viewport"',
    '/assets/site.css',
    'data-build413="workflow-efficiency-accessibility-audit"',
    'id="accountNotice" class="notice" role="status" aria-live="polite" aria-atomic="true"',
    'id="accountForm" class="form" aria-busy="false"',
    'id="accountSaveBtn"',
    'id="vehicleForm" class="form" aria-busy="false"',
    'id="vehicleSaveBtn"',
    'id="giftCheckForm" class="form" aria-busy="false"',
    'id="giftCheckBtn"',
    'id="giftCheckResult" class="muted" role="status" aria-live="polite" aria-atomic="true"',
    'id="reviewForm" class="form" aria-busy="false"',
    'id="reviewSaveBtn"',
    'id="vehMediaUploadNote" role="status" aria-live="polite"',
], "Customer My Account surface")

require(customer_js, [
    "function setFormBusy(formSelector,buttonSelector,busy,busyLabel,idleLabel)",
    "kind==='bad'?'alert':'status'",
    "el.focus({preventScroll:true})",
    "getAttribute('aria-busy')==='true'",
    "setFormBusy('#accountForm','#accountSaveBtn',true",
    "setFormBusy('#vehicleForm','#vehicleSaveBtn',true",
    "setFormBusy('#giftCheckForm','#giftCheckBtn',true",
    "setFormBusy('#reviewForm','#reviewSaveBtn',true",
    "codeField.setAttribute('aria-invalid','true')",
    "codeField.focus()",
    "catch(error)",
    "credentials:'include'",
], "Customer interaction logic")
if customer_js.count("getAttribute('aria-busy')==='true'") < 4:
    errors.append("Customer forms must independently suppress duplicate in-flight submit actions")

require(responsive, [
    "@media (max-width: 900px)",
    "@media (max-width: 720px)",
    "min-height: 44px",
    "font-size: 16px",
    "overflow-x: auto",
    "prefers-reduced-motion",
], "Retained responsive baseline")
require(a11y, [":focus-visible", "prefers-reduced-motion", "forced-colors"], "Retained accessibility baseline")

policy_needles = [
    "phone", "tablet", "desktop", "keyboard", "focus", "loading", "error", "empty", "retry",
    "interaction cost", "role/capability", "independent authenticated visual browser proof",
    "unavailable", "source-proven", "runtime-proven", "no schema migration", "no permanent polling"
]
for needle in policy_needles:
    if needle.lower() not in doc.lower():
        errors.append(f"Build 413 policy missing {needle!r}")

require(workflow, [
    "Build 413 — Admin / Detailer / Customer Workflow Efficiency & Accessibility Audit",
    "contents: read",
    "node --check apps/detailer/detailer-app.js",
    "node --check assets/my-account-v296.js",
    "python scripts/workflow_efficiency_accessibility_check.py",
], "Focused Build 413 workflow")

for gate, label in [(dev_gate, "Development source gate"), (prod_gate, "Production authority")]:
    require(gate, [
        "python scripts/workflow_efficiency_accessibility_check.py",
    ], label)

# Validate the edited JS files and the Admin page's inline operational script.
for path in ["apps/detailer/detailer-app.js", "assets/my-account-v296.js"]:
    proc = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", admin_page, flags=re.I | re.S)
inline = [block for block in scripts if block.strip()]
if not inline:
    errors.append("Admin Today inline workflow script could not be located")
else:
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as handle:
        handle.write(inline[-1])
        temp_path = handle.name
    proc = subprocess.run(["node", "--check", temp_path], cwd=ROOT, text=True, capture_output=True)
    Path(temp_path).unlink(missing_ok=True)
    if proc.returncode != 0:
        errors.append(f"admin-today inline script syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if any("413" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 413 must remain schema-neutral")

if errors:
    print("BUILD 413 WORKFLOW EFFICIENCY / ACCESSIBILITY AUDIT: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 413 WORKFLOW EFFICIENCY / ACCESSIBILITY AUDIT: PASS")
print(" - Admin, Detailer and Customer high-frequency source workflows are explicitly covered")
print(" - busy/live-region/duplicate-submit/error-focus contracts are source-proven")
print(" - retained phone/tablet/desktop responsive and keyboard/focus baselines remain active")
print(" - role/capability boundaries and manual-refresh/no-polling boundaries are retained")
print(" - independent authenticated visual browser proof remains explicitly unavailable unless separately observed")
print(" - no Build 413 schema migration")
