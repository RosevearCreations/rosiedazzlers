#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

helper = read("functions/api/_lib/retention-rebooking-learning.js")
endpoint = read("functions/api/admin/retention_rebooking_learning.js")
page = read("admin-retention-learning.html")
test = read("scripts/retention_rebooking_learning_test.mjs")
workflow = read(".github/workflows/retention-rebooking-learning-authority.yml")
contract = read("BUILD429_RETENTION_REBOOKING_LEARNING.md").lower()
development = read(".github/workflows/development-source-gate.yml")
production = read(".github/workflows/production-business-acceptance-authority.yml")

for token in (
    "build: 429",
    'mode: "retention_rebooking_learning"',
    "exact_customer_profile_linkage_only: true",
    "fuzzy_identity_merge_allowed: false",
    "customer_identity_exposed: false",
    "causation_claimed_from_counts: false",
    "marketing_consent_inferred: false",
    "outreach_eligibility_inferred_from_booking_history: false",
    "automatic_outreach_allowed: false",
    "automatic_booking_allowed: false",
    "automatic_maintenance_enrollment_allowed: false",
    "automatic_discount_allowed: false",
    "provider_mutation_allowed: false",
    "schema_authority: false",
    "permanent_polling_allowed: false",
    "provider_acceptance_is_not_delivery: true",
):
    if token not in helper:
        errors.append(f"Build 429 helper missing {token}")

for token in (
    "requireStaffAccess",
    '"manage_bookings"',
    '"bookings"',
    '"membership_interest_requests"',
    '"notification_events"',
    '"customer_profiles"',
    "buildRetentionRebookingLearning",
    "mutation_authority: false",
    "customer_identity_exposed: false",
    "causal_claim_authority: false",
):
    if token not in endpoint:
        errors.append(f"Build 429 endpoint missing {token}")

for method in ("onRequestPost", "onRequestPatch", "onRequestDelete"):
    if method not in endpoint:
        errors.append(f"Build 429 endpoint must explicitly reject mutation through {method}")

for token in (
    "Build 429",
    "Retention & Rebooking Learning",
    "/api/admin/retention_rebooking_learning",
    "manual refresh",
    "No customer identities",
    "correlation",
    "consent",
):
    if token.lower() not in page.lower():
        errors.append(f"Build 429 operator page missing {token}")

if "setInterval(" in page:
    errors.append("Build 429 operator page must not use permanent polling")

for token in (
    "completed-job",
    "later booking",
    "maintenance",
    "communication",
    "explicit-consent",
    "no automatic email",
    "no booking creation",
    "no maintenance-plan enrollment",
    "correlation",
):
    if token not in contract:
        errors.append(f"Build 429 contract missing {token}")

for token in (
    "python scripts/retention_rebooking_learning_check.py",
    "node scripts/retention_rebooking_learning_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 429 focused workflow missing {token}")
    if token not in production:
        errors.append(f"Production source gate missing Build 429 authority {token}")

for token in (
    "scripts/customer_communication_consent_delivery_check.py",
    "scripts/retention_maintenance_fleet_operational_pilot_check.py",
    "scripts/booking_rebooking_funnel_check.py",
):
    if token not in development:
        errors.append(f"durable Development source gate lost retained Build 429 dependency {token}")

if "RETENTION & REBOOKING LEARNING TEST: PASS" not in test:
    errors.append("Build 429 executable contract test is missing PASS authority")

if any("429" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 429 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/retention-rebooking-learning.js"],
    ["node", "--check", "functions/api/admin/retention_rebooking_learning.js"],
    ["node", "--check", "scripts/retention_rebooking_learning_test.mjs"],
    ["node", "scripts/retention_rebooking_learning_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 429 RETENTION & REBOOKING LEARNING AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 429 RETENTION & REBOOKING LEARNING AUTHORITY: PASS")
print(" - exact-profile repeat-booking evidence remains identity-safe and aggregate")
print(" - maintenance interest does not infer consent, enrollment or exact-profile linkage")
print(" - communication evidence preserves dispatch-time consent and provider-delivery boundaries")
print(" - learning counts are correlation only and never causal proof")
print(" - no schema, outreach, booking, discount or provider mutation is authorized")
