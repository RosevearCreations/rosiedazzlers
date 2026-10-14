#!/usr/bin/env python3
"""Build 557 private worker/quota release guard."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1];errors=[]
def read(path):
 p=root/path
 if not p.is_file():errors.append("missing "+path);return ""
 return p.read_text(encoding="utf-8")
needed={"assets/daip-worker-delivery-quota-557.js":["build557DaipWorkerQuotaBaseline","provider_verified:false","real_private_output_inspected:false","db_or_storage_written:false"],
"admin-daip-media.html":['data-build557="daip-worker-delivery-quota"','id="daipWorkerReview557"',"build557DaipWorkerQuotaBaseline"],
"scripts/daip_worker_delivery_quota_557_test.mjs":["reported_usage_exceeds_quota_limit","matched_operator_receipt_count"],
"BUILD557_DAIP_MEASURED_WORKER_DELIVERY_QUOTA_BASELINE.md":["Build 557","Build 558","provider"]}
for path,terms in needed.items():
 body=read(path)
 for term in terms:
  if term not in body:errors.append(path+" missing "+term)
if read("admin-daip-media.html")!=read("admin-daip-media/index.html"):errors.append("admin DAIP route mirror differs")
for path in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 body=read(path)
 for term in ["Validate private DAIP worker delivery and quota review","python scripts/daip_worker_delivery_quota_557_check.py","node scripts/daip_worker_delivery_quota_557_test.mjs"]:
  if term not in body:errors.append(path+" missing "+term)
for path in ["assets/daip-worker-delivery-quota-557.js","scripts/daip_worker_delivery_quota_557_test.mjs"]:
 r=subprocess.run(["node","--check",path],cwd=root,capture_output=True,text=True)
 if r.returncode:errors.append("syntax "+path+": "+r.stderr.strip())
if errors:
 print("BUILD 557 SOURCE GUARD FAIL\n"+"\n".join(errors));sys.exit(1)
r=subprocess.run(["node","scripts/daip_worker_delivery_quota_557_test.mjs"],cwd=root,capture_output=True,text=True)
if r.returncode:
 print("BUILD 557 REGRESSION FAIL",r.stdout,r.stderr);sys.exit(1)
print("BUILD 557 SOURCE GUARD PASS")
