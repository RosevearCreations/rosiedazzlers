#!/usr/bin/env python3
"""Build 553: staff/mobile field trace and private social draft source guard."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(p):
 f=ROOT/p
 if not f.is_file():errors.append("missing "+p);return ""
 return f.read_text(encoding="utf-8",errors="replace")
required={
 "functions/api/_lib/staff-mobile-field-regression-553.js":["build553StaffMobileFieldRegression","retain_staff_mobile_regression_hold","device_fault_declared:false","role_permissions_comparable"],
 "functions/api/admin/staff_mobile_remediation_closure_readiness.js":["build553StaffMobileFieldRegression","staff_mobile_field_regression_553"],
 "assets/staff-mobile-field-regression-553.js":["refreshStaffField553","staff_mobile_field_regression_553"],
 "admin-staff-workflow-support-learning.html":['data-build553="staff-mobile-field-regression-evidence"','id="refreshStaffField553"'],
 "assets/daip-social-video-drafts-553.js":["build553DaipSocialVideoDrafts","public_social_posts_created:false","public_upload_authorized:false","consent_to_publish_verified:false"],
 "admin-daip-media.html":['data-build553="private-daip-social-video-packages"','id="daipSocialReview553"',"build553DaipSocialVideoDrafts"],
 "scripts/staff_mobile_daip_social_drafts_test.mjs":["bounded_field_regression_review_ready","private_social_copy_drafts_ready_for_operator_review"],
 "BUILD553_STAFF_MOBILE_FIELD_DAIP_SOCIAL_DRAFTS.md":["Build 553","Build 554","Cloudflare"]
}
for p,values in required.items():
 c=read(p)
 for v in values:
  if v not in c:errors.append(p+" missing "+repr(v))
for a,b in [("admin-staff-workflow-support-learning.html","admin-staff-workflow-support-learning/index.html"),
            ("admin-daip-media.html","admin-daip-media/index.html")]:
 if read(a)!=read(b):errors.append("Protected route copies mismatch "+a)
for p in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 c=read(p)
 for v in ["Validate staff mobile cohorts and DAIP private social drafts",
           "python scripts/staff_mobile_daip_social_drafts_check.py",
           "node scripts/staff_mobile_daip_social_drafts_test.mjs"]:
  if v not in c:errors.append(p+" missing "+v)
for p in ["functions/api/_lib/staff-mobile-field-regression-553.js",
          "functions/api/admin/staff_mobile_remediation_closure_readiness.js",
          "assets/daip-social-video-drafts-553.js",
          "assets/staff-mobile-field-regression-553.js",
          "scripts/staff_mobile_daip_social_drafts_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,capture_output=True,text=True)
 if r.returncode:errors.append("JS syntax "+p+" "+r.stderr.strip())
if errors:
 print("BUILD 553 SOURCE CHECK FAIL")
 for e in errors:print(" -",e)
 sys.exit(1)
r=subprocess.run(["node","scripts/staff_mobile_daip_social_drafts_test.mjs"],cwd=ROOT,capture_output=True,text=True)
if r.returncode:
 print("BUILD 553 REGRESSION FAIL",r.stderr or r.stdout)
 sys.exit(1)
print("BUILD 553 SOURCE CHECK PASS — authentic staff device cohorts and social drafts retain manual HOLD")
