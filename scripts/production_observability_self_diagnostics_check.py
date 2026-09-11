#!/usr/bin/env python3
"""Build 379 source authority: Production Observability & Self-Diagnostics."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f"BUILD 379 FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        fail(f"missing required file: {path}")
    return target.read_text(encoding="utf-8")


endpoint = read("functions/api/admin/production_diagnostics.js")
page = read("admin/it.html")
doc = read("PRODUCTION_OBSERVABILITY_SELF_DIAGNOSTICS.md")
workflow = read(".github/workflows/production-observability-self-diagnostics-authority.yml")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
production_helper = read("scripts/cloudflare_pages_production_acceptance.sh")

required_endpoint = [
    "requireStaffAccess",
    'capability: "it_diagnostics"',
    "failure_families",
    '"source"', '"build"', '"deploy"', '"configuration"', '"runtime"',
    "SUPABASE_URL", "R2_MEDIA", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
    "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID",
    'new URL("/api/health"',
    "remediation",
    '"Cache-Control": "no-store"',
    "R2_MEDIA.list({ limit: 1 })",
]
for needle in required_endpoint:
    if needle not in endpoint:
        fail(f"diagnostics endpoint is missing contract: {needle}")

if "setInterval(" in endpoint or "setInterval(" in page:
    fail("recurring setInterval polling is prohibited")
if re.search(r"\b(method\s*:\s*[\"'](?:POST|PUT|PATCH|DELETE)[\"'])", endpoint, re.I):
    fail("diagnostics endpoint contains a mutating HTTP method")
if re.search(r"\.\s*(?:put|delete)\s*\(", endpoint):
    fail("diagnostics endpoint contains an R2 mutation primitive")

for secret_pattern in [
    r"STRIPE_SECRET_KEY\s*[:=]\s*[^\n]+",
    r"PAYPAL_CLIENT_SECRET\s*[:=]\s*[^\n]+",
    r"SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*[^\n]+",
]:
    # Environment-variable references are allowed; hard-coded credential-like values are not.
    for match in re.findall(secret_pattern, endpoint):
        if "env" not in match and "clean(" not in match:
            fail("possible hard-coded sensitive value in diagnostics endpoint")

required_page = [
    "Production observability &amp; self-diagnostics",
    "/api/admin/production_diagnostics",
    "Refresh Diagnostics",
    "Failure family:",
    "Corrective action",
    "credentials: 'same-origin'",
]
for needle in required_page:
    if needle not in page:
        fail(f"I.T. page is missing operator contract: {needle}")

for needle in ["source", "build", "deploy", "configuration", "runtime", "No database migration", "Source GREEN alone is never Production GREEN"]:
    if needle not in doc:
        fail(f"Build 379 authority document is missing: {needle}")

required_workflow = [
    "Build 379 — Production Observability & Self-Diagnostics",
    "contents: read",
    "python3 scripts/production_observability_self_diagnostics_check.py",
    "scripts/cloudflare_pages_production_acceptance.sh",
    "secrets.ROSIEDAZZLERS_TOKEN",
    "secrets.CLOUDFLARE_ACCOUNT_ID",
    "github.sha",
]
for needle in required_workflow:
    if needle not in workflow:
        fail(f"Build 379 workflow is missing: {needle}")

if re.search(r"permissions:\s*\n\s*contents:\s*write", workflow):
    fail("Build 379 workflow must remain read-only")
if any(token in workflow for token in ["wrangler pages deploy", "curl -X POST", "curl --request POST", "git push --force"]):
    fail("Build 379 workflow contains a prohibited mutation primitive")

for needle in ["Build 378", "Build 379", "Build 380", "Production Observability & Self-Diagnostics"]:
    if needle not in queue:
        fail(f"release queue is missing converged release state: {needle}")
if "**Build 379 — Production Observability & Self-Diagnostics** is the active bounded release." not in queue:
    fail("release queue does not mark Build 379 current")

if "PRODUCTION EXACT-SHA ACCEPTANCE: PASS" not in production_helper:
    fail("durable Production exact-SHA helper contract is missing")

migration_matches = [p for p in ROOT.rglob("*.sql") if "379" in p.name.lower() or "build379" in str(p).lower()]
if migration_matches:
    fail("Build 379 must remain schema-neutral; found SQL migration artifact(s): " + ", ".join(str(p.relative_to(ROOT)) for p in migration_matches))

print("BUILD 379 PRODUCTION OBSERVABILITY / SELF-DIAGNOSTICS: PASS")
print("- authenticated I.T. diagnostics authority present")
print("- source/build/deploy/configuration/runtime failure taxonomy present")
print("- Supabase/R2/API probes are bounded and read-only")
print("- Stripe/PayPal configuration is presence-only; secrets remain hidden")
print("- no recurring polling or Build 379 schema migration")
print("- durable Production exact-SHA authority retained")
