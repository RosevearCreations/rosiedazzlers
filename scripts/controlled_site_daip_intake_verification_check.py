#!/usr/bin/env python3
"""Build 548 bounded read-only site and private DAIP source verification authority."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
errors=[]
def source(path):
 p=root/path
 if not p.is_file():
  errors.append("missing "+path)
  return ""
 return p.read_text(encoding="utf-8",errors="replace")
checks={
 "functions/api/_lib/controlled-site-routing-capacity-owner-verification.js":["buildControlledSiteCapacityOwnerVerification","source_owned_service_specific_route_unavailable","future_capacity_authorized:false"],
 "scripts/controlled_site_routing_capacity_owner_verification_test.mjs":["bounded_site_capacity_evidence_mismatch","dated_attributable_owner_verification_missing_or_stale"],
 "assets/daip-intake-source-verification.js":["buildDaipIntakeVerification","private_project_raw_key_mismatch","actual_r2_object_head_checked:false","public_publishing_authorized:false"],
 "scripts/daip_intake_source_verification_test.mjs":["private_project_raw_key_mismatch","video_duration_not_verified"],
 "functions/api/admin/service_economics_commercial_capacity_review.js":["buildControlledSiteCapacityOwnerVerification","controlled_site_capacity_owner_verification:siteOwnerVerification"],
 "assets/build473-service-economics-allocation-margin-review-readiness.js":["renderControlledSiteOwnerVerification","controlledSiteOwnerVerificationGrid"],
 "admin-service-economics-commercial-capacity-review.html":['data-build548="controlled-site-owner-verification"','id="controlledSiteOwnerVerificationGrid"'],
 "admin-daip-media.html":['data-build548="private-source-verification"','daipVerifyIntake','buildDaipIntakeVerification'],
 "BUILD548_CONTROLLED_SITE_OWNER_AND_DAIP_INTAKE_VERIFICATION.md":["Build 548","Build 549","Cloudflare","DAIP"],
 "DAIP_CONTINUOUS_BUILD_TRACK_547_555.md":["Build 548 implementation note","actual worker execution"]
}
for path,needles in checks.items():
 t=source(path)
 for needle in needles:
  if needle not in t:errors.append(path+" missing "+needle)
for a,b in [
 ("admin-service-economics-commercial-capacity-review.html","admin-service-economics-commercial-capacity-review/index.html"),
 ("admin-daip-media.html","admin-daip-media/index.html")
]:
 if source(a)!=source(b):errors.append("protected route mirrors diverge: "+a)
for path in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 s=source(path)
 for needle in ["Validate site owner capacity and private DAIP source verification",
  "python scripts/controlled_site_daip_intake_verification_check.py",
  "node scripts/controlled_site_routing_capacity_owner_verification_test.mjs",
  "node scripts/daip_intake_source_verification_test.mjs"]:
  if needle not in s:errors.append(path+" missing "+needle)
if errors:
 print("BUILD 548 SITE AND DAIP INTAKE VERIFICATION: FAIL")
 for x in errors:print(" - "+x)
 sys.exit(1)
print("BUILD 548 SITE AND DAIP INTAKE VERIFICATION: PASS")
