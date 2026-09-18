#!/usr/bin/env python3
"""Build 417 payment/refund/delivery provider evidence closure source authority."""
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    target=ROOT/path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8",errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/provider-evidence-closure.js")
endpoint=read("functions/api/admin/provider_evidence_closure.js")
launch_endpoint=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
page=read("admin-launch-readiness.html")
copy=read("admin-launch-readiness/index.html")
contract=read("BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
focused=read(".github/workflows/provider-evidence-closure-authority.yml")
prod_check=read("scripts/production_business_acceptance_check.py")

require(helper,["buildProviderEvidenceClosure","stripe_provider_outcome","paypal_provider_outcome","provider_refund_id","provider_event_id","provider_delivery_verified","provider_accepted_is_definitive_delivery: false","customer_identity_exposed: false","notification_send_performed: false","webhook_replay_performed: false"],"Build 417 helper")
require(endpoint,["requireStaffAccess","it_diagnostics","quote_deposit_refund_records","notification_events","build: 417",'authority: "payment_refund_delivery_provider_evidence_closure"',"select=*","method: \"GET\""],"Build 417 endpoint")
require(launch_endpoint,["getProviderEvidenceClosure","provider_evidence_closure","build: 417",'authority: "payment_refund_delivery_provider_evidence_closure"',"retained_build: 416"],"launch readiness composition")
require(asset,["Payment, refund & delivery provider evidence","Definitive refunds","Definitive delivery","Provider accepted is not final delivery","provider_evidence_closure"],"Build 417 client")
require(page,['data-build417="payment-refund-delivery-provider-evidence-closure"',"Build 417 · Provider evidence closure",'id="providerOut"',"Build 417 acceptance boundary","does not create a charge","does not initiate a refund","does not send a notification"],"Build 417 page")
if page!=copy: errors.append("admin-launch-readiness route copy drift")
require(contract,["configuration remains source evidence only","definitive refund","definitive message delivery","no provider contact","no provider contact, payment charge/capture","Build 418"],"Build 417 contract")
for text,label in [(queue,"queue"),(handoff,"handoff"),(readme,"README")]:
    require(text,["Build 417","Build 418","BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md"],label)
for gate,label in [(dev_gate,"Development source gate"),(prod_gate,"Production authority"),(focused,"focused authority")]:
    require(gate,["provider_evidence_closure_check.py","provider_evidence_closure_test.mjs"],label)
require(prod_check,['"provider_evidence_closure"',"scripts/provider_evidence_closure_check.py","scripts/provider_evidence_closure_test.mjs","Validate provider evidence closure authority"],"Production business acceptance source authority")

for needle in ["setInterval(","location.reload("]:
    if needle in asset: errors.append(f"Build 417 client contains automatic polling/reload primitive: {needle}")
for needle in ['method: "POST"',"method:'POST'",'method: "DELETE"',"method:'DELETE'",'method: "PATCH"',"method:'PATCH'"]:
    if needle in endpoint: errors.append(f"Build 417 evidence endpoint contains mutation primitive: {needle}")
for path in ["functions/api/_lib/provider-evidence-closure.js","functions/api/admin/provider_evidence_closure.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/provider_evidence_closure_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode!=0: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
test=subprocess.run(["node","scripts/provider_evidence_closure_test.mjs"],cwd=ROOT,text=True,capture_output=True)
if test.returncode!=0: errors.append(f"provider evidence closure test failed: {test.stderr.strip() or test.stdout.strip()}")

if errors:
    print("PAYMENT REFUND DELIVERY PROVIDER EVIDENCE CLOSURE AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
print("PAYMENT REFUND DELIVERY PROVIDER EVIDENCE CLOSURE AUTHORITY: PASS")
print(" - Stripe/PayPal provider success remains persisted reconciliation evidence only")
print(" - definitive refunds require linked provider/request identity plus amount/currency/timestamp")
print(" - provider-accepted notifications remain distinct from definitive delivery")
print(" - customer identity and message contents are excluded from the closure payload")
print(" - source acceptance performs no provider/payment/refund/message/business mutation")
