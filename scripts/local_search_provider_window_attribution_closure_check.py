#!/usr/bin/env python3
"""Build 470 Local Search Provider Window & Attribution Closure source authority."""
from pathlib import Path
import re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
 p=ROOT/path
 if not p.is_file():
  errors.append(f"missing required file: {path}")
  return ""
 return p.read_text(encoding="utf-8",errors="ignore")

def require(text,needles,label):
 for needle in needles:
  if needle not in text:
   errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/local-search-measurement-conversion-attribution.js")
endpoint=read("functions/api/admin/local_search_measurement_conversion_attribution.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html")
copy=read("admin-seo-tasks/index.html")
contract=read("BUILD470_LOCAL_SEARCH_PROVIDER_WINDOW_ATTRIBUTION_CLOSURE.md")
workflow=read(".github/workflows/local-search-provider-window-attribution-closure-authority.yml")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
retained460=read("scripts/local_search_provider_attribution_evidence_quality_check.py")

require(helper,["buildLocalSearchProviderWindowAttributionClosure","provider_window_attribution_closure_build: 470",'provider_window_attribution_closure_authority: "local_search_provider_window_attribution_closure"','authority: "local_search_provider_window_attribution_closure"',"closure_ready","provider_dependent","owner_action","bounded_partial","window_mismatch","window_unknown","explicit_provider_property_or_location_required: true","provider_first_party_window_overlap_required: true","complete_bounded_same_session_evidence_required: true","provider_metric_to_session_join_performed: false","provider_outcome_to_funnel_causation_claimed: false","provider_ranking_or_visibility_outcome_inferred: false","closure_ready_is_descriptive_evidence_only: true"],"Build 470 helper")
require(endpoint,["provider_window_attribution_closure_build: 470",'provider_window_attribution_closure_authority: "local_search_provider_window_attribution_closure"','"X-Rosie-Local-Search-Window-Closure": "build-470-read-only"',"GET,HEAD,OPTIONS"],"Build 470 endpoint")
for token in ["visitor_id","ip_address","user_agent","customer_profile_id","onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval("]:
 if token in endpoint: errors.append(f"Build 470 endpoint contains forbidden identity/mutation token {token!r}")
require(client,["renderProviderWindowClosure470","localProviderWindowClosure470","Build 470 closure state","Closure-ready means descriptive window alignment only","No provider or analytics write was performed."],"Build 470 client")
for token in ['method: "POST"','method: "PATCH"','method: "DELETE"','method: "PUT"',"localStorage","sessionStorage","setInterval("]:
 if token in client: errors.append(f"Build 470 client contains forbidden mutation/polling token {token!r}")
require(page,['data-build470="local-search-provider-window-attribution-closure"',"Build 470 · Local Search Provider Window &amp; Attribution Closure",'id="localProviderWindowClosure470"',"A closure-ready state closes only the comparison window"],"Build 470 page")
if page!=copy: errors.append("admin-seo-tasks route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("admin-seo-tasks must retain exactly one H1")
require(contract,["# Build 470 — Local Search Provider Window & Attribution Closure","closure_ready","property/location identity","bounded anonymous same-session","does not prove provider performance or causation","Build 471 — Booking & Quote Controlled Experiment Framework"],"Build 470 contract")
require(blockers,["Local-search provider evidence"],"canonical HOLD backlog")
require(queue,["BUILD470_LOCAL_SEARCH_PROVIDER_WINDOW_ATTRIBUTION_CLOSURE.md","Build 471 — Booking & Quote Controlled Experiment Framework"],"release queue")
require(handoff,["BUILD470_LOCAL_SEARCH_PROVIDER_WINDOW_ATTRIBUTION_CLOSURE.md","local_search_provider_window_attribution_closure_check.py"],"project handoff")
require(readme,["BUILD470_LOCAL_SEARCH_PROVIDER_WINDOW_ATTRIBUTION_CLOSURE.md","local_search_provider_window_attribution_closure_check.py"],"README")
require(retained460,["BUILD460_LOCAL_SEARCH_PROVIDER_ATTRIBUTION_EVIDENCE_QUALITY.md","local_search_measurement_conversion_attribution_test.mjs"],"retained Build 460 authority")
for gate,label in ((dev,"Development source gate"),(prod,"Production business acceptance")):
 require(gate,["python -m py_compile scripts/local_search_provider_window_attribution_closure_check.py","node --check scripts/local_search_provider_window_attribution_closure_test.mjs","python scripts/local_search_provider_window_attribution_closure_check.py","node scripts/local_search_provider_window_attribution_closure_test.mjs"],label)

commands=[
 ["node","--check","functions/api/_lib/local-search-measurement-conversion-attribution.js"],
 ["node","--check","functions/api/admin/local_search_measurement_conversion_attribution.js"],
 ["node","--check","assets/build450-local-search-measurement-conversion-attribution.js"],
 ["node","--check","scripts/local_search_provider_window_attribution_closure_test.mjs"],
 ["node","scripts/local_search_provider_window_attribution_closure_test.mjs"],
 ["python","scripts/local_search_provider_attribution_evidence_quality_check.py"],
 ["node","scripts/local_search_provider_attribution_evidence_quality_test.mjs"],
 ["python","scripts/local_search_measurement_conversion_attribution_check.py"],
 ["node","scripts/local_search_measurement_conversion_attribution_test.mjs"],
 ["python","scripts/local_search_provider_evidence_refresh_check.py"],
 ["node","scripts/local_search_provider_evidence_refresh_test.mjs"],
 ["python","scripts/local_search_measurement_authority_check.py"],
 ["python","scripts/local_acquisition_evidence_closure_check.py"],
 ["python","scripts/local_acquisition_content_proof_check.py"]
]
for command in commands:
 result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 if result.returncode:
  errors.append("command failed: "+" ".join(command)+"\n"+result.stdout+result.stderr)

if errors:
 print("LOCAL SEARCH PROVIDER WINDOW & ATTRIBUTION CLOSURE AUTHORITY: FAIL")
 for error in errors: print(" -",error)
 sys.exit(1)
print("LOCAL SEARCH PROVIDER WINDOW & ATTRIBUTION CLOSURE AUTHORITY: PASS")
print(" - retained Build 440/450/460 provider, attribution and evidence-quality authorities are reused in place")
print(" - provider property/location identity, freshness and dated window overlap are explicit closure inputs")
print(" - bounded first-party referral/funnel observations remain anonymous same-session evidence")
print(" - closure_ready is descriptive window closure only, never ranking, provider performance or causal conversion")
print(" - no provider/analytics/schema/publishing/outreach/DNS/ad-spend/customer/storage mutation or permanent polling")
