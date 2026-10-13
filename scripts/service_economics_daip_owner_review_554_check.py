#!/usr/bin/env python3
"""Build 554 fail-closed evidence/source release guard."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
 p=root/path
 if not p.is_file():errors.append("Missing "+path);return ""
 return p.read_text(encoding="utf-8")
required={
 "functions/api/_lib/service-economics-capacity-technical-owner-review-554.js":["build554ServiceEconomicsCapacityTechnicalOwnerReview","retained_same_domain_integrity_review_required","provider_billing_or_cpu_quota_inferred:false"],
 "functions/api/admin/service_economics_capacity_technical_owner_review.js":["onRequestGet","onRequestHead","onRequestOptions","getCurrentEvidence","SERVICE_ECONOMICS_CAPACITY_TECHNICAL_OWNER_REVIEW_554_JSON"],
 "assets/daip-operator-delivery-review-554.js":["build554DaipManualDeliveryPacket","dispatch_attempted:false","automatic_post_or_schedule:false","private_delivery_hold"],
 "admin-daip-media.html":['data-build554="daip-human-channel-delivery-review"','id="daipDeliveryReview554"',"build554DaipManualDeliveryPacket"],
 "admin-service-economics-commercial-capacity-review.html":['id="ownerReview554Refresh"',"service-economics-owner-review-554.js"],
 "assets/service-economics-owner-review-554.js":["service_economics_capacity_technical_owner_review"],
 "scripts/service_economics_daip_owner_review_554_test.mjs":["manual_export_candidate_only","reviewed_controls_retained"],
 "BUILD554_SERVICE_ECONOMICS_CAPACITY_TECHNICAL_RELIABILITY_OWNER_REVIEW.md":["Build 554","Build 555","Cloudflare"],
 "AI_PROJECT_HANDOFF.md":["Build 554","Build 555"]
}
for file,terms in required.items():
 content=read(file)
 for term in terms:
  if term not in content:errors.append(file+" missing "+term)
for p in ["admin-daip-media","admin-service-economics-commercial-capacity-review"]:
 if read(p+".html")!=read(p+"/index.html"):errors.append("Protected route mirror mismatch "+p)
for p in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 c=read(p)
 for phrase in ["Validate Build 554 owner review and private DAIP delivery","python scripts/service_economics_daip_owner_review_554_check.py","node scripts/service_economics_daip_owner_review_554_test.mjs"]:
  if phrase not in c:errors.append(p+" missing "+phrase)
files=["functions/api/_lib/service-economics-capacity-technical-owner-review-554.js","functions/api/admin/service_economics_capacity_technical_owner_review.js",
"assets/daip-operator-delivery-review-554.js","assets/service-economics-owner-review-554.js","scripts/service_economics_daip_owner_review_554_test.mjs"]
for f in files:
 if not (root/f).is_file():continue
 p=subprocess.run(["node","--check",f],cwd=root,capture_output=True,text=True)
 if p.returncode:errors.append(f+" syntax: "+p.stderr.strip())
if errors:
 print("BUILD 554 SOURCE GUARD FAIL")
 for e in errors:print(" -",e)
 sys.exit(1)
p=subprocess.run(["node","scripts/service_economics_daip_owner_review_554_test.mjs"],cwd=root,capture_output=True,text=True)
if p.returncode:
 print("BUILD 554 REGRESSION FAIL",p.stderr or p.stdout);sys.exit(1)
print("BUILD 554 SOURCE GUARD PASS")
