#!/usr/bin/env python3
"""Build 549 source wiring, protected review and dedicated regression gate."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1];errors=[]
def read(path):
 f=root/path
 if not f.is_file():
  errors.append("missing "+path);return ""
 return f.read_text(encoding="utf-8",errors="replace")
checks={
 "functions/api/_lib/provider-local-search-manual-evidence-closure-549.js":["build549ProviderManualEvidenceReview","canonical_hold_mutated:false","manual_closure_review_required"],
 "functions/api/admin/provider_local_search_evidence_continuity.js":["build549ProviderManualEvidenceReview","provider_delivery_local_search_manual_evidence_closure_549"],
 "assets/build450-local-search-measurement-conversion-attribution.js":["renderProviderManual549","providerManual549Rows"],
 "admin-seo-tasks.html":['data-build549="provider-delivery-local-search-manual-evidence-closure"','id="providerManual549Rows"'],
 "assets/daip-processing-privacy-observability-549.js":["build549DaipProcessingPrivacyReview","actual_private_output_verified:false","public_export_authorized:false"],
 "admin-daip-media.html":['data-build549="private-processing-privacy-review"','id="daipReviewProcessing549"',"build549DaipProcessingPrivacyReview"],
 "scripts/build549_provider_daip_privacy_test.mjs":["source_review_ready_not_canonical_hold_change","public_export_authorized"],
 "BUILD549_PROVIDER_DELIVERY_LOCAL_SEARCH_DAIP_PRIVACY_REVIEW.md":["Build 549","Build 550","DAIP"],
}
for path,needles in checks.items():
 t=read(path)
 for n in needles:
  if n not in t:errors.append(path+" missing "+n)
for a,b in [("admin-seo-tasks.html","admin-seo-tasks/index.html"),("admin-daip-media.html","admin-daip-media/index.html")]:
 if read(a)!=read(b):errors.append("protected route copies diverge: "+a)
for path in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 t=read(path)
 for n in ["Validate provider and private DAIP review","python scripts/build549_provider_daip_privacy_check.py","node scripts/build549_provider_daip_privacy_test.mjs"]:
  if n not in t:errors.append(path+" missing "+n)
for p in ["functions/api/_lib/provider-local-search-manual-evidence-closure-549.js","assets/daip-processing-privacy-observability-549.js","scripts/build549_provider_daip_privacy_test.mjs"]:
 v=subprocess.run(["node","--check",p],cwd=root,text=True,capture_output=True)
 if v.returncode:errors.append("syntax: "+p+" "+v.stderr.strip())
if errors:
 print("BUILD 549 SOURCE ACCEPTANCE: FAIL")
 for e in errors:print(" - "+e)
 sys.exit(1)
test=subprocess.run(["node","scripts/build549_provider_daip_privacy_test.mjs"],cwd=root,text=True,capture_output=True)
if test.returncode:
 print("BUILD 549 SOURCE ACCEPTANCE: FAIL",test.stderr or test.stdout)
 sys.exit(1)
print("BUILD 549 SOURCE ACCEPTANCE: PASS — source-owned manual review; private media; no business/publication mutation")
