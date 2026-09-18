#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


def load_json(path):
    try:
        return json.loads(read(path) or "{}")
    except Exception as exc:
        errors.append(f"invalid JSON {path}: {exc}")
        return {}


maintenance = load_json("config/maintenance-plan-business-rulebook.json")
pilot = load_json("config/maintenance-plan-pilot-activation.json")
fleet = load_json("config/fleet-business-rulebook.json")
helper = read("functions/api/_lib/maintenance-fleet-commercial-acceptance.js")
capacity = read("functions/api/_lib/capacity-calendar-intelligence.js")
quote_handoff = read("functions/api/_lib/fleet-quote-handoff.js")
activation = read("functions/api/_lib/retention-maintenance-fleet-activation.js")
commercial_endpoint = read("functions/api/admin/commercial_activation.js")
test = read("scripts/build410_maintenance_fleet_commercial_acceptance_test.mjs")
policy = read("BUILD410_MAINTENANCE_FLEET_COMMERCIAL_ACCEPTANCE.md").lower()
workflow = read(".github/workflows/maintenance-fleet-commercial-acceptance-authority.yml")
production = read(".github/workflows/production-business-acceptance-authority.yml")

maintenance_domains = (
    "eligibility", "cadence", "price", "inclusions", "exclusions", "cancellation", "priority"
)
fleet_domains = (
    "fleet_minimums", "service_tiers", "travel_limits", "volume_pricing", "invoicing", "cancellation"
)

if maintenance.get("business_approval_required") is not True:
    errors.append("maintenance rulebook must require explicit business approval")
if maintenance.get("status") != "awaiting_business_approval":
    errors.append("current maintenance rulebook must remain awaiting_business_approval until owner terms are supplied")
mdecisions = maintenance.get("decisions") or {}
for domain in maintenance_domains:
    if domain not in mdecisions:
        errors.append(f"maintenance rulebook missing {domain}")
    elif (mdecisions.get(domain) or {}).get("approved") is not False:
        errors.append(f"Build 410 must not fabricate maintenance approval for {domain}")

mactivation = maintenance.get("activation") or {}
for key in (
    "plan_enabled", "pilot_enrollment_allowed", "automatic_enrollment_allowed",
    "recurring_billing_allowed", "automatic_renewal_allowed"
):
    if mactivation.get(key) is not False:
        errors.append(f"maintenance activation {key} must remain false before explicit commercial approval")

if pilot.get("status") != "prepared_fail_closed":
    errors.append("maintenance pilot must remain prepared_fail_closed")
for key in ("mutation_authority", "provider_mutation_authority", "persistence_authority"):
    if pilot.get(key) is not False:
        errors.append(f"maintenance pilot {key} must remain false")

if fleet.get("business_approval_required") is not True:
    errors.append("fleet rulebook must require explicit business approval")
if fleet.get("status") != "awaiting_business_approval":
    errors.append("current fleet rulebook must remain awaiting_business_approval until owner terms are supplied")
fdecisions = fleet.get("decisions") or {}
for domain in fleet_domains:
    if domain not in fdecisions:
        errors.append(f"fleet rulebook missing {domain}")
    elif (fdecisions.get(domain) or {}).get("approved") is not False:
        errors.append(f"Build 410 must not fabricate fleet approval for {domain}")

for key, value in (fleet.get("operational_authority") or {}).items():
    if value is not False:
        errors.append(f"fleet operational authority {key} must remain false before explicit commercial approval")

for token in (
    "build: 410",
    'mode: "maintenance_fleet_commercial_acceptance"',
    'source_release_green_is_not_business_approval: true',
    'source_release_green_may_coexist_with_owner_action: true',
    'commercial_terms_may_be_inferred: false',
    'pricing_may_be_inferred: false',
    'customer_commitment_may_be_inferred: false',
    'capacity_may_be_inferred: false',
    'automatic_outreach_allowed: false',
    'automatic_booking_allowed: false',
    'automatic_discount_application_allowed: false',
    'automatic_invoice_creation_allowed: false',
    'automatic_recurring_billing_allowed: false',
    'provider_mutation_allowed: false',
    'accepted_status_requires_timestamp_and_recorded_amounts: true',
):
    if token not in helper:
        errors.append(f"Build 410 helper missing {token}")

for token in (
    'availability_authority: "/api/availability"',
    'collision_revalidation_authority: "/api/checkout"',
    "never_opens_closed_slots: true",
    "one_vehicle_per_day_default: true",
    "half_day_exceptions_supported: true",
):
    if token not in capacity:
        errors.append(f"capacity authority missing {token}")

for token in (
    'status: "draft"',
    "quoted_amount_cents: 0",
    "accepted_amount_cents: 0",
    "accepted_at: null",
    "creates_booking: false",
    "charges_customer: false",
    "creates_recurring_commitment: false",
):
    if token not in quote_handoff and token not in commercial_endpoint:
        errors.append(f"fleet quote/activation boundary missing {token}")

for token in (
    '"automatic_enrollment"',
    '"automatic_outreach"',
    '"automatic_discount_application"',
    '"fleet_account_activation"',
    '"invoice_creation"',
    '"booking_creation"',
    '"recurring_billing"',
    '"automatic_renewal"',
    '"provider_mutation"',
    "commercial_terms_may_be_inferred: false",
):
    if token not in activation:
        errors.append(f"retained commercial activation boundary missing {token}")

for token in (
    "source acceptance",
    "owner_action",
    "source release green",
    "explicit business approval",
    "current configured rulebooks",
    "capacity",
    "/api/availability",
    "/api/checkout",
    "draft",
    "sent",
    "accepted",
    "customer commitment",
    "automatic outreach",
    "automatic booking",
    "recurring billing",
    "schema-neutral",
):
    if token not in policy:
        errors.append(f"Build 410 policy missing {token}")

for token in (
    "Build 410 — Maintenance / Fleet Commercial Acceptance Authority",
    "python scripts/build410_maintenance_fleet_commercial_acceptance_check.py",
    "node scripts/build410_maintenance_fleet_commercial_acceptance_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 410 workflow missing {token}")

for token in (
    "python -m py_compile scripts/build410_maintenance_fleet_commercial_acceptance_check.py",
    "python scripts/build410_maintenance_fleet_commercial_acceptance_check.py",
    "node scripts/build410_maintenance_fleet_commercial_acceptance_test.mjs",
):
    if token not in production:
        errors.append(f"Production cumulative authority missing Build 410 token {token}")

if "BUILD 410 MAINTENANCE / FLEET COMMERCIAL ACCEPTANCE: PASS" not in test:
    errors.append("Build 410 executable contract test is missing PASS authority")

if any("410" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 410 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/maintenance-fleet-commercial-acceptance.js"],
    ["node", "--check", "scripts/build410_maintenance_fleet_commercial_acceptance_test.mjs"],
    ["node", "scripts/build410_maintenance_fleet_commercial_acceptance_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 410 MAINTENANCE / FLEET COMMERCIAL ACCEPTANCE AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 410 MAINTENANCE / FLEET COMMERCIAL ACCEPTANCE AUTHORITY: PASS")
print(" - current maintenance and fleet configs remain source-safe and owner-action gated")
print(" - source release GREEN remains distinct from explicit business approval")
print(" - capacity remains subordinate to /api/availability and /api/checkout")
print(" - draft/sent quotes are not customer commitments")
print(" - accepted quote evidence requires status, timestamp and recorded positive amounts")
print(" - no automatic outreach, booking, discounts, invoicing, recurring billing or provider mutation")
print(" - no Build 410 schema migration detected")
