#!/usr/bin/env python3
"""Build 556: fail-closed local evidence intake wiring."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
errors=[]
def read(p):
 f=root/p
 if not f.is_file():errors.append("missing "+p);return ""
 return f.read_text(encoding="utf-8")
needed={
 "assets/hold-evidence-intake-556.js":["build556OwnerHoldIntake","manual_closure_review_candidate_unverified","all_canonical_holds_remain_open:true","canonical_inventory_updated:false"],
 "assets/hold-evidence-intake-ui-556.js":["holdIntake556Json","holdIntake556Export"],
 "admin-service-economics-commercial-capacity-review.html":['data-build556="owner-hold-intake"',"hold-evidence-intake-ui-556.js"],
 "scripts/hold_evidence_intake_556_test.mjs":["hold_closed","manual_review_candidate_count"],
 "BUILD556_EVIDENCE_INTAKE_OWNER_HOLD_RESOLUTION.md":["Build 556","Cloudflare","manual"]
}
for p,parts in needed.items():
 c=read(p)
 for v in parts:
  if v not in c:errors.append(p+" missing "+v)
if read("admin-service-economics-commercial-capacity-review.html")!=read("admin-service-economics-commercial-capacity-review/index.html"):
 errors.append("protected route mirrors differ")
for p in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 c=read(p)
 for x in ["python scripts/hold_evidence_intake_556_check.py","node scripts/hold_evidence_intake_556_test.mjs"]:
  if x not in c:errors.append(p+" missing "+x)
for p in ["assets/hold-evidence-intake-556.js","assets/hold-evidence-intake-ui-556.js","scripts/hold_evidence_intake_556_test.mjs"]:
 if subprocess.run(["node","--check",p],cwd=root,capture_output=True).returncode:errors.append("syntax "+p)
if errors:print("BUILD 556 GUARD FAIL\n"+"\n".join(errors));sys.exit(1)
r=subprocess.run(["node","scripts/hold_evidence_intake_556_test.mjs"],cwd=root,capture_output=True,text=True)
if r.returncode:print("BUILD 556 REGRESSION FAIL",r.stdout,r.stderr);sys.exit(1)
print("BUILD 556 GUARD PASS")
