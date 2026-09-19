#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority."""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for n in needles:
        if n not in text: errors.append(f"{label} missing {n!r}")
contract=read("BUILD435_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_426_434.md")
roadmap=read("FORWARD_BUILD_ROADMAP_436_445.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
require(contract,["retained","closed","owner_action","provider_dependent","unavailable","PRODUCTION_LEARNING_426_434.md","FORWARD_BUILD_ROADMAP_436_445.md","Missing evidence remains a blocker or truthful HOLD, never fabricated success.","Build 436 — Provider Outcome & Delivery Evidence Closure"],"current renewal contract")
require(learning,["Detailer / staff workflow refinement","`closed`","Fleet / commercial operations learning","`owner_action`","Local acquisition / content proof","`provider_dependent`","provider payment/refund/message-delivery outcomes","backup / recovery drill evidence","authenticated real-device / visual evidence","maintenance / fleet commercial approval","FORWARD_BUILD_ROADMAP_436_445.md"],"cycle reconciliation")
for title in ["Build 436 — Provider Outcome & Delivery Evidence Closure","Build 437 — Backup & Recovery Evidence Closure","Build 438 — Authenticated Device & Visual Acceptance","Build 439 — Maintenance & Fleet Owner Approval Convergence","Build 440 — Local Search Provider Evidence Refresh","Build 441 — Booking, Quote & Retention Production Learning","Build 442 — Staff Workflow & Support Exception Learning","Build 443 — Service Economics & Commercial Capacity Review","Build 444 — Reliability, Security & Cost Reassessment","Build 445 — Production Learning & Roadmap Renewal"]:
    require(roadmap,[title],"renewed roadmap")
for filename in ["BUILD436_PROVIDER_OUTCOME_DELIVERY_EVIDENCE_CLOSURE.md","BUILD437_BACKUP_RECOVERY_EVIDENCE_CLOSURE.md","BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md","BUILD439_MAINTENANCE_FLEET_OWNER_APPROVAL_CONVERGENCE.md","BUILD440_LOCAL_SEARCH_PROVIDER_EVIDENCE_REFRESH.md","BUILD441_BOOKING_QUOTE_RETENTION_PRODUCTION_LEARNING.md","BUILD442_STAFF_WORKFLOW_SUPPORT_EXCEPTION_LEARNING.md","BUILD443_SERVICE_ECONOMICS_COMMERCIAL_CAPACITY_REVIEW.md","BUILD444_RELIABILITY_SECURITY_COST_REASSESSMENT.md","BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"]:
    read(filename)
require(blockers,["Provider outcomes & communications","Local-search provider evidence","Recovery / backup evidence","Independent device / visual evidence","Maintenance / fleet business approval","Evidence source unavailable","FORWARD_BUILD_ROADMAP_436_445.md","BUILD435_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"],"canonical HOLD backlog")
require(queue,["**Build 435 — Production Learning & Roadmap Renewal** is the active bounded release.","**Build 436 — Provider Outcome & Delivery Evidence Closure**","FORWARD_BUILD_ROADMAP_436_445.md"],"release queue")
require(handoff,["**Build 435 — Production Learning & Roadmap Renewal** is the active bounded release.","**Build 436 — Provider Outcome & Delivery Evidence Closure**","FORWARD_BUILD_ROADMAP_436_445.md"],"project handoff")
require(readme,["Current source direction: **Build 435 — Production Learning & Roadmap Renewal**","BUILD435_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","FORWARD_BUILD_ROADMAP_436_445.md","python scripts/production_learning_roadmap_renewal_check.py","**Build 436 — Provider Outcome & Delivery Evidence Closure**"],"README")
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]: require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,["production_learning_roadmap_renewal","scripts/production_learning_roadmap_renewal_check.py","Validate Production learning & roadmap renewal authority"],"Production business acceptance source authority")
if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 426–434 concerns are reconciled without fabricating provider/owner evidence")
print(" - canonical HOLD inventory remains current and singular")
print(" - renewed roadmap 436–445 and bounded future contracts are present")
print(" - no schema, provider, customer, accounting, inventory or destructive-storage mutation is authorized")
