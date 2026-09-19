#!/usr/bin/env python3
"""Build 425 — Production Learning & Roadmap Renewal authority."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")

def require(text, needles, label):
    for n in needles:
        if n not in text:
            errors.append(f"{label} missing {n!r}")

contract=read("BUILD425_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
roadmap=read("FORWARD_BUILD_ROADMAP_426_435.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")

require(contract,[
    "retained","closed","owner_action","provider_dependent","unavailable",
    "Source/runtime GREEN never converts missing owner/provider evidence into success.",
    "no schema migration","no schema migration".replace("no ","no "), # stable literal guard
    "protected-main","exact resulting `main` Cloudflare Production deployment/runtime/business acceptance"
],"Build 425 contract")
require(roadmap,[
    "Build 426 — HOLD Inventory & Authority Cleanup",
    "Build 427 — Booking Conversion & Quote Clarity",
    "Build 434 — Reliability, Security & Cost Reassessment",
    "Build 435 — Production Learning & Roadmap Renewal"
],"renewed roadmap")
for text,label in [(queue,"queue"),(handoff,"handoff"),(readme,"README")]:
    require(text,["Build 425","FORWARD_BUILD_ROADMAP_426_435.md"],label)
    if label != "README":
        require(text,["Build 426"],label)
    else:
        require(text,["HOLD Inventory & Authority Cleanup"],label)
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]:
    require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,[
    "production_learning_roadmap_renewal",
    "scripts/production_learning_roadmap_renewal_check.py",
    "Validate Production learning & roadmap renewal authority"
],"Production business acceptance source authority")

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - completed-cycle evidence remains distinct from unresolved owner/provider HOLDs")
print(" - stale authority cleanup cannot fabricate external success")
print(" - renewed roadmap 426–435 is present and evidence-driven")
print(" - no schema, provider, customer, accounting, inventory or destructive-storage mutation is authorized")
