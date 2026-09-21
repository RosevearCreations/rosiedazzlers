#!/usr/bin/env python3
"""Build 460 Local Search Provider & Attribution Evidence Quality source authority."""
from pathlib import Path
import re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
 p=ROOT/path
 if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
 return p.read_text(encoding="utf-8",errors="ignore")

def require(text,needles,label):
 for needle in needles:
  if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/local-search-measurement-conversion-attribution.js")
endpoint=read("functions/api/admin/local_search_measurement_conversion_attribution.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html")
copy=read("admin-seo-tasks/index.html")
contract=read("BUILD460_LOCAL_SEARCH_PROVIDER_ATTRIBUTION_EVIDENCE_QUALITY.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
retained450=read("scripts/local_search_measurement_conversion_attribution_check.py")

require(helper,[
 "buildProviderAttributionEvidenceQuality",
 "evidence_quality_build: 460",
 'evidence_quality_authority: "local_search_provider_attribution_evidence_quality"',
 "comparable_observed","window_mismatch","window_unknown","bounded_partial",
 "provider_metric_to_funnel_rate_comparison_performed: false",
 "provider_outcome_to_funnel_causation_claimed: false",
 "provider_metric_correlation_score_calculated: false",
 "cross_source_identity_join_performed: false"
],"Build 460 helper")
require(endpoint,[
 "evidence_quality_build: 460",
 'evidence_quality_authority: "local_search_provider_attribution_evidence_quality"',
 '"X-Rosie-Local-Search-Evidence-Quality": "build-460-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 460 endpoint")
for token in ["visitor_id","ip_address","user_agent","customer_profile_id","onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval("]:
 if token in endpoint: errors.append(f"Build 460 endpoint contains forbidden identity/mutation token {token!r}")

require(client,[
 "renderEvidenceQuality460",
 "localEvidenceQuality460",
 "Evidence-quality state",
 "Comparability describes freshness, availability and dated window alignment only",
 "No provider or analytics write was performed."
],"Build 460 client")
for token in ['method: "POST"','method: "PATCH"','method: "DELETE"','method: "PUT"',"localStorage","sessionStorage","setInterval("]:
 if token in client: errors.append(f"Build 460 client contains forbidden mutation/polling token {token!r}")

require(page,[
 'data-build460="local-search-provider-attribution-evidence-quality"',
 "Build 460 · Local Search Provider &amp; Attribution Evidence Quality",
 "Build 450 · Local Search Measurement &amp; Conversion Attribution",
 'id="localEvidenceQuality460"',
 "No provider metric is divided by, correlated with or causally attributed to a funnel conversion rate."
],"Build 460 page")
if page!=copy: errors.append("admin-seo-tasks route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("admin-seo-tasks must retain exactly one H1")

require(contract,[
 "# Build 460 — Local Search Provider & Attribution Evidence Quality",
 "comparability",
 "provider_dependent","owner_action","bounded_partial","window_mismatch","window_unknown","comparable_observed",
 "causal conversion","Build 461 — Booking & Quote Experiment Readiness"
],"Build 460 contract")
require(blockers,["Local-search provider evidence"],"canonical HOLD backlog")
require(queue,["BUILD460_LOCAL_SEARCH_PROVIDER_ATTRIBUTION_EVIDENCE_QUALITY.md","FORWARD_BUILD_ROADMAP_456_465.md"],"release queue")
require(handoff,["BUILD460_LOCAL_SEARCH_PROVIDER_ATTRIBUTION_EVIDENCE_QUALITY.md","local_search_provider_attribution_evidence_quality_check.py"],"project handoff")
require(readme,["BUILD460_LOCAL_SEARCH_PROVIDER_ATTRIBUTION_EVIDENCE_QUALITY.md","local_search_provider_attribution_evidence_quality_check.py"],"README")
require(retained450,[
 "BUILD450_LOCAL_SEARCH_MEASUREMENT_CONVERSION_ATTRIBUTION.md",
 "local_search_provider_evidence_refresh_check.py",
 "local_search_measurement_conversion_attribution_test.mjs"
],"retained Build 450 authority")

commands=[
 ["node","--check","functions/api/_lib/local-search-measurement-conversion-attribution.js"],
 ["node","--check","functions/api/admin/local_search_measurement_conversion_attribution.js"],
 ["node","--check","assets/build450-local-search-measurement-conversion-attribution.js"],
 ["node","--check","scripts/local_search_provider_attribution_evidence_quality_test.mjs"],
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
 r=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 if r.returncode!=0: errors.append(f"{' '.join(command)} failed: {r.stderr.strip() or r.stdout.strip()}")

if errors:
 print("LOCAL SEARCH PROVIDER & ATTRIBUTION EVIDENCE QUALITY AUTHORITY: FAIL")
 for error in errors: print(" -",error)
 sys.exit(1)

print("LOCAL SEARCH PROVIDER & ATTRIBUTION EVIDENCE QUALITY AUTHORITY: PASS")
print(" - retained Build 440/450 provider and same-session authorities are enriched in place")
print(" - provider freshness, identity, dated-window alignment and first-party boundedness are explicit")
print(" - provider outcomes remain distinct from anonymous funnel observations")
print(" - no metric-to-funnel ratio, correlation score, identity join or causal conversion claim is produced")
print(" - no provider/analytics/schema/publishing/outreach/DNS/ad-spend mutation or permanent polling")
