#!/usr/bin/env python3
"""Build 480 Local Search Provider Snapshot Continuity & Descriptive Review authority.
Retained validation is release-state independent: living current/next labels may advance.
"""
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
provider_helper=read("functions/api/_lib/local-search-provider-evidence-refresh.js")
report=read("functions/api/admin/local_search_measurement_report.js")
save=read("functions/api/admin/local_search_provider_evidence_save.js")
endpoint=read("functions/api/admin/local_search_measurement_conversion_attribution.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html")
copy=read("admin-seo-tasks/index.html")
contract=read("BUILD480_LOCAL_SEARCH_PROVIDER_SNAPSHOT_CONTINUITY_DESCRIPTIVE_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_476_485.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow=read(".github/workflows/local-search-provider-snapshot-continuity-descriptive-review-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")

require(helper,[
 "buildLocalSearchProviderSnapshotContinuity",
 "provider_snapshot_continuity_build: 480",
 'provider_snapshot_continuity_authority: "local_search_provider_snapshot_continuity_descriptive_review"',
 'authority:"local_search_provider_snapshot_continuity_descriptive_review"',
 '"descriptive_review_ready"',
 '"continuity_incomplete"',
 '"insufficient_history"',
 '"identity_mismatch"',
 '"duplicate_window"',
 '"window_mismatch"',
 "same_property_or_location_required:true",
 "equal_length_provider_windows_required:true",
 "metric_deltas_are_descriptive_only:true",
 "provider_performance_score_calculated:false",
 "provider_to_funnel_causation_claimed:false",
 'region:"Southern Ontario, Canada"',
 "winter_service_availability_inferred:false",
 "service_temperature_limits_inferred:false",
 "cold_snap_service_capability_inferred:false",
 "search_or_funnel_change_interpreted_as_weather_effect:false"
],"Build 480 helper")

require(report,[
 "provider_history: providerHistory",
 "sanitizeHistory",
 "SNAPSHOT_HISTORY_LIMIT = 12"
],"Build 480 measurement report")
require(provider_helper,[
 "summarizeProviderHistory",
 "history,"
],"Build 480 provider refresh")
require(save,[
 "HISTORY_LIMIT = 12",
 "previousCurrent",
 "dedupeHistory",
 "continuity_history_count",
 "prior valid snapshot is retained only for bounded descriptive continuity review"
],"Build 480 explicit provider save")
for forbidden in [
 "searchconsole.googleapis.com","mybusiness.googleapis.com","businessprofileperformance.googleapis.com",
 "accounts.google.com/o/oauth","client_secret","refresh_token","access_token","setInterval("
]:
 if forbidden in helper+report+save+endpoint:
  errors.append(f"Build 480 contains forbidden provider credential/polling token {forbidden!r}")

require(endpoint,[
 "provider_snapshot_continuity_build: 480",
 'provider_snapshot_continuity_authority: "local_search_provider_snapshot_continuity_descriptive_review"',
 '"X-Rosie-Local-Search-Snapshot-Continuity": "build-480-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 480 endpoint")
for token in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval("]:
 if token in endpoint: errors.append(f"Build 480 read-only endpoint contains forbidden token {token!r}")

require(client,[
 "renderProviderSnapshotContinuity480",
 "localProviderSnapshotContinuity480",
 "Build 480 continuity state",
 "Southern Ontario seasonal truth boundary",
 "No provider or analytics write was performed."
],"Build 480 workbench client")
for token in ['method: "POST"','method: "PATCH"','method: "DELETE"','method: "PUT"',"localStorage","sessionStorage","setInterval("]:
 if token in client: errors.append(f"Build 480 continuity client contains forbidden mutation/polling token {token!r}")

require(page,[
 'data-build480="local-search-provider-snapshot-continuity-descriptive-review"',
 "Build 480 · Local Search Provider Snapshot Continuity &amp; Descriptive Review",
 'id="localProviderSnapshotContinuity480"',
 "Southern Ontario weather, cold snaps and service temperature limits are separate operational constraints"
],"Build 480 page")
if page!=copy: errors.append("admin-seo-tasks route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("admin-seo-tasks must retain exactly one H1")

require(contract,[
 "# Build 480 — Local Search Provider Snapshot Continuity & Descriptive Review",
 "bounded history of prior valid snapshots",
 "insufficient_history",
 "descriptive_review_ready",
 "Southern Ontario, Canada",
 "no service temperature threshold is invented from analytics",
 "Build 481 — Booking & Quote Experiment Approval & Measurement Lock"
],"Build 480 contract")
require(roadmap,[
 "Southern Ontario seasonal-service truth direction",
 "weather-ineligible sessions",
 "cold-snap-capable services",
 "temperature-constrained outdoor services",
 "controlled-environment alternatives"
],"seasonal roadmap direction")
require(queue,[
 "BUILD480_LOCAL_SEARCH_PROVIDER_SNAPSHOT_CONTINUITY_DESCRIPTIVE_REVIEW.md",
 "FORWARD_BUILD_ROADMAP_476_485.md"
],"release queue retained Build 480 authority")
require(handoff,[
 "BUILD480_LOCAL_SEARCH_PROVIDER_SNAPSHOT_CONTINUITY_DESCRIPTIVE_REVIEW.md",
 "local_search_provider_snapshot_continuity_descriptive_review_check.py"
],"project handoff retained Build 480 authority")
require(readme,[
 "BUILD480_LOCAL_SEARCH_PROVIDER_SNAPSHOT_CONTINUITY_DESCRIPTIVE_REVIEW.md",
 "local_search_provider_snapshot_continuity_descriptive_review_check.py"
],"README retained Build 480 authority")
require(blockers,["Local-search provider evidence"],"canonical HOLD backlog")
require(workflow,[
 "Build 480 — Local Search Provider Snapshot Continuity & Descriptive Review Authority",
 "local-search-provider-snapshot-continuity-descriptive-review",
 "local_search_provider_snapshot_continuity_descriptive_review_check.py",
 "local_search_provider_snapshot_continuity_descriptive_review_test.mjs"
],"focused workflow")
for gate,label in ((dev,"Development source gate"),(prod,"Production business acceptance")):
 require(gate,[
  "python -m py_compile scripts/local_search_provider_snapshot_continuity_descriptive_review_check.py",
  "node --check scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs",
  "python scripts/local_search_provider_snapshot_continuity_descriptive_review_check.py",
  "node scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs"
 ],label)

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])480(?:[^0-9]|$)",p.name)]
if migrations:
 errors.append("Build 480 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

commands=[
 ["node","--check","functions/api/_lib/local-search-measurement-conversion-attribution.js"],
 ["node","--check","functions/api/_lib/local-search-provider-evidence-refresh.js"],
 ["node","--check","functions/api/admin/local_search_measurement_report.js"],
 ["node","--check","functions/api/admin/local_search_provider_evidence_save.js"],
 ["node","--check","functions/api/admin/local_search_measurement_conversion_attribution.js"],
 ["node","--check","assets/build450-local-search-measurement-conversion-attribution.js"],
 ["node","--check","scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs"],
 ["node","scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs"],
 ["python","scripts/local_search_provider_window_attribution_closure_check.py"],
 ["node","scripts/local_search_provider_window_attribution_closure_test.mjs"],
 ["python","scripts/local_search_provider_attribution_evidence_quality_check.py"],
 ["node","scripts/local_search_provider_attribution_evidence_quality_test.mjs"],
 ["python","scripts/local_search_measurement_conversion_attribution_check.py"],
 ["node","scripts/local_search_measurement_conversion_attribution_test.mjs"],
 ["python","scripts/local_search_provider_evidence_refresh_check.py"],
 ["node","scripts/local_search_provider_evidence_refresh_test.mjs"],
 ["python","scripts/local_search_measurement_authority_check.py"]
]
for command in commands:
 result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 if result.returncode:
  errors.append("command failed: "+" ".join(command)+"\n"+result.stdout+result.stderr)

if errors:
 print("LOCAL SEARCH PROVIDER SNAPSHOT CONTINUITY & DESCRIPTIVE REVIEW AUTHORITY: FAIL")
 for error in errors: print(" -",error)
 sys.exit(1)

print("LOCAL SEARCH PROVIDER SNAPSHOT CONTINUITY & DESCRIPTIVE REVIEW AUTHORITY: PASS")
print(" - explicit staff provider saves retain bounded prior valid snapshot history without a new schema")
print(" - continuity requires matching property/location identity and equal-length distinct windows")
print(" - raw provider metric deltas remain descriptive and separate from first-party funnel context")
print(" - Southern Ontario weather/service-operability claims are not inferred from search or funnel evidence")
print(" - no Google API contact, automatic provider write, ranking claim, customer join or permanent polling")
