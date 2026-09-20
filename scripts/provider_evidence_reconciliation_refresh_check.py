#!/usr/bin/env python3
"""Build 446 Provider Evidence Reconciliation Refresh authority."""
from pathlib import Path
import subprocess, sys
ROOT=Path(__file__).resolve().parents[1]; errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")
helper=read("functions/api/_lib/provider-evidence-reconciliation-refresh.js")
endpoint=read("functions/api/admin/provider_evidence_reconciliation_refresh.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
page=read("admin-launch-readiness.html"); copy=read("admin-launch-readiness/index.html")
contract=read("BUILD446_PROVIDER_EVIDENCE_RECONCILIATION_REFRESH.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md"); queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md")
require(helper,["provider_evidence_reconciliation_refresh","freshness_policy","source_gap_count","stale_evidence_count","aging_evidence_count","oldest_evidence_age_days","backlog_mutated: false","provider_contact_performed: false","permanent_polling: false"],"Build 446 helper")
require(endpoint,["build:446","provider_evidence_reconciliation_refresh","GET, HEAD, OPTIONS","buildProviderEvidenceReconciliationRefresh"],"Build 446 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","STRIPE_SECRET_KEY","PAYPAL_CLIENT_SECRET"]:
    if forbidden in endpoint: errors.append(f"Build 446 endpoint contains forbidden token {forbidden!r}")
require(launch,["buildProviderEvidenceReconciliationRefresh","provider_evidence_reconciliation_refresh: providerEvidenceReconciliationRefresh",'current_provider_reconciliation_authority: "provider_evidence_reconciliation_refresh"'],"launch readiness composition")
require(asset,["Evidence age","Source gaps","freshness","provider_evidence_reconciliation_refresh"],"launch readiness client")
require(page,['data-build446="provider-evidence-reconciliation-refresh"'],"launch readiness retained Build 446 marker")
if page!=copy: errors.append("admin-launch-readiness route copy drift")
require(contract,["# Build 446 — Provider Evidence Reconciliation Refresh","evidence age","Build 447"],"Build 446 contract")
require(blockers,["Provider outcomes & communications","provider_evidence_reconciliation_refresh","evidence age"],"canonical HOLD backlog")
require(queue,["BUILD446_PROVIDER_EVIDENCE_RECONCILIATION_REFRESH.md","FORWARD_BUILD_ROADMAP_446_455.md"],"release queue retained Build 446 authority")
require(handoff,["BUILD446_PROVIDER_EVIDENCE_RECONCILIATION_REFRESH.md","provider-evidence-reconciliation-refresh-authority.yml","provider_evidence_reconciliation_refresh_check.py"],"project handoff")
require(readme,["BUILD446_PROVIDER_EVIDENCE_RECONCILIATION_REFRESH.md","provider_evidence_reconciliation_refresh_check.py"],"README retained Build 446 authority")
for p in ["functions/api/_lib/provider-evidence-reconciliation-refresh.js","functions/api/admin/provider_evidence_reconciliation_refresh.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/provider_evidence_reconciliation_refresh_test.mjs"]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [["node","scripts/provider_evidence_reconciliation_refresh_test.mjs"],["python","scripts/provider_outcome_delivery_evidence_closure_check.py"],["node","scripts/provider_outcome_delivery_evidence_closure_test.mjs"],["python","scripts/provider_evidence_closure_check.py"],["node","scripts/provider_evidence_closure_test.mjs"]]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")
if errors:
    print("PROVIDER EVIDENCE RECONCILIATION REFRESH AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("PROVIDER EVIDENCE RECONCILIATION REFRESH AUTHORITY: PASS")
print(" - provider evidence age, source availability and reconciliation gaps are explicit")
print(" - retained provider evidence remains read-only and operator-reviewed")
print(" - stale/missing/unavailable evidence retains the canonical HOLD")
print(" - no provider/payment/refund/message/customer mutation or permanent polling is introduced")
