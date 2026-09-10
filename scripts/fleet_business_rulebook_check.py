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


try:
    rules = json.loads(read("config/fleet-business-rulebook.json") or "{}")
except Exception as exc:
    errors.append(f"invalid fleet rulebook JSON: {exc}")
    rules = {}

if rules.get("schema_version") != "build-372-v1":
    errors.append("wrong fleet rulebook version")
if rules.get("status") != "awaiting_business_approval":
    errors.append("fleet rulebook must await business approval")
if rules.get("business_approval_required") is not True:
    errors.append("business approval must be required")

required = (
    "fleet_minimums",
    "service_tiers",
    "travel_limits",
    "volume_pricing",
    "invoicing",
    "cancellation",
)
decisions = rules.get("decisions") or {}
if set(decisions) != set(required):
    errors.append("fleet rulebook must contain exactly the six Build 372 decision domains")
for domain in required:
    row = decisions.get(domain) or {}
    if row.get("approved") is not False:
        errors.append(f"{domain} must remain unapproved in the live Build 372 rulebook")

unset_fields = {
    "fleet_minimums": ("minimum_vehicles", "minimum_service_frequency", "minimum_account_spend_cents"),
    "travel_limits": ("included_radius_km", "maximum_radius_km", "travel_fee_model", "travel_fee_cents"),
    "volume_pricing": ("pricing_model", "discount_percent"),
    "invoicing": ("billing_model", "payment_terms_days", "deposit_policy", "statement_cycle"),
    "cancellation": ("notice_hours", "late_cancel_fee_cents", "missed_visit_policy", "reschedule_policy"),
}
for domain, keys in unset_fields.items():
    row = decisions.get(domain) or {}
    for key in keys:
        if row.get(key) is not None:
            errors.append(f"live fleet economics must remain unset: {domain}.{key}")

for domain, key in (("service_tiers", "tiers"), ("volume_pricing", "bands")):
    if (decisions.get(domain) or {}).get(key) != []:
        errors.append(f"live fleet economics must remain an empty draft list: {domain}.{key}")

operational = rules.get("operational_authority") or {}
for key in (
    "fleet_account_activation_allowed",
    "automatic_discount_application_allowed",
    "invoice_creation_allowed",
    "booking_creation_allowed",
    "recurring_billing_allowed",
    "provider_mutation_allowed",
    "database_mutation_allowed",
):
    if operational.get(key) is not False:
        errors.append(f"operational authority {key} must be false")

existing = rules.get("existing_authority") or {}
for key in (
    "fleet_lead_pipeline_remains_authoritative",
    "draft_quote_handoff_remains_authoritative",
    "booking_flow_remains_authoritative",
    "current_service_area_rules_apply",
    "current_site_access_rules_apply",
    "current_payment_and_deposit_rules_apply",
):
    if existing.get(key) is not True:
        errors.append(f"existing authority {key} must remain true")

helper = read("functions/api/_lib/fleet-business-rulebook.js")
for token in (
    '"fleet_minimums"',
    '"service_tiers"',
    '"travel_limits"',
    '"volume_pricing"',
    '"invoicing"',
    '"cancellation"',
    'status: rulesReady ? "rules_ready" : "awaiting_business_approval"',
    'next_boundary: "build_373_fleet_account_operations"',
):
    if token not in helper:
        errors.append(f"fleet rulebook helper missing {token}")
for key in operational:
    if f"{key}: false" not in helper:
        errors.append(f"helper must hard-disable {key}")

policy = read("docs/FLEET_BUSINESS_RULEBOOK.md").lower()
for token in (
    "fleet minimums",
    "service tiers",
    "travel limits",
    "volume pricing",
    "invoicing",
    "cancellation",
    "does **not** invent fleet economics",
    "build 373",
    "schema-free",
):
    if token not in policy:
        errors.append(f"fleet rulebook policy missing {token}")

roadmap = read("FORWARD_BUILD_ROADMAP_356_377.md").lower()
for token in ("build 372", "fleet business rulebook", "do not invent fleet economics", "build 373"):
    if token not in roadmap:
        errors.append(f"forward roadmap missing {token}")

workflow = read(".github/workflows/fleet-business-rulebook-authority.yml")
for token in (
    "Build 372 — Fleet Business Rulebook Authority",
    "python scripts/fleet_business_rulebook_check.py",
    "node scripts/fleet_business_rulebook_test.mjs",
):
    if token not in workflow:
        errors.append(f"dedicated workflow missing {token}")

source_gate = read(".github/workflows/development-source-gate.yml")
for token in (
    "node --check functions/api/_lib/fleet-business-rulebook.js",
    "node --check scripts/fleet_business_rulebook_test.mjs",
    "python -m py_compile scripts/fleet_business_rulebook_check.py",
    "python scripts/fleet_business_rulebook_check.py",
    "node scripts/fleet_business_rulebook_test.mjs",
    "Fleet business rulebook authority: PASS",
):
    if token not in source_gate:
        errors.append(f"Current Source Gate missing Build 372 token: {token}")

proc = subprocess.run(
    ["node", "--check", "functions/api/_lib/fleet-business-rulebook.js"],
    cwd=ROOT,
    text=True,
    capture_output=True,
)
if proc.returncode != 0:
    errors.append("fleet business rulebook helper syntax failed")

sql = [p for p in ROOT.rglob("*.sql") if "372" in p.name.lower()]
if sql:
    errors.append("Build 372 must not add a schema migration")

if errors:
    print("FLEET BUSINESS RULEBOOK AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("FLEET BUSINESS RULEBOOK AUTHORITY: PASS")
print(" - six required fleet commercial decision domains are explicit")
print(" - live fleet economics remain unresolved until explicit business approval")
print(" - fleet account, discount, invoice, booking, billing and provider mutations remain disabled")
print(" - existing lead, quote, booking and operating authorities remain intact")
print(" - Build 373 is the next operational boundary")
print(" - no Build 372 schema migration detected")
