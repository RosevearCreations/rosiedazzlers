#!/usr/bin/env python3
"""Build 381 source authority: Operations Daily Command Centre."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f"BUILD 381 FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        fail(f"missing required file: {path}")
    return target.read_text(encoding="utf-8")


page = read("admin-operations.html")
client = read("assets/admin-operations.js")
doc = read("OPERATIONS_DAILY_COMMAND_CENTRE.md")
workflow = read(".github/workflows/operations-daily-command-centre-authority.yml")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
production_helper = read("scripts/cloudflare_pages_production_acceptance.sh")

for needle in [
    'data-build381="operations-daily-command-centre"',
    '<h1>Daily Command Centre</h1>',
    'content="noindex,nofollow"',
    '/assets/admin-auth.js',
    '/assets/admin-shell.js',
    '/assets/admin-operations.js?v=20260911build381',
    '/admin-booking.html',
    '/admin-today.html',
    '/admin-inventory.html',
]:
    if needle not in page:
        fail(f"Operations page missing contract: {needle}")

if len(re.findall(r"<h1\b", page, flags=re.I)) != 1:
    fail("Operations page must contain exactly one H1")

for needle in [
    'const BUILD = 381',
    'const LIST_ENDPOINT = "/api/admin/bookings"',
    'const FINANCE_ENDPOINT = "/api/admin/booking_finance"',
    'body: JSON.stringify({})',
    'method: "GET"',
    'pageKey: "app-operations"',
    'service_date',
    'assigned_staff_name',
    'trusted_service_coordinate_status',
    'arrival_geofence_status',
    'price_total_cents',
    'collected_total',
    'package_code',
    'admin-assign?booking_id=',
    'admin-jobsite?booking_id=',
    'admin-progress?booking_id=',
    'admin-payment.html?booking_id=',
    'no canonical live travel/traffic evidence',
    'Exact product/equipment proof is not fabricated here',
]:
    if needle not in client:
        fail(f"Operations client missing authority/evidence contract: {needle}")

if "setInterval(" in client:
    fail("Operations command centre must not introduce recurring polling")
if "localStorage" in client or "sessionStorage" in client:
    fail("Operations command centre must not add a browser-side operations ledger")
for token in ['method: "PATCH"', 'method: "PUT"', 'method: "DELETE"', "fetch('/api/admin/assign_booking'", 'fetch("/api/admin/assign_booking"']:
    if token in client:
        fail(f"Operations command centre contains direct mutation primitive: {token}")
if "booking_id:" in re.sub(r"admin-(?:assign|jobsite|progress|payment)[^\n]+", "", client):
    fail("Operations list request must never send booking_id to the mutable bookings endpoint")

for needle in [
    "aggregator, not a ledger",
    "empty `POST {}` request for its read/list path",
    "never supplies `booking_id`",
    "never invents operational evidence",
    "Live traffic/travel conditions are shown as `Unknown`",
    "Exact required product/equipment proof is not inferred",
    "No database migration is required",
    "schema-neutral",
    "no background polling",
]:
    if needle not in doc:
        fail(f"Operations authority document missing: {needle}")

for needle in [
    "Build 381 — Operations Daily Command Centre",
    "contents: read",
    "python3 scripts/operations_daily_command_centre_check.py",
    "node --check assets/admin-operations.js",
    "scripts/cloudflare_pages_production_acceptance.sh",
    "secrets.ROSIEDAZZLERS_TOKEN",
    "secrets.CLOUDFLARE_ACCOUNT_ID",
    "github.sha",
]:
    if needle not in workflow:
        fail(f"Build 381 workflow missing: {needle}")

if re.search(r"permissions:\s*\n\s*contents:\s*write", workflow):
    fail("Build 381 workflow must remain read-only")
if any(token in workflow for token in ["wrangler pages deploy", "git push --force", "curl -X POST", "curl --request POST"]):
    fail("Build 381 workflow contains a prohibited release mutation primitive")

# Build 381 is retained after the living release moves forward. Validate that
# the queue and handoff remain sequential and synchronized without requiring
# this completed historical build to stay marked as the active release.
queue_builds = [int(value) for value in re.findall(r"\*\*Build\s+(\d{3})\s+—", queue)]
handoff_builds = [int(value) for value in re.findall(r"\*\*Build\s+(\d{3})\s+—", handoff)]
if len(queue_builds) != 3:
    fail(f"release queue must expose exactly accepted/current/next numbered states; found {queue_builds}")
accepted, current, next_release = queue_builds
if accepted < 381:
    fail(f"release queue regressed before retained Build 381 authority: accepted={accepted}")
if current != accepted + 1 or next_release != current + 1:
    fail(f"release queue is not sequential: {queue_builds}")
if handoff_builds != queue_builds:
    fail(f"project handoff sequence {handoff_builds} does not match release queue {queue_builds}")
for needle in [
    "retained exact-SHA Development source/runtime authorities",
    "Source promotion alone is never Production proof.",
    "Production exact-SHA authority",
]:
    if needle not in handoff:
        fail(f"project handoff missing durable retained-release discipline: {needle}")

if "PRODUCTION EXACT-SHA ACCEPTANCE: PASS" not in production_helper:
    fail("durable Production exact-SHA helper contract is missing")

migration_matches = [p for p in ROOT.rglob("*.sql") if "381" in p.name.lower() or "build381" in str(p).lower()]
if migration_matches:
    fail("Build 381 is schema-neutral; found SQL migration artifact(s): " + ", ".join(str(p.relative_to(ROOT)) for p in migration_matches))

print("BUILD 381 OPERATIONS DAILY COMMAND CENTRE: PASS")
print("- today appointments aggregate existing booking and finance authorities")
print("- site/travel, equipment/product, assignment, completion and follow-up evidence fail closed when missing")
print("- all operational changes remain delegated to canonical admin authorities")
print("- no recurring polling, browser-side operations ledger, direct operational mutation, or schema migration")
print("- retained authority remains compatible with an advanced release queue")
print("- durable exact-SHA Production authority retained")
