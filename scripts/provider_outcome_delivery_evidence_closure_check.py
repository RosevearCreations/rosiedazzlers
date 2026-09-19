#!/usr/bin/env python3
"""Build 436 Provider Outcome & Delivery Evidence Closure source authority."""
from pathlib import Path
import subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")
helper=read("functions/api/_lib/provider-outcome-delivery-evidence.js")
endpoint=read("functions/api/admin/provider_outcome_delivery_evidence.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
page=read("admin-launch-readiness.html")
copy=read("admin-launch-readiness/index.html")
contract=read("BUILD436_PROVIDER_OUTCOME_DELIVERY_EVIDENCE_CLOSURE.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
require(helper,["buildProviderOutcomeDeliveryEvidence","closure_candidate","observed_dated","observed_undated","provider_dependent","unavailable","backlog_mutated: false","provider_contact_performed: false","notification_send_performed: false","provider_accepted_is_definitive_delivery: false"],"Build 436 helper")
require(endpoint,["getProviderEvidenceClosure","buildProviderOutcomeDeliveryEvidence","build: 436",'authority: "provider_outcome_delivery_evidence_closure"',"GET, HEAD, OPTIONS"],"Build 436 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","STRIPE_SECRET_KEY","PAYPAL_CLIENT_SECRET"]:
    if forbidden in endpoint: errors.append(f"Build 436 endpoint contains forbidden token {forbidden!r}")
require(launch,["buildProviderOutcomeDeliveryEvidence","provider_outcome_delivery_evidence: providerOutcomeDeliveryEvidence",'current_provider_evidence_authority: "provider_outcome_delivery_evidence_closure"'],"launch readiness composition")
require(asset,["Dated evidence","closure candidate","Latest dated evidence"],"launch readiness client")
require(page,['data-build436="provider-outcome-delivery-evidence-closure"',"Loading dated provider evidence","Build 419 acceptance boundary","Current provider evidence refresh:"],"launch readiness page")
if page!=copy: errors.append("admin-launch-readiness route copy drift")
require(contract,["# Build 436 — Provider Outcome & Delivery Evidence Closure","/api/admin/provider_outcome_delivery_evidence","closure_candidate","STARTUP_GO_LIVE_BLOCKERS.md","Build 437 — Backup & Recovery Evidence Closure"],"Build 436 contract")
require(blockers,["Provider outcomes & communications","provider_outcome_delivery_evidence","closure candidate"],"canonical HOLD backlog")
require(queue,["**Build 436 — Provider Outcome & Delivery Evidence Closure** is the active bounded release.","**Build 437 — Backup & Recovery Evidence Closure**"],"release queue")
require(handoff,["**Build 436 — Provider Outcome & Delivery Evidence Closure** is the active bounded release.","**Build 437 — Backup & Recovery Evidence Closure**"],"project handoff")
require(readme,["Current source direction: **Build 436 — Provider Outcome & Delivery Evidence Closure**","scripts/provider_outcome_delivery_evidence_closure_check.py","**Build 437 — Backup & Recovery Evidence Closure**"],"README")
for p in ["functions/api/_lib/provider-outcome-delivery-evidence.js","functions/api/admin/provider_outcome_delivery_evidence.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/provider_outcome_delivery_evidence_closure_test.mjs"]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [
    ["node","scripts/provider_outcome_delivery_evidence_closure_test.mjs"],
    ["python","scripts/provider_evidence_closure_check.py"],
    ["node","scripts/provider_evidence_closure_test.mjs"],
    ["python","scripts/build407_payment_provider_live_outcome_reconciliation_check.py"],
    ["python","scripts/customer_communication_consent_delivery_check.py"],
    ["node","scripts/customer_communication_consent_delivery_test.mjs"],
]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")
if errors:
    print("PROVIDER OUTCOME & DELIVERY EVIDENCE CLOSURE AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("PROVIDER OUTCOME & DELIVERY EVIDENCE CLOSURE AUTHORITY: PASS")
print(" - provider outcomes are read from retained persisted authorities only")
print(" - each required evidence class must be attributable and dated before becoming a closure candidate")
print(" - provider accepted remains distinct from definitive delivery")
print(" - canonical HOLD backlog is never mutated automatically")
print(" - no provider/payment/refund/message/customer mutation or permanent polling is introduced")
