#!/usr/bin/env python3
"""Build 555 source guard: authoritative release learning and DAIP private evidence."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
errors=[]
def read(file):
 path=root/file
 if not path.is_file():errors.append("missing "+file);return ""
 return path.read_text(encoding="utf-8")
required={
 "functions/api/_lib/production-learning-roadmap-555.js":["build555ProductionLearning","canonical_hold_auto_closed:false","production_learning_hold"],
 "functions/api/admin/production_learning_roadmap_555.js":["getOwnerReview","onRequestGet","ROSIE_PRODUCTION_LEARNING_555_JSON"],
 "assets/daip-quality-cost-reliability-review-555.js":["build555DaipQualityReliabilityReview","attributable_roi_verified:false","completed_job_does_not_prove_file:true"],
 "assets/production-learning-555.js":["production_learning_roadmap_555"],
 "admin-daip-media.html":['data-build555="daip-quality-cost-reliability"','id="daipQualityReview555"',"build555DaipQualityReliabilityReview"],
 "admin-service-economics-commercial-capacity-review.html":['id="productionLearning555Refresh"',"production-learning-555.js"],
 "scripts/production_learning_daip_555_test.mjs":["operator_measurement_package_requires_independent_acceptance","owner_review_records_reconciled"],
 "BUILD555_PRODUCTION_LEARNING_DAIP_RELIABILITY.md":["Build 555","Build 556","Cloudflare"]
}
for p,items in required.items():
 c=read(p)
 for v in items:
  if v not in c:errors.append(p+" missing "+v)
for p in ["admin-daip-media","admin-service-economics-commercial-capacity-review"]:
 if read(p+".html")!=read(p+"/index.html"):errors.append("protected page mirrors differ "+p)
for p in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 c=read(p)
 for item in ["Validate current production learning and private DAIP evidence",
              "python scripts/production_learning_daip_555_check.py",
              "node scripts/production_learning_daip_555_test.mjs"]:
  if item not in c:errors.append(p+" missing "+item)
files=["functions/api/_lib/production-learning-roadmap-555.js",
 "functions/api/admin/production_learning_roadmap_555.js",
 "assets/daip-quality-cost-reliability-review-555.js",
 "assets/production-learning-555.js","scripts/production_learning_daip_555_test.mjs"]
for file in files:
 if not (root/file).is_file():continue
 r=subprocess.run(["node","--check",file],cwd=root,capture_output=True,text=True)
 if r.returncode:errors.append("syntax "+file+": "+r.stderr.strip())
if errors:
 print("BUILD 555 SOURCE GUARD FAIL");print("\n".join(errors));sys.exit(1)
r=subprocess.run(["node","scripts/production_learning_daip_555_test.mjs"],cwd=root,capture_output=True,text=True)
if r.returncode:
 print("BUILD 555 REGRESSION FAIL",r.stdout,r.stderr);sys.exit(1)
print("BUILD 555 SOURCE GUARD PASS")
