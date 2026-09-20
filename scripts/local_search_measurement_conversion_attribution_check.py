#!/usr/bin/env python3
"""Build 450 Local Search Measurement & Conversion Attribution source authority."""
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
contract=read("BUILD450_LOCAL_SEARCH_MEASUREMENT_CONVERSION_ATTRIBUTION.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
retained440=read("scripts/local_search_provider_evidence_refresh_check.py")

require(helper,[
 "buildLocalSearchMeasurementConversionAttribution",
 "deriveSameSessionConversionAttribution",
 'authority: "local_search_measurement_conversion_attribution"',
 'attribution_rule: "same_session_only"',
 "search_console_click_to_session_join: false",
 "gbp_action_to_session_join: false",
 "provider_metric_to_booking_join: false",
 "first_party_same_session_causation_inferred: false",
 "anonymous_session_to_customer_identity_join: false",
 "persisted_booking_attributed_to_anonymous_session: false",
 "analytics_write_performed: false",
 "provider_contact_performed: false",
 "provider_snapshot_write_performed: false",
 "permanent_polling: false"
],"Build 450 helper")

require(endpoint,[
 "getProviderRefresh",
 "site_activity_events",
 "session_id,event_type,page_path,referrer,source,campaign,checkout_state,created_at,payload",
 "EVENT_ROW_LIMIT = 5000",
 "local_search_measurement_conversion_attribution",
 "GET,HEAD,OPTIONS"
],"Build 450 endpoint")
for token in ["visitor_id","ip_address","user_agent","customer_profile_id","onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval("]:
 if token in endpoint:
  errors.append(f"Build 450 endpoint contains forbidden identity/mutation token {token!r}")

require(client,[
 'fetch("/api/admin/local_search_measurement_conversion_attribution"',
 'method: "GET"',
 "Same-session",
 "session-level join: no",
 "No provider or analytics write was performed."
],"Build 450 client")
for token in ['method: "POST"','method: "PATCH"','method: "DELETE"','method: "PUT"',"localStorage","sessionStorage","setInterval("]:
 if token in client:
  errors.append(f"Build 450 client contains forbidden mutation/polling token {token!r}")

require(page,[
 'data-build450="local-search-measurement-conversion-attribution"',
 "Build 450 · Local Search Measurement &amp; Conversion Attribution",
 'id="refreshLocalConversion450"',
 'id="localConversionSummary450"',
 'id="localConversionCohorts450"',
 'id="localConversionLanding450"',
 'id="localConversionProvider450"',
 "/assets/build450-local-search-measurement-conversion-attribution.js"
],"Build 450 page")
if page!=copy:
 errors.append("admin-seo-tasks route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1:
 errors.append("admin-seo-tasks must retain exactly one H1")

require(contract,[
 "# Build 450 — Local Search Measurement & Conversion Attribution",
 "same-session",
 "Search Console",
 "Google Business Profile",
 "landing-page",
 "booking-funnel",
 "not causal",
 "Build 451 — Booking Funnel, Quote & Pricing Learning"
],"Build 450 contract")
require(blockers,["Local-search provider evidence","Build 450","same-session"],"canonical HOLD backlog")
require(queue,[
 "**Build 451 — Booking Funnel, Quote & Pricing Learning** is the active bounded release.",
 "BUILD450_LOCAL_SEARCH_MEASUREMENT_CONVERSION_ATTRIBUTION.md",
 "**Build 452 — Staff Workflow, Support & Mobile Efficiency Learning** is next"
],"release queue")
require(handoff,[
 "**Build 451 — Booking Funnel, Quote & Pricing Learning** is the active bounded release.",
 "BUILD450_LOCAL_SEARCH_MEASUREMENT_CONVERSION_ATTRIBUTION.md",
 "local_search_measurement_conversion_attribution_check.py"
],"project handoff")
require(readme,[
 "Current source direction: **Build 451 — Booking Funnel, Quote & Pricing Learning**.",
 "BUILD450_LOCAL_SEARCH_MEASUREMENT_CONVERSION_ATTRIBUTION.md",
 "local_search_measurement_conversion_attribution_check.py"
],"README")
require(retained440,[
 "BUILD440_LOCAL_SEARCH_PROVIDER_EVIDENCE_REFRESH.md",
 "release queue retained authority",
 "project handoff retained authority"
],"retained Build 440 authority")

for gate,label in [(dev,"Development gate"),(prod,"Production gate")]:
 require(gate,[
  "local_search_measurement_conversion_attribution_check.py",
  "local_search_measurement_conversion_attribution_test.mjs"
 ],label)

for path in [
 "functions/api/_lib/local-search-measurement-conversion-attribution.js",
 "functions/api/admin/local_search_measurement_conversion_attribution.js",
 "assets/build450-local-search-measurement-conversion-attribution.js",
 "scripts/local_search_measurement_conversion_attribution_test.mjs"
]:
 r=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
 if r.returncode:
  errors.append(f"{path} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
 ["node","scripts/local_search_measurement_conversion_attribution_test.mjs"],
 ["python","scripts/local_search_provider_evidence_refresh_check.py"],
 ["node","scripts/local_search_provider_evidence_refresh_test.mjs"],
 ["python","scripts/local_search_measurement_authority_check.py"],
 ["python","scripts/local_acquisition_evidence_closure_check.py"],
 ["node","scripts/local_acquisition_evidence_closure_test.mjs"],
 ["python","scripts/local_acquisition_content_proof_check.py"],
 ["node","scripts/local_acquisition_content_proof_test.mjs"],
 ["python","scripts/booking_rebooking_funnel_check.py"],
 ["node","scripts/booking_rebooking_funnel_test.mjs"]
]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode:
  errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
 print("LOCAL SEARCH MEASUREMENT & CONVERSION ATTRIBUTION AUTHORITY: FAIL")
 for error in errors:
  print(" -",error)
 sys.exit(1)

print("LOCAL SEARCH MEASUREMENT & CONVERSION ATTRIBUTION AUTHORITY: PASS")
print(" - retained Search Console/GBP evidence remains provider-attributed and separate")
print(" - landing/referral to booking-funnel attribution is anonymous same-session evidence only")
print(" - no provider metric is joined to a session or treated as causal conversion evidence")
print(" - no anonymous session is joined to customer identity or persisted booking outcome")
print(" - no schema/provider/analytics/publishing/outreach/DNS/ad-spend mutation or permanent polling")
