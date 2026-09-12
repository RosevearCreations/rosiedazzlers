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


maintenance_rules = load_json("config/maintenance-plan-business-rulebook.json")
fleet_rules = load_json("config/fleet-business-rulebook.json")

if maintenance_rules.get("status") != "awaiting_business_approval":
    errors.append("maintenance rulebook must remain awaiting_business_approval until explicit business approval")
if fleet_rules.get("status") != "awaiting_business_approval":
    errors.append("fleet rulebook must remain awaiting_business_approval until explicit business approval")

for domain, row in (maintenance_rules.get("decisions") or {}).items():
    if (row or {}).get("approved") is not False:
        errors.append(f"maintenance commercial domain unexpectedly approved: {domain}")
for domain, row in (fleet_rules.get("decisions") or {}).items():
    if (row or {}).get("approved") is not False:
        errors.append(f"fleet commercial domain unexpectedly approved: {domain}")

helper = read("functions/api/_lib/retention-maintenance-fleet-activation.js")
endpoint = read("functions/api/admin/commercial_activation.js")
test = read("scripts/build392_retention_maintenance_fleet_activation_test.mjs")
policy = read("docs/RETENTION_MAINTENANCE_FLEET_COMMERCIAL_ACTIVATION.md").lower()
workflow = read(".github/workflows/retention-maintenance-fleet-commercial-activation-authority.yml")

for token in (
    "operator_assisted_commercial_activation",
    "maintenance_interest_waitlist",
    "fleet_assessment_inquiry",
    "automatic_outreach_allowed: false",
    "automatic_discount_application_allowed: false",
    "recurring_billing_allowed: false",
    "provider_mutation_allowed: false",
    "commercial_terms_may_be_inferred: false",
):
    if token not in helper:
        errors.append(f"activation helper missing {token}")

for token in (
    "requireStaffAccess",
    "membership_interest_requests",
    "public_inquiry_leads",
    "mutation_authority: false",
    "provider_mutation_authority: false",
    'maintenance_rulebook_status: "awaiting_business_approval"',
    'fleet_rulebook_status: "awaiting_business_approval"',
):
    if token not in endpoint:
        errors.append(f"commercial activation endpoint missing {token}")

for mutation in ('method: "POST"', 'method: "PATCH"', 'method: "DELETE"'):
    if mutation in endpoint:
        errors.append(f"Build 392 overview must remain read-only: found {mutation}")

for provider in ("stripe", "paypal", "paymentintent", "subscriptions.create"):
    if provider in (helper + endpoint).lower():
        errors.append(f"Build 392 source contains forbidden provider mutation token: {provider}")

for token in (
    "business approval",
    "no automatic outreach",
    "no automatic discount",
    "no recurring billing",
    "existing booking",
    "existing quote",
    "schema-neutral",
):
    if token not in policy:
        errors.append(f"Build 392 policy missing {token}")

for token in (
    "Build 392 — Retention, Maintenance & Fleet Commercial Activation Authority",
    "python scripts/build392_retention_maintenance_fleet_activation_check.py",
    "node scripts/build392_retention_maintenance_fleet_activation_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 392 workflow missing {token}")

if "BUILD 392 RETENTION / MAINTENANCE / FLEET COMMERCIAL ACTIVATION: PASS" not in test:
    errors.append("Build 392 executable contract test is missing PASS authority")

if any("392" in p.name.lower() for p in ROOT.rglob("*.sql")):
    errors.append("Build 392 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/retention-maintenance-fleet-activation.js"],
    ["node", "--check", "functions/api/admin/commercial_activation.js"],
    ["node", "--check", "scripts/build392_retention_maintenance_fleet_activation_test.mjs"],
    ["node", "scripts/build392_retention_maintenance_fleet_activation_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 392 RETENTION / MAINTENANCE / FLEET COMMERCIAL ACTIVATION AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 392 RETENTION / MAINTENANCE / FLEET COMMERCIAL ACTIVATION AUTHORITY: PASS")
print(" - existing maintenance-interest and fleet-lead sources remain canonical")
print(" - operator next actions are deterministic and read-only")
print(" - unresolved commercial terms fail closed pending explicit business approval")
print(" - automatic outreach, discounts, recurring billing and provider mutation remain prohibited")
print(" - no Build 392 schema migration detected")
