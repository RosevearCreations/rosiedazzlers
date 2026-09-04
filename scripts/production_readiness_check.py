#!/usr/bin/env python3
"""Fail-closed source authority for Build 323 Production readiness evidence."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin-production-readiness.html"
CLIENT = ROOT / "assets" / "admin-production-readiness-v323.js"
API = ROOT / "functions" / "api" / "admin" / "production_readiness.js"
WORKFLOW = ROOT / ".github" / "workflows" / "development-source-gate.yml"
errors = []


def require(path: Path, needles, label):
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required contract: {needle!r}")
    return text


page = require(PAGE, [
    "Production Readiness",
    "Development evidence only — Production remains closed.",
    "Ready for human review",
    "Missing evidence is reported as incomplete rather than guessed.",
    "Operating Help",
    "/assets/admin-production-readiness-v323.js",
    "@media(max-width:820px)",
    "@media(max-width:600px)",
    "@media(max-width:480px)",
    "min-height:44px",
], "Production readiness page")

client = require(CLIENT, [
    '/api/admin/production_readiness',
    'method: "GET"',
    "c.read_only === true",
    "c.evidence_only === true",
    "c.git_mutation === false",
    "c.cloudflare_mutation === false",
    "c.production_promotion === false",
    "c.database_mutation === false",
    "c.automatic_promotion === false",
    "data?.release_boundary?.production_closed === true",
    "Do not infer Production readiness",
], "Production readiness client")

api = require(API, [
    'requireActionAccess(auth.actor, "it.runtime.view")',
    'env?.CF_PAGES_BRANCH',
    'env?.CF_PAGES_COMMIT_SHA',
    'env?.CF_PAGES_URL',
    'state = valuesPresent === 3 ? "present" : valuesPresent > 0 ? "partial" : "unavailable"',
    'runtime.branch === "main"',
    'runtime.development_like && stripe === "live"',
    'runtime.development_like && stripe === "unknown"',
    'overallState = "ready_for_human_review"',
    'overallState = "blocked"',
    'overallState = "evidence_incomplete"',
    'live_run_verified: false',
    'read_only: true',
    'evidence_only: true',
    'git_mutation: false',
    'cloudflare_mutation: false',
    'production_promotion: false',
    'database_mutation: false',
    'automatic_promotion: false',
    'secret_values_exposed: false',
    'production_closed: true',
    'statement: "Development evidence only — Production remains closed."',
    'Production readiness is read-only in Build 323.',
], "Production readiness API")

workflow = require(WORKFLOW, [
    "assets/admin-production-readiness-v323.js",
    "functions/api/admin/production_readiness.js",
    "scripts/production_readiness_check.py",
    "python scripts/production_readiness_check.py",
    "Production readiness authority: PASS",
], "current source gate")

# Browser is strictly read-only.
for needle in ['method: "POST"', 'method:"POST"', 'method: "PATCH"', 'method:"PATCH"', 'method: "DELETE"', 'method:"DELETE"']:
    if needle in client:
        errors.append(f"Production readiness client contains mutation request: {needle}")

# API GET must contain no provider/Cloudflare/Git mutation primitives.
get_match = re.search(r"export async function onRequestGet\([\s\S]*?\n}\n\nexport async function onRequestPost", api)
if not get_match:
    errors.append("could not isolate Production readiness GET handler")
else:
    handler = get_match.group(0)
    for needle in [
        'method: "POST"', 'method:"POST"', 'method: "PATCH"', 'method:"PATCH"',
        'method: "DELETE"', 'method:"DELETE"', "api.cloudflare.com", "api.github.com",
        "git push", "update-ref", "final_balance_checkout_create", "booking_finance",
    ]:
        if needle in handler:
            errors.append(f"Production readiness GET contains mutation/external control primitive: {needle}")

# The API may classify a secret server-side but may not serialize secret material.
for needle in ["secret_key:", "secret_value:", "api_key:", "client_secret:", "stripe_secret_key:"]:
    if needle in api.lower():
        errors.append(f"Production readiness API may serialize secret material: {needle}")

# Readiness must never claim current CI run verification from this runtime authority.
if "live_run_verified: true" in api:
    errors.append("Production readiness API falsely claims live workflow verification")
if "ready_for_human_review" not in api or "readiness_is_not_authorization: true" not in api:
    errors.append("Production readiness does not separate evidence readiness from promotion authorization")

# Production/main must remain an explicit blocker when detected at runtime.
main_block = re.search(r'if \(runtime\.branch === "main"[\s\S]{0,500}?blockers\.push', api)
if not main_block:
    errors.append("Production-like runtime is not visibly blocked")

# Responsive admin evidence view is required on desktop/tablet/mobile.
if "grid-template-columns:1fr" not in page or "min-height:44px" not in page:
    errors.append("Production readiness page is missing mobile/touch safeguards")

# Build 323 is source-only.
migrations = list(ROOT.glob("**/*323*.sql"))
if migrations:
    errors.append("Build 323 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION READINESS: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PRODUCTION READINESS: PASS")
print("- I.T. runtime view permission is enforced")
print("- dashboard and API are read-only and evidence-only")
print("- Git, Cloudflare, database and Production promotion mutation are disabled")
print("- missing runtime identity is incomplete evidence rather than inferred readiness")
print("- Production runtime and unsafe Stripe Development modes fail closed")
print("- source authorities do not masquerade as live workflow verification")
print("- readiness is explicitly not promotion authorization")
print("- desktop/tablet/mobile presentation is protected")
print("- no Build 323 database migration is present")
