#!/usr/bin/env python3
"""Build 208 connected workflow command-center guard."""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "admin-workflow.html",
    "admin-workflow/index.html",
    "functions/api/admin/workflow_command_center_report.js",
    "data/workflow_connection_build208.json",
    "sql/2026-06-14_build208_connected_workflow_command_center_no_ddl_note.sql",
]
for rel in REQUIRED:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"Missing Build 208 file: {rel}")
workflow = json.loads((ROOT / "data/workflow_connection_build208.json").read_text(encoding="utf-8"))
stages = workflow.get("workflow_stages") or []
expected = ["lead_quote", "booking", "proof_work", "invoice_payment", "review_proof", "repeat_maintenance"]
actual = [stage.get("key") for stage in stages]
if actual != expected:
    raise SystemExit(f"Build 208 workflow stages mismatch: {actual}")
page = (ROOT / "admin-workflow.html").read_text(encoding="utf-8")
for needle in ["Workflow command center", "/api/admin/workflow_command_center_report", "data-build208", "Lead / quote", "review", "maintenance"]:
    if needle not in page:
        raise SystemExit(f"admin-workflow.html missing {needle}")
api = (ROOT / "functions/api/admin/workflow_command_center_report.js").read_text(encoding="utf-8")
for needle in ["quote_pipeline_items", "meta_ads_roi_reports", "proof_of_work_checklists", "customer_maintenance_plans", "fallback_active"]:
    if needle not in api:
        raise SystemExit(f"workflow report API missing {needle}")
admin = (ROOT / "admin.html").read_text(encoding="utf-8")
for needle in ["workflowCommandDiagnostics", "Open Workflow", "loadWorkflowCommandDiagnostics"]:
    if needle not in admin:
        raise SystemExit(f"admin dashboard missing {needle}")
visual = json.loads((ROOT / "data/visual_placeholder_registry.json").read_text(encoding="utf-8"))
keys = {slot.get("key") for slot in visual.get("placeholder_slots", [])}
for key in ["quote_pipeline", "booking_conversion", "proof_of_work", "invoice_payment", "review_public_proof", "repeat_maintenance"]:
    if key not in keys:
        raise SystemExit(f"visual placeholder registry missing {key}")
print("Build 208 connected workflow command-center check passed.")
