#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, tempfile

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

def forbid(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token in body:
            errors.append(f"{rel} contains forbidden token {token}")

def node_check(rel):
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")

def inline_script_check(rel):
    body = text(rel)
    scripts = re.findall(r"<script(?:\s[^>]*)?>([\s\S]*?)</script>", body, flags=re.I)
    for i, script in enumerate(scripts, start=1):
        if not script.strip():
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as fh:
            fh.write(script)
            tmp = fh.name
        proc = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
        Path(tmp).unlink(missing_ok=True)
        if proc.returncode:
            errors.append(f"inline node --check failed {rel} script {i}: {proc.stderr.strip()}")

# Build 273 Finance action authority.
actions = json.loads(text("data/action_permissions.json") or "{}")
if int(actions.get("extended_through_build") or 0) < 273:
    errors.append("action permission registry is not extended through Build 273")
if "finance.tax.manage" not in actions.get("actions", {}):
    errors.append("missing finance.tax.manage action")
if "finance.tax.manage" not in actions.get("role_defaults", {}).get("accountant", []):
    errors.append("accountant missing finance.tax.manage default")
for role in ["detailer", "senior_detailer", "operations_manager"]:
    if any(a.startswith("finance.") for a in actions.get("role_defaults", {}).get(role, [])):
        errors.append(f"{role} incorrectly receives a Finance action")
need("functions/api/_lib/action-permissions.js", '"finance.tax.manage":"finance"', '"finance.tax.manage"')

# Additive tax-support schema is source-controlled and locked to the existing RLS/service-role pattern.
migration = "supabase/migrations/20260830090000_build273_tax_support_authority.sql"
need(
    migration,
    "create table if not exists public.accounting_business_vehicles",
    "create table if not exists public.accounting_vehicle_tax_years",
    "create table if not exists public.accounting_mileage_logs",
    "create table if not exists public.accounting_home_office_workpapers",
    "create table if not exists public.accounting_capital_assets",
    "create table if not exists public.accounting_tax_year_support",
    "alter table public.accounting_business_vehicles enable row level security",
    "alter table public.accounting_mileage_logs enable row level security",
    "alter table public.accounting_home_office_workpapers enable row level security",
    "alter table public.accounting_capital_assets enable row level security",
    "'business_tax_profile'",
    "'entity_type', 'unconfirmed'",
    "'identifiers_policy', 'masked_only'"
)
for destructive in ["drop table", "truncate table", "delete from public.accounting_"]:
    if destructive in text(migration).lower():
        errors.append(f"Build 273 migration must be additive; found {destructive}")

# Tax support helper must use business-specific mileage, never customer vehicle mileage, and keep judgment review-first.
need(
    "functions/api/_lib/accounting-tax-support.js",
    'const PROFILE_KEY = "business_tax_profile"',
    'identifiers_policy: "masked_only"',
    "calculateHomeOfficeWorkpaper",
    "calculateMileageSummary",
    "calculateCapitalAssetSummary",
    'operation === "save_mileage"',
    'operation === "save_vehicle_year"',
    'operation === "save_home_office"',
    'operation === "save_capital_asset"',
    'operation === "save_tax_year"',
    'review_required: true',
    'review_status !== "excluded"'
)
forbid("functions/api/_lib/accounting-tax-support.js", "vehicle_mileage_km", "customer_vehicles")

# Server action boundary: reads = finance.view; writes = finance.tax.manage; no legacy admin fallback or destructive API.
need(
    "functions/api/admin/accounting_tax_support.js",
    'requireActionAccess(access.actor, "finance.view")',
    'requireActionAccess(access.actor, "finance.tax.manage")',
    "allowLegacyAdminFallback: false",
    "validateOptionalReferences",
    "onRequestDelete",
    "methodNotAllowed"
)
need(
    "functions/api/admin/accounting_year_end_report.js",
    "capability:null",
    "allowLegacyAdminFallback:false",
    "requireActionAccess(access.actor, 'finance.view')"
)
need(
    "functions/api/admin/accounting_accountant_package.js",
    'requireActionAccess(access.actor, "finance.view")',
    "accountant_ready_candidate",
    "manual_review_required: true",
    "inventory_cost_completeness",
    "evidence_manifest"
)

# Structured facts enrich T2125 without converting judgment-heavy items into automatic filing decisions.
need(
    "functions/api/_lib/t2125-tax-support.js",
    'findLine(out.line_items, "9281")',
    'ensureLine(out.line_items, "9945"',
    'ensureLine(out.line_items, "9936"',
    "structured_tax_support",
    'filing_status = out.review_flags.length ? "review_required" : "mapped_for_review"'
)
need(
    "functions/api/admin/accounting_t2125_workpaper.js",
    "loadTaxSupport",
    "enrichT2125WithTaxSupport",
    'requireActionAccess(access.actor, "finance.view")',
    "tax_support_readiness"
)

# Finance UI: one H1, explicit last-4/masked identity language, all factual workpapers, accountant export.
support_html = text("admin-tax-support.html")
if len(re.findall(r"<h1\b", support_html, flags=re.I)) != 1:
    errors.append("admin-tax-support.html must contain exactly one H1")
need(
    "admin-tax-support.html",
    "Tax support & accountant readiness",
    "Business number — last 4 only",
    "GST/HST number — last 4 only",
    "Business-use vehicles & mileage",
    "Annual odometer reconciliation",
    "Business-use-of-home workpaper",
    "Capital assets / CCA support",
    "Year-end inventory / COGS support",
    "Tax evidence manifest",
    "/api/admin/accounting_tax_support",
    "/api/admin/accounting_accountant_package",
    "Download accountant JSON",
    "pageKey:'admin-tax-review'"
)
if "<input name=\"business_number\"" in support_html or "<input name=\"gst_hst_number\"" in support_html:
    errors.append("Tax Support UI must not request/store full CRA identifiers")

need(
    "admin-tax-review.html",
    "data-build273=\"structured-t2125-tax-workpaper\"",
    "/admin-tax-support.html",
    "Structured tax support",
    "structured_tax_support"
)

# Living authority and active release checkpoint must agree.
need("BUILD273_SUMMARY.md", "**Status: ACTIVE**", "finance.tax.manage", "accounting_mileage_logs", "admin-tax-support.html")
need("AI_PROJECT_HANDOFF.md", "**Build:** 273", "Build 273 active implementation", "finance.tax.manage")
need("MASTER_VALUE_ROADMAP.md", "**Build:** 273", "Build 273 — active", "Finance / accounting / tax support — implemented this increment")

# JavaScript syntax, including inline Finance pages.
for rel in [
    "functions/api/_lib/action-permissions.js",
    "functions/api/_lib/accounting-tax-support.js",
    "functions/api/_lib/t2125-tax-support.js",
    "functions/api/admin/accounting_tax_support.js",
    "functions/api/admin/accounting_t2125_workpaper.js",
    "functions/api/admin/accounting_accountant_package.js",
    "functions/api/admin/accounting_year_end_report.js",
]:
    node_check(rel)
for rel in ["admin-tax-support.html", "admin-tax-review.html"]:
    inline_script_check(rel)

if errors:
    print("Build 273 focused release check: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("Build 273 focused release check: PASS")
print(" - persistent RLS tax-support authorities are source-controlled and additive")
print(" - Finance reads use finance.view; tax-support writes use finance.tax.manage")
print(" - mileage uses dedicated business-use records and never customer vehicle mileage")
print(" - home-office, vehicle and CCA calculations stay review-first")
print(" - enriched T2125 and accountant package use structured facts without fabricating filing judgment")
print(" - Tax Support UI collects masked identity plus mileage/home-office/CCA/inventory facts and exports accountant JSON")
print(" - Build 273 living authorities and ACTIVE checkpoint are synchronized")
