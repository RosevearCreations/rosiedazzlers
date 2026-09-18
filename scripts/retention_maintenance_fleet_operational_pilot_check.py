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
fleet = load_json("config/fleet-business-rulebook.json")
helper = read("functions/api/_lib/retention-maintenance-fleet-operational-pilot.js")
endpoint = read("functions/api/admin/retention_maintenance_fleet_operational_pilot.js")
activation = read("functions/api/_lib/retention-maintenance-fleet-activation.js")
test = read("scripts/retention_maintenance_fleet_operational_pilot_test.mjs")
policy = read("BUILD421_RETENTION_MAINTENANCE_FLEET_OPERATIONAL_PILOT.md").lower()
workflow = read(".github/workflows/retention-maintenance-fleet-operational-pilot-authority.yml")

if maintenance.get("status") != "awaiting_business_approval":
    errors.append("current maintenance rulebook must remain awaiting_business_approval until explicit owner approval")
if fleet.get("status") != "awaiting_business_approval":
    errors.append("current fleet rulebook must remain awaiting_business_approval until explicit owner approval")
if maintenance.get("business_approval_required") is not True:
    errors.append("maintenance rulebook must require explicit business approval")
if fleet.get("business_approval_required") is not True:
    errors.append("fleet rulebook must require explicit business approval")

for domain, row in (maintenance.get("decisions") or {}).items():
    if (row or {}).get("approved") is not False:
        errors.append(f"Build 421 must not fabricate maintenance approval for {domain}")
for domain, row in (fleet.get("decisions") or {}).items():
    if (row or {}).get("approved") is not False:
        errors.append(f"Build 421 must not fabricate fleet approval for {domain}")

for token in (
    "build: 421",
    'mode: "retention_maintenance_fleet_operational_pilot"',
    'source_release_green_is_not_pilot_approval: true',
    'participant_selection_is_manual: true',
    'customer_commitment_inferred: false',
    'fleet_commitment_inferred: false',
    'availability_authority: "/api/availability"',
    'collision_revalidation_authority: "/api/checkout"',
    "current_date_slot_must_be_revalidated: true",
    "automatic_customer_selection_allowed: false",
    "automatic_outreach_allowed: false",
    "automatic_enrollment_allowed: false",
    "automatic_booking_allowed: false",
    "automatic_discount_application_allowed: false",
    "automatic_invoice_creation_allowed: false",
    "automatic_recurring_billing_allowed: false",
    "provider_mutation_allowed: false",
    "source_release_green_may_coexist_with_pilot_hold: true",
):
    if token not in helper:
        errors.append(f"Build 421 helper missing {token}")

for token in (
    "requireStaffAccess",
    "membership_interest_requests",
    "public_inquiry_leads",
    'maintenance_rulebook_status: "awaiting_business_approval"',
    'fleet_rulebook_status: "awaiting_business_approval"',
    "mutation_authority: false",
    "provider_mutation_authority: false",
    "customer_identity_exposed: false",
):
    if token not in endpoint:
        errors.append(f"Build 421 endpoint missing {token}")

for token in (
    "operator_assisted_commercial_activation",
    "existing_booking_flow_remains_authoritative: true",
    "existing_quote_flow_remains_authoritative: true",
    "commercial_terms_may_be_inferred: false",
):
    if token not in activation:
        errors.append(f"retained activation authority missing {token}")

for token in (
    "owner_action",
    "source release green",
    "explicit owner approval",
    "manual",
    "/api/availability",
    "/api/checkout",
    "no automatic outreach",
    "no automatic booking",
    "no automatic discount",
    "no automatic invoice",
    "no recurring billing",
    "schema-neutral",
):
    if token not in policy:
        errors.append(f"Build 421 policy missing {token}")

for token in (
    "Build 421 — Retention, Maintenance & Fleet Operational Pilot Authority",
    "python scripts/retention_maintenance_fleet_operational_pilot_check.py",
    "node scripts/retention_maintenance_fleet_operational_pilot_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 421 workflow missing {token}")

if "RETENTION / MAINTENANCE / FLEET OPERATIONAL PILOT TEST: PASS" not in test:
    errors.append("Build 421 executable contract test is missing PASS authority")

for method in ("onRequestPost", "onRequestPatch", "onRequestDelete"):
    if method not in endpoint:
        errors.append(f"Build 421 endpoint must explicitly reject mutations through {method}")

for provider in ("stripe", "paypal", "subscriptions.create", "paymentintent"):
    if provider in (helper + endpoint).lower():
        errors.append(f"Build 421 source contains forbidden provider mutation token: {provider}")

if any("421" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 421 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/retention-maintenance-fleet-operational-pilot.js"],
    ["node", "--check", "functions/api/admin/retention_maintenance_fleet_operational_pilot.js"],
    ["node", "--check", "scripts/retention_maintenance_fleet_operational_pilot_test.mjs"],
    ["node", "scripts/retention_maintenance_fleet_operational_pilot_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 421 RETENTION / MAINTENANCE / FLEET OPERATIONAL PILOT AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 421 RETENTION / MAINTENANCE / FLEET OPERATIONAL PILOT AUTHORITY: PASS")
print(" - current rulebooks remain source-safe and owner-action gated")
print(" - operator pilot selection is manual and never inferred from queue activity")
print(" - capacity remains subordinate to /api/availability and /api/checkout")
print(" - automatic outreach, booking, discounts, invoices, recurring billing and provider mutation remain prohibited")
print(" - no Build 421 schema migration detected")
