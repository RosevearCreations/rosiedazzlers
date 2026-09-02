#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

def need(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

def require_living_build_at_least(rel, minimum):
    body = text(rel)
    match = re.search(r"\*\*Build:\*\*\s*(\d+)", body)
    if not match:
        errors.append(f"{rel} missing living Build marker")
        return
    current = int(match.group(1))
    if current < minimum:
        errors.append(f"{rel} living Build regressed below {minimum}: {current}")

# Canonical action registry and role boundaries.
actions = json.loads(text("data/action_permissions.json") or "{}")
if int(actions.get("extended_through_build") or 0) < 272:
    errors.append("action permission registry is not extended through Build 272")
for action in ["operations.customer.manage", "operations.quote.manage", "finance.refund.manage", "finance.settlement.manage"]:
    if action not in actions.get("actions", {}):
        errors.append(f"missing Build 272 action {action}")
if "operations.quote.manage" not in actions.get("role_defaults", {}).get("senior_detailer", []):
    errors.append("senior_detailer lost staff quote-management default")
if "operations.quote.manage" not in actions.get("role_defaults", {}).get("operations_manager", []):
    errors.append("operations_manager missing quote-management default")
for action in ["finance.refund.manage", "finance.settlement.manage"]:
    if action not in actions.get("role_defaults", {}).get("accountant", []):
        errors.append(f"accountant missing {action} default")
for role in ["detailer", "senior_detailer", "operations_manager"]:
    if any(a.startswith("finance.") for a in actions.get("role_defaults", {}).get(role, [])):
        errors.append(f"{role} incorrectly receives a Finance action by default")

need("functions/api/_lib/action-permissions.js", "operations.quote.manage", "finance.refund.manage", "finance.settlement.manage")

# Build 272 originally owned these Operations/Finance leaves inline in admin middleware.
# Later releases may delegate Finance route resolution to a canonical helper, but the four
# exact historical Finance protections must remain provable and action-equivalent.
need(
    "functions/api/admin/_middleware.js",
    "customer_profiles_save: \"operations.customer.manage\"",
    "customer_tiers_save: \"operations.customer.manage\"",
    "customer_tiers_delete: \"operations.customer.manage\"",
    "customers_save: \"operations.customer.manage\"",
    "customers_delete: \"operations.customer.manage\"",
    "quote_pipeline_save: \"operations.quote.manage\"",
    "quote_proposal_drafts_save: \"operations.quote.manage\"",
    "quote_proposal_deliver: \"operations.quote.manage\"",
    "quote_deposit_request_create: \"operations.quote.manage\"",
    "final_balance_request_create: \"operations.quote.manage\"",
    "final_balance_request_manage: \"operations.quote.manage\"",
    "requireActionAccess"
)
admin_middleware = text("functions/api/admin/_middleware.js")
finance_helper = "functions/api/_lib/admin-finance-actions.js"
if "financeActionFor" in admin_middleware:
    need(
        "functions/api/admin/_middleware.js",
        'import { financeActionFor } from "../_lib/admin-finance-actions.js"',
        "financeActionFor(leaf, method)"
    )
    need(
        finance_helper,
        '"quote_deposit_request_mark_paid"',
        '"quote_deposit_refund_initiate"',
        '"quote_deposit_refund_save"',
        '"accounting_payable_settle"',
        '"finance.refund.manage"',
        '"finance.settlement.manage"'
    )
else:
    need(
        "functions/api/admin/_middleware.js",
        "quote_deposit_request_mark_paid: \"finance.settlement.manage\"",
        "quote_deposit_refund_initiate: \"finance.refund.manage\"",
        "quote_deposit_refund_save: \"finance.refund.manage\"",
        "accounting_payable_settle: \"finance.settlement.manage\""
    )

# Existing prices are a release invariant for Build 272.
pricing = json.loads(text("data/rosie_services_pricing_and_packages.json") or "{}")
by_code = {p.get("code"): p for p in pricing.get("packages", [])}
expected = {
    "premium_wash": {"small": 85, "mid": 105, "oversize": 125},
    "complete_detail": {"small": 319, "mid": 369, "oversize": 419},
    "interior_detail": {"small": 195, "mid": 220, "oversize": 245},
    "exterior_detail": {"small": 195, "mid": 220, "oversize": 245},
}
for code, prices in expected.items():
    if by_code.get(code, {}).get("prices_cad") != prices:
        errors.append(f"Build 272 price invariant changed for {code}: {by_code.get(code, {}).get('prices_cad')}")

# Public clarity must be server-visible while keeping dynamic package cards and booking mechanics intact.
need(
    "functions/_middleware.js",
    "Compare scope before price",
    "Exterior Detail</strong> is a full exterior-focused detail and protection-prep service rather than a basic wash",
    "Complete Detail</strong> covers the broadest inside-and-out base scope and is our <strong>Best value</strong>",
    "the base price follows the Small, Mid-sized, or Oversized vehicle size selected in Step 1",
    "Rosie brings the water and power needed for standard detailing",
    'id="ack_power_water" type="checkbox" checked disabled',
    'id="need_mobile_water_power" type="checkbox"',
    "/assets/build272-public-clarity.js?v=272"
)
need(
    "assets/build272-public-clarity.js",
    "Maintenance exterior refresh",
    "Full exterior detail",
    "Best value · Interior + exterior",
    "Condition, contamination, risk or extra labour",
    "Rosie brings its own water and power"
)

# Existing booking/deposit path remains present; Build 272 does not replace checkout mechanics.
need("book.html", 'id="checkoutBtn"', "Book and pay deposit", "selectedPackageCode", "deposit")

# T2125 workpaper is read-only, Finance-scoped, review-first, and exportable.
need(
    "functions/api/_lib/t2125-workpaper.js",
    'workpaper_type: "T2125"',
    'filing_status:',
    'business_km_allocation_required',
    'cca_schedule_required',
    'home_office_calculation_required',
    'cost_of_goods_sold_review',
    'input_tax_credit_debit_activity_cad',
    'Accounting workpaper only.'
)
need(
    "functions/api/admin/accounting_t2125_workpaper.js",
    'capability: null',
    'allowLegacyAdminFallback: false',
    'requireActionAccess(access.actor, "finance.view")',
    'buildT2125WorkpaperFromYearEnd'
)
need(
    "admin-tax-review.html",
    'Tax and T2125 review',
    "['section','line','category','account','recorded_cad','candidate_cad','unresolved_cad','review_required','severity','note']",
    "['review',f.t2125_line||'','',f.account_code||'',f.amount_cad??'','','','yes',f.severity||'review',f.message||'']",
    'Download CSV',
    'Download JSON'
)

# Preserve one-H1 public SEO rule in source pages. Build 272 is allowed to locate the existing H1,
# but its injected HTML fragments must never contain a new H1.
for rel in ["index.html", "book.html", "pricing.html", "services.html"]:
    body = text(rel)
    count = len(re.findall(r"<h1\b", body, flags=re.I))
    if count != 1:
        errors.append(f"{rel} expected exactly one H1, found {count}")

middleware = text("functions/_middleware.js")
for constant in ["PACKAGE_GUIDE", "PUBLIC_SCOPE_GUIDE"]:
    match = re.search(rf"const\s+{constant}\s*=\s*`([\s\S]*?)`;", middleware)
    if not match:
        errors.append(f"functions/_middleware.js missing injectable fragment {constant}")
    elif re.search(r"<h1\b", match.group(1), flags=re.I):
        errors.append(f"functions/_middleware.js {constant} must not inject an H1")
if re.search(r"<h1\b", text("assets/build272-public-clarity.js"), flags=re.I):
    errors.append("assets/build272-public-clarity.js must not inject an H1")

# Historical closure and living-authority continuity. Code-level action names are already protected above;
# living Markdown only needs to preserve the retained Build 272 meaning while later releases advance.
need("BUILD272_SUMMARY.md", "Build 272", "CLOSED", "Build 273")
require_living_build_at_least("AI_PROJECT_HANDOFF.md", 272)
need(
    "AI_PROJECT_HANDOFF.md",
    "## Retained Build 272/273 authority",
    "narrow Operations/Finance action permissions",
    "Complete = **Best value**",
    "one meaningful H1 per indexable public page",
)
require_living_build_at_least("MASTER_VALUE_ROADMAP.md", 272)
need(
    "MASTER_VALUE_ROADMAP.md",
    "## Retained baseline",
    "Build 272 closed",
    "Complete = **Best value**",
    "server-authoritative role/module/action permissions",
)

# Syntax checks for every Build 272 JavaScript authority surface.
syntax_relations = [
    "functions/api/_lib/action-permissions.js",
    "functions/api/admin/_middleware.js",
    "functions/_middleware.js",
    "assets/build272-public-clarity.js",
    "functions/api/_lib/t2125-workpaper.js",
    "functions/api/admin/accounting_t2125_workpaper.js",
]
if "financeActionFor" in admin_middleware:
    syntax_relations.append(finance_helper)
for rel in syntax_relations:
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")

if errors:
    print("Build 272 focused release check: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("Build 272 focused release check: PASS")
print(" - customer/profile/tier/delete writes are behind operations.customer.manage")
print(" - staff quote work is behind operations.quote.manage")
print(" - refund and settlement mutations are separated into Finance actions")
print(" - Rosie package prices are unchanged")
print(" - Exterior/Complete scope, vehicle sizing, condition quote triggers, and fully-mobile water/power are clarified before price")
print(" - Complete uses Best value, one-H1 source rules remain intact, and existing booking/deposit mechanics remain present")
print(" - T2125 workpaper is Finance-scoped, review-first, and exports aligned CSV/JSON")
print(" - Build 272 remains historically closed while later living planning authorities may advance")
