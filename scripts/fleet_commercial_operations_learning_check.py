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

helper = read("functions/api/_lib/fleet-commercial-operations-learning.js")
endpoint = read("functions/api/admin/fleet_commercial_operations_learning.js")
page = read("admin-fleet-commercial-learning.html")
test = read("scripts/fleet_commercial_operations_learning_test.mjs")
workflow = read(".github/workflows/fleet-commercial-operations-learning-authority.yml")
contract = read("BUILD430_FLEET_COMMERCIAL_OPERATIONS_LEARNING.md").lower()
production = read(".github/workflows/production-business-acceptance-authority.yml")
rulebook = load_json("config/fleet-business-rulebook.json")

required_domains = ["fleet_minimums","service_tiers","travel_limits","volume_pricing","invoicing","cancellation"]
if rulebook.get("status") != "awaiting_business_approval":
    errors.append("Build 430 current source expects fleet rulebook to remain awaiting_business_approval")
if rulebook.get("business_approval_required") is not True:
    errors.append("fleet rulebook must require explicit owner approval")
for domain in required_domains:
    decision = (rulebook.get("decisions") or {}).get(domain) or {}
    if decision.get("approved") is not False:
        errors.append(f"Build 430 must not fabricate fleet rulebook approval for {domain}")

for token in (
    "build: 430",
    'mode: "fleet_commercial_operations_learning"',
    'status: "unavailable"',
    'availability: "/api/availability"',
    'booking_collision_revalidation: "/api/checkout"',
    "current_live_capacity_inferred: false",
    "customer_identity_exposed: false",
    "signed_commercial_business_inferred: false",
    "pricing_terms_inferred: false",
    "fleet_discount_inferred: false",
    "invoice_creation_allowed: false",
    "booking_creation_allowed: false",
    "service_area_expansion_allowed: false",
    "credit_terms_allowed: false",
    "payment_provider_mutation_allowed: false",
    "accounting_posting_allowed: false",
    "customer_outreach_allowed: false",
    "role_mutation_allowed: false",
    "schema_authority: false",
    "permanent_polling_allowed: false",
):
    if token not in helper:
        errors.append(f"Build 430 helper missing {token}")

for token in (
    "requireStaffAccess",
    '"manage_bookings"',
    '"public_inquiry_leads"',
    '"fleet_accounts"',
    '"fleet_account_vehicles"',
    '"fleet_request_groups"',
    '"fleet_request_jobs"',
    '"fleet_vehicle_service_history"',
    "requiredFleetBusinessDomains",
    "fleetOperationalAuthority",
    "buildFleetCommercialOperationsLearning",
    "mutation_authority: false",
    "customer_identity_exposed: false",
    "signed_commercial_business_inferred: false",
):
    if token not in endpoint:
        errors.append(f"Build 430 endpoint missing {token}")

for method in ("onRequestPost", "onRequestPatch", "onRequestDelete"):
    if method not in endpoint:
        errors.append(f"Build 430 endpoint must reject mutation through {method}")

for token in (
    "Build 430",
    "Fleet & Commercial Operations Learning",
    "/api/admin/fleet_commercial_operations_learning",
    "manual refresh",
    "No customer identities",
    "owner_action",
    "signed business",
    "/api/availability",
    "/api/checkout",
):
    if token.lower() not in page.lower():
        errors.append(f"Build 430 operator page missing {token}")

if "setInterval(" in page:
    errors.append("Build 430 operator page must not use permanent polling")

for token in (
    "fleet inquiry",
    "approved vs unresolved",
    "capacity",
    "completed fleet/commercial jobs",
    "owner decisions",
    "no automatic fleet discount",
    "invoice creation",
    "booking creation",
    "service-area expansion",
    "payment/provider transaction",
    "accounting posting",
    "customer outreach",
    "signed commercial business",
):
    if token not in contract:
        errors.append(f"Build 430 contract missing {token}")

for token in (
    "python scripts/fleet_commercial_operations_learning_check.py",
    "node scripts/fleet_commercial_operations_learning_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 430 focused workflow missing {token}")
    if token not in production:
        errors.append(f"Production authority missing Build 430 authority {token}")

if "FLEET & COMMERCIAL OPERATIONS LEARNING TEST: PASS" not in test:
    errors.append("Build 430 executable contract test is missing PASS authority")

if any("430" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 430 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/fleet-commercial-operations-learning.js"],
    ["node", "--check", "functions/api/admin/fleet_commercial_operations_learning.js"],
    ["node", "--check", "scripts/fleet_commercial_operations_learning_test.mjs"],
    ["node", "scripts/fleet_commercial_operations_learning_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 430 FLEET & COMMERCIAL OPERATIONS LEARNING AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 430 FLEET & COMMERCIAL OPERATIONS LEARNING AUTHORITY: PASS")
print(" - fleet inquiry volume remains observed demand rather than signed commercial business")
print(" - unresolved commercial rulebook domains remain owner_action")
print(" - completed-work evidence stays aggregate and non-contractual")
print(" - live capacity remains unavailable and subordinate to booking authorities")
print(" - no discount, invoice, booking, outreach, provider, accounting or schema mutation is authorized")
