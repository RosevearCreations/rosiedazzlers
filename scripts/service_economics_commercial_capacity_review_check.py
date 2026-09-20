#!/usr/bin/env python3
from pathlib import Path
import re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];errors=[]
def read(p):
 t=ROOT/p
 if not t.is_file(): errors.append(f"missing required file: {p}"); return ""
 return t.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
 for n in needles:
  if n not in text: errors.append(f"{label} missing {n!r}")
helper=read("functions/api/_lib/service-economics-commercial-capacity-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
page=read("admin-service-economics-commercial-capacity-review.html")
route=read("admin-service-economics-commercial-capacity-review/index.html")
client=read("assets/build443-service-economics-commercial-capacity-review.js")
test=read("scripts/service_economics_commercial_capacity_review_test.mjs")
contract=read("BUILD443_SERVICE_ECONOMICS_COMMERCIAL_CAPACITY_REVIEW.md")
readme=read("README.md");queue=read("AUTONOMOUS_RELEASE_QUEUE.md");handoff=read("AI_PROJECT_HANDOFF.md");auth=read("assets/admin-auth.js");nav=read("assets/app-core/module-navigation.js")
if page!=route: errors.append("Build 443 route copies differ")
if len(re.findall(r"<h1\b",page,flags=re.I))!=1: errors.append("Build 443 page must have one H1")
require(helper,["build:443",'mode:"service_economics_commercial_capacity_review"',"missing_evidence_blocks_margin_conclusion","signed_business_inferred:false","current_live_capacity_inferred:false","pricing_mutation_allowed:false","booking_mutation_allowed:false","accounting_posting_allowed:false","provider_transaction_allowed:false","permanent_polling_allowed:false","capacity_inference_from_demand_allowed:false"],"helper")
for f in ("customer_name","customer_email","booking_id:"):
 if f in helper: errors.append(f"helper exposes forbidden {f}")
require(endpoint,['capability:"manage_staff"',"getAccountingStatement","getFleetLearning","onRequestPost","onRequestPut","onRequestPatch","onRequestDelete"],"endpoint")
require(page,['data-build443="service-economics-commercial-capacity-review"','data-page="admin-service-economics-commercial-capacity-review"','id="refreshReview"'],"page retained authority")
require(client,["/api/admin/service_economics_commercial_capacity_review",'method:"GET"',"No pricing, booking, accounting or provider action was performed."],"client")
for f in ("setInterval(","localStorage","sessionStorage",'method:"POST"','method:"PUT"','method:"PATCH"','method:"DELETE"'):
 if f in client: errors.append(f"client contains forbidden {f}")
require(test,["BUILD 443 SERVICE ECONOMICS COMMERCIAL CAPACITY REVIEW TEST: PASS"],"test")
require(contract,["# Build 443 — Service Economics & Commercial Capacity Review","No automatic price/discount change","Build 444 — Reliability, Security & Cost Reassessment"],"contract")
require(readme,["BUILD443_SERVICE_ECONOMICS_COMMERCIAL_CAPACITY_REVIEW.md","scripts/service_economics_commercial_capacity_review_check.py","Production is not considered GREEN from source promotion alone."],"README retained authority")
require(queue,["BUILD443_SERVICE_ECONOMICS_COMMERCIAL_CAPACITY_REVIEW.md","FORWARD_BUILD_ROADMAP_436_445.md","Production deployment/runtime/business acceptance"],"queue retained authority")
require(handoff,["BUILD443_SERVICE_ECONOMICS_COMMERCIAL_CAPACITY_REVIEW.md",".github/workflows/service-economics-commercial-capacity-review-authority.yml","scripts/service_economics_commercial_capacity_review_check.py"],"handoff retained authority")
require(auth,['case "admin-service-economics-commercial-capacity-review"'],"auth")
require(nav,['"/admin-service-economics-commercial-capacity-review.html"','"page_key":"admin-service-economics-commercial-capacity-review"','"label":"Economics & Capacity Review"'],"nav")
for cmd in (["node","--check","functions/api/_lib/service-economics-commercial-capacity-review.js"],["node","--check","functions/api/admin/service_economics_commercial_capacity_review.js"],["node","--check","assets/build443-service-economics-commercial-capacity-review.js"],["node","scripts/service_economics_commercial_capacity_review_test.mjs"]):
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(" ".join(cmd)+" failed: "+(r.stderr.strip() or r.stdout.strip()))
if errors:
 print("BUILD 443 SERVICE ECONOMICS COMMERCIAL CAPACITY REVIEW AUTHORITY: FAIL")
 [print(" -",e) for e in errors];sys.exit(1)
print("BUILD 443 SERVICE ECONOMICS COMMERCIAL CAPACITY REVIEW AUTHORITY: PASS")
