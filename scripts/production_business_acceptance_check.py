#!/usr/bin/env python3
"""Fail-closed source authority for Build 377 Production business acceptance."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "production-business-acceptance-authority.yml"
PRODUCTION_HELPER = ROOT / "scripts" / "cloudflare_pages_production_acceptance.sh"
CONTRACT = ROOT / "PRODUCTION_BUSINESS_ACCEPTANCE.md"
QUEUE = ROOT / "AUTONOMOUS_RELEASE_QUEUE.md"
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


required_authorities = {
    "acquisition": ["scripts/seo_h1_check.py", "scripts/seo_metadata_check.py"],
    "booking": [
        "scripts/booking_funnel_device_check.py",
        "scripts/booking_wizard_responsive_ux_check.py",
        "scripts/build362_quote_booking_acceptance_check.py",
    ],
    "payment": [
        "scripts/payment_provider_readiness_check.py",
        "scripts/payment_acceptance_evidence_check.py",
        "scripts/payment_recovery_customer_handoff_check.py",
        "scripts/payment_reconciliation_check.py",
        "scripts/payment_reconciliation_month_end_closure_check.py",
        "scripts/final_balance_readiness_check.py",
    ],
    "customer_vehicle": ["scripts/checkout_customer_vehicle_identity_test.mjs"],
    "staff_work": ["scripts/build369_mobile_job_readiness_check.py"],
    "completion_proof": ["scripts/booking_completion_retention_check.py"],
    "review": [
        "scripts/build363_review_request_eligibility_check.py",
        "scripts/build364_review_request_dispatch_check.py",
        "scripts/build365_review_proof_local_seo_check.py",
    ],
    "rebook_retention": [
        "scripts/booking_rebooking_funnel_check.py",
        "scripts/maintenance_retention_check.py",
    ],
    "maintenance_fleet": [
        "scripts/maintenance_plan_business_rulebook_check.py",
        "scripts/maintenance_plan_pilot_activation_check.py",
        "scripts/fleet_business_rulebook_check.py",
        "scripts/fleet_account_operations_check.py",
        "scripts/fleet_maintenance_planning_check.py",
    ],
    "recovery_security": [
        "scripts/release_rollback_recovery_check.py",
        "scripts/performance_accessibility_security_check.py",
    ],
}

for stage, paths in required_authorities.items():
    for rel in paths:
        if not (ROOT / rel).exists():
            errors.append(f"{stage} authority is missing: {rel}")

contract = require(CONTRACT, [
    "Acquisition",
    "Booking",
    "Payment",
    "Customer + vehicle",
    "Staff work",
    "Completion + proof",
    "Final finance",
    "Genuine review",
    "Rebook + retention",
    "Maintenance + fleet",
    "Recovery",
    "Cloudflare Production exact-SHA acceptance",
    "does not fabricate a real customer journey",
], "Production business acceptance contract")

helper = require(PRODUCTION_HELPER, [
    "read-only Cloudflare Pages Production exact-SHA acceptance",
    'CF_PRODUCTION_BRANCH="${CF_PRODUCTION_BRANCH:-main}"',
    'CF_PRODUCTION_URL="${CF_PRODUCTION_URL:-https://rosiedazzlers.ca}"',
    '(.deployment_trigger.metadata.commit_hash // "") == $sha',
    '(.deployment_trigger.metadata.branch // "") == $branch',
    '[[ "$EXACT_ENVIRONMENT" == "production" ]]',
    '[[ "$EXACT_USES_FUNCTIONS" == "true" ]]',
    'SMOKE_SCOPE=static bash scripts/development_http_smoke.sh',
    'SMOKE_SCOPE=full bash scripts/development_http_smoke.sh',
    "PRODUCTION EXACT-SHA ACCEPTANCE: PASS",
    "mutation performed: none",
], "Production exact-SHA helper")

workflow = require(WORKFLOW, [
    "name: Build 377 — Production Business Acceptance / Launch Readiness",
    "build377-*",
    "Validate Production business acceptance source contract",
    "python scripts/production_business_acceptance_check.py",
    "Validate acquisition and booking authorities",
    "Validate payment and final-finance authorities",
    "Validate customer, staff, completion and proof authorities",
    "Validate genuine-review and rebook authorities",
    "Validate maintenance and fleet authorities",
    "Validate rollback and hardening authorities",
    "production-exact-sha:",
    "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
    "bash scripts/cloudflare_pages_production_acceptance.sh",
    "ROSIEDAZZLERS_TOKEN",
], "Build 377 workflow")

queue = require(QUEUE, [
    "Build 376",
    "Build 377",
    "Build 378",
    "FORWARD_BUILD_ROADMAP_378_385.md",
], "autonomous release queue")

# Production acceptance helper is strictly retrieval + HTTP smoke. Block known
# Cloudflare/Git mutation primitives even if later edits accidentally add them.
for needle in [
    "git push", "git update-ref", "git reset --hard", "wrangler pages deploy",
    "wrangler pages deployment", "--request POST", "-X POST", "--request DELETE",
    "-X DELETE", "--request PATCH", "-X PATCH", "/rollback", "/retry",
]:
    if needle in helper:
        errors.append(f"Production acceptance helper contains mutation primitive: {needle}")

# Cloudflare API calls must remain GET-only discovery/project/deployment reads.
for match in re.finditer(r'https://api\.cloudflare\.com/client/v4/[^"\s]+', helper):
    url = match.group(0)
    allowed = ["user/tokens/verify", "/accounts?", "/pages/projects/"]
    if not any(part in url for part in allowed):
        errors.append(f"Production helper contains unexpected Cloudflare endpoint: {url}")

# The workflow must not grant write permissions or perform provider/business mutations.
if re.search(r"\b(contents|deployments|actions):\s*write\b", workflow):
    errors.append("Build 377 workflow grants write permissions")
for needle in [
    "git push", "update-ref", "wrangler pages deploy", "stripe trigger", "paypal",
    "curl -X POST", "curl -X DELETE", "curl -X PATCH",
]:
    if needle in workflow.lower():
        errors.append(f"Build 377 workflow contains mutation/provider primitive: {needle}")

# The detailed acceptance contract must explicitly separate software proof from real-world evidence.
for phrase in [
    "real card charge", "real PayPal transaction", "real review", "real month-end close",
    "Missing Production identity", "non-force fast-forward",
]:
    if phrase not in contract:
        errors.append(f"acceptance contract lost fail-closed evidence boundary: {phrase!r}")

# Build 377 is deliberately schema-neutral.
migrations = list(ROOT.glob("**/*377*.sql"))
if migrations:
    errors.append("Build 377 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

# Keep the living queue release-hygienic: accepted/current/next only.
numbered_builds = re.findall(r"\bBuild\s+\d{3}\b", queue)
if len(numbered_builds) > 3:
    errors.append(f"autonomous release queue contains too many numbered build references: {len(numbered_builds)}")

if errors:
    print("PRODUCTION BUSINESS ACCEPTANCE: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PRODUCTION BUSINESS ACCEPTANCE: PASS")
print("- acquisition through booking, payment, account/vehicle, staff work and completion authorities are present")
print("- final finance, genuine review, rebook, maintenance and fleet authorities are present")
print("- rollback and hardening authorities remain part of launch readiness")
print("- Production exact-SHA evidence is Cloudflare read-only and fail-closed")
print("- real customer/provider/review/accounting evidence is never fabricated")
print("- Build 377 is schema-neutral")
