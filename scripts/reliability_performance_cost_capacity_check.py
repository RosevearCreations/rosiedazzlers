#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

helper = read("functions/api/_lib/reliability-performance-cost-capacity.js")
endpoint = read("functions/api/admin/reliability_performance_cost_capacity.js")
analytics = read("functions/api/analytics/ingest.js")
test = read("scripts/reliability_performance_cost_capacity_test.mjs")
policy = read("BUILD423_RELIABILITY_PERFORMANCE_COST_CAPACITY.md").lower()
workflow = read(".github/workflows/reliability-performance-cost-capacity-authority.yml")
page = read("admin/reliability-capacity.html")

for token in (
    "build: 423",
    'mode: "reliability_performance_cost_capacity"',
    "cloudflare_billing_or_cpu_usage_measured: false",
    "cost_amount_inferred: false",
    "future_capacity_guaranteed: false",
    "single_snapshot_is_capacity_forecast: false",
    "manual_refresh_only: true",
    "permanent_polling: false",
    "automatic_retry_expansion_allowed: false",
    "automatic_cache_policy_mutation_allowed: false",
    "automatic_capacity_scaling_allowed: false",
    "provider_mutation_allowed: false",
    "business_mutation_allowed: false",
    "schema_authority: false",
):
    if token not in helper:
        errors.append(f"Build 423 helper missing {token}")

for token in (
    "requireStaffAccess",
    'capability: "it_diagnostics"',
    "getProductionDiagnostics",
    "site_activity_events",
    'Prefer: "count=exact"',
    'Range: "0-0"',
    "events_24h",
    "events_7d",
    "methodNotAllowed",
    '"GET", "HEAD", "OPTIONS"',
    '"Cache-Control": "no-store"',
):
    if token not in endpoint:
        errors.append(f"Build 423 endpoint missing {token}")

for token in (
    "MAX_EVENTS_PER_REQUEST = 12",
    "MAX_BODY_BYTES = 64 * 1024",
    "one settings read + one event insert",
    "analytics always fails open",
):
    if token.lower() not in analytics.lower():
        errors.append(f"retained analytics bounded-cost authority missing {token}")

for token in (
    "cloudflare billing",
    "single snapshot is not a capacity forecast",
    "reducing dependency calls",
    "safe cache",
    "analytics batching",
    "no permanent polling",
    "no cost-amplifying automatic retry",
    "no automatic capacity scaling",
    "no schema migration",
):
    if token not in policy:
        errors.append(f"Build 423 policy missing {token}")

for token in (
    "Reliability, performance &amp; cost capacity",
    "/api/admin/reliability_performance_cost_capacity",
    "Refresh Capacity Snapshot",
    "Cloudflare billing/CPU metrics are not inferred",
):
    if token not in page:
        errors.append(f"Build 423 operator page missing {token}")

for token in (
    "Build 423 — Reliability, Performance & Cost Capacity Authority",
    "python scripts/reliability_performance_cost_capacity_check.py",
    "node scripts/reliability_performance_cost_capacity_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 423 workflow missing {token}")

if "RELIABILITY / PERFORMANCE / COST CAPACITY TEST: PASS" not in test:
    errors.append("Build 423 executable test is missing PASS authority")

if "setInterval(" in endpoint or "setInterval(" in helper:
    errors.append("Build 423 must not introduce permanent interval polling")
if re.search(r'method\s*:\s*["\'](?:POST|PUT|PATCH|DELETE)["\']', endpoint, re.I):
    errors.append("Build 423 read-only endpoint contains a mutating fetch method")
if any("423" in p.name.lower() for p in ROOT.rglob("*.sql")):
    errors.append("Build 423 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/reliability-performance-cost-capacity.js"],
    ["node", "--check", "functions/api/admin/reliability_performance_cost_capacity.js"],
    ["node", "--check", "scripts/reliability_performance_cost_capacity_test.mjs"],
    ["node", "scripts/reliability_performance_cost_capacity_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 423 RELIABILITY / PERFORMANCE / COST CAPACITY AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 423 RELIABILITY / PERFORMANCE / COST CAPACITY AUTHORITY: PASS")
print(" - Production diagnostics and first-party traffic counts remain bounded and read-only")
print(" - Cloudflare billing, CPU use and future capacity are never inferred")
print(" - recommendations do not mutate caching, retries, scaling or providers")
print(" - no permanent polling and no Build 423 schema migration")
