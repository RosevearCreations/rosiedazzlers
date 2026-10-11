#!/usr/bin/env python3
"""Build 546 — fail-closed seasonal owner/public claim wiring authority."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
errors=[]
def read(name):
    p=root/name
    if not p.is_file():
        errors.append("Missing "+name)
        return ""
    return p.read_text(encoding="utf-8",errors="replace")
helper=read("functions/api/_lib/seasonal-owner-evidence-closure-public-claim-readiness.js")
test=read("scripts/seasonal_owner_evidence_closure_public_claim_readiness_test.mjs")
api=read("functions/api/admin/service_economics_commercial_capacity_review.js")
js=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
a=read("admin-service-economics-commercial-capacity-review.html")
b=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD546_SEASONAL_OWNER_EVIDENCE_CLOSURE_PUBLIC_CLAIM_DECISION_READINESS.md")
for name,text,terms in [
 ("helper",helper,["buildSeasonalOwnerPublicClaimReadiness","duplicate_owning_service_evidence","source_owned_working_temperature_limit","unsupported_broad_winter_wording","automatic_publication_allowed:false"]),
 ("test",test,["noIntegrity","old_owner","winter_wash","dup","source_owned_working_temperature_limit"]),
 ("endpoint",api,["buildSeasonalOwnerPublicClaimReadiness","seasonal_owner_public_claim_readiness:ownerPublicClaimReadiness"]),
 ("client",js,["renderSeasonalOwnerPublicClaimReadiness","seasonalOwnerPublicClaimReadinessGrid"]),
 ("page",a,['data-build546="seasonal-owner-evidence-claim-readiness"','id="seasonalOwnerPublicClaimReadinessGrid"']),
 ("doc",doc,["Build 546","Build 547","Production GREEN","No Supabase"])
]:
    for term in terms:
        if term not in text: errors.append(name+" missing "+term)
if a!=b:errors.append("Protected route copies diverge")
for name in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
    content=read(name)
    for term in ["Validate Build 546 seasonal owner evidence closure & public claim readiness",
                 "python scripts/seasonal_owner_evidence_closure_public_claim_readiness_check.py",
                 "node scripts/seasonal_owner_evidence_closure_public_claim_readiness_test.mjs"]:
        if term not in content:errors.append(name+" missing "+term)
if errors:
    print("BUILD 546 SEASONAL OWNER EVIDENCE CLOSURE & PUBLIC CLAIM READINESS AUTHORITY: FAIL")
    for e in errors:print(" -",e)
    sys.exit(1)
print("BUILD 546 SEASONAL OWNER EVIDENCE CLOSURE & PUBLIC CLAIM READINESS AUTHORITY: PASS")
