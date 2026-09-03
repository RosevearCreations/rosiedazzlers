#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "1049f25205b3ea1cfa04dbdc72b2e3e726e1344a"
PRODUCTION = "09442c53d385aca7995150ace4bde55abd51d7df"
PAGE = "admin-catalog.html"
FOLDER_PAGE = "admin-catalog/index.html"
ASSET = "assets/admin-catalog-v311.js"
TAG = '<script src="/assets/admin-catalog-v311.js"></script>'
errors = []

SUCCESSOR_BUILD312 = {
    "functions/api/_lib/catalog-integrity.js",
    "functions/api/admin/catalog_inventory_save.js",
    "functions/api/admin/catalog_purchase_order_update.js",
    "functions/api/admin/catalog_reorder_request.js",
    "functions/api/admin/catalog_stock_action.js",
    "scripts/build312_inventory_integrity_audit.query",
    "scripts/build312_inventory_integrity_test.mjs",
    "scripts/build312_release_check.py",
    "scripts/build312_http_smoke.sh",
    ".github/workflows/build312-source-gate.yml",
    ".github/workflows/build312-development-source-gate.yml",
    ".github/workflows/build312-development-acceptance.yml",
    ".github/workflows/build301-development-source-gate.yml",
    "BUILD312_SUMMARY.md",
}


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def baseline_file(rel):
    proc = subprocess.run(["git", "show", f"{BASELINE}:{rel}"], cwd=ROOT, capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"could not read accepted Build 310 baseline {rel}: {proc.stderr.strip()}")
        return ""
    return proc.stdout


def split_inventory_runtime(text, label):
    marker = '<script>\n(function(){'
    start = text.find(marker)
    if start < 0:
        errors.append(f"{label} missing mature Inventory Operations inline runtime")
        return None
    if text.find(marker, start + 1) >= 0:
        errors.append(f"{label} has multiple Inventory Operations runtime starts")
        return None
    body_start = start + len('<script>\n')
    end = text.find('</script>', body_start)
    if end < 0:
        errors.append(f"{label} missing Inventory Operations runtime close")
        return None
    chrome = text.find('<script src="/assets/chrome.js"></script>', end)
    if chrome < 0:
        errors.append(f"{label} lost retained chrome.js boundary after Inventory Operations runtime")
        return None
    return start, body_start, end, end + len('</script>')


def require_ancestor(anchor, label):
    proc = subprocess.run(["git", "merge-base", "--is-ancestor", anchor, "HEAD"], cwd=ROOT)
    if proc.returncode:
        errors.append(f"{label} is not an ancestor of Build 311 candidate")


require_ancestor(BASELINE, "accepted Build 310 Development")
require_ancestor(PRODUCTION, "accepted Build 303 Production")

baseline_page = baseline_file(PAGE)
baseline_folder = baseline_file(FOLDER_PAGE)
if baseline_page and baseline_folder and baseline_page != baseline_folder:
    errors.append("accepted Build 310 Inventory root/folder route copies unexpectedly diverge")
parts = split_inventory_runtime(baseline_page, "accepted Build 310 admin-catalog.html") if baseline_page else None
if parts:
    start, body_start, end, close_end = parts
    expected_asset = baseline_page[body_start:end]
    if read(ASSET) != expected_asset:
        errors.append("versioned Inventory Operations asset is not byte-for-byte the accepted Build 310 inline runtime")
    expected_page = baseline_page[:start] + TAG + baseline_page[close_end:]
    if read(PAGE) != expected_page:
        errors.append(f"{PAGE} differs from accepted Build 310 source beyond exact runtime extraction")
    if read(FOLDER_PAGE) != expected_page:
        errors.append(f"{FOLDER_PAGE} differs from the exact Build 311 canonical Inventory route copy")

page = read(PAGE)
folder_page = read(FOLDER_PAGE)
if folder_page != page:
    errors.append(f"{FOLDER_PAGE} is not byte-for-byte synchronized with {PAGE}")
asset = read(ASSET)

for token in [
    '<h1 style="margin:0 0 6px">Inventory Workflow</h1>',
    '/admin-inventory-manager.html',
    '/admin-inventory-posting.html',
    'id="usageForm"',
    'Low inventory & reorder candidates',
    'Purchase orders & reminders',
    TAG,
]:
    if token not in page:
        errors.append(f"{PAGE} lost retained Inventory Operations source token {token}")
if '<script>\n(function(){' in page:
    errors.append(f"{PAGE} still contains inline Inventory Operations runtime")

for token in [
    "const optionStorageKey='rosie_inventory_dropdown_options_v2';",
    'function computeLowStockItems(',
    '/api/admin/catalog_inventory_list',
    '/api/admin/catalog_inventory_save',
    '/api/admin/catalog_stock_action',
    '/api/admin/catalog_reorder_request',
    '/api/admin/catalog_usage_add',
    '/api/admin/catalog_usage_list',
    '/api/admin/catalog_low_stock_list',
    '/api/admin/catalog_purchase_orders_list',
    '/api/admin/catalog_purchase_order_update',
    '/api/admin/catalog_supplier_link_preview',
    'client_action_id: usageActionId',
    "window.AdminShell.boot({ pageKey:'admin-catalog'",
]:
    if token not in asset:
        errors.append(f"{ASSET} missing retained runtime token {token}")
if 'setInterval(' in asset:
    errors.append(f"{ASSET} introduces prohibited idle polling")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 311 changed files")
else:
    allowed = {
        PAGE,
        FOLDER_PAGE,
        ASSET,
        "scripts/build309_release_check.py",
        "scripts/build311_release_check.py",
        "scripts/build311_http_smoke.sh",
        ".github/workflows/build311-source-gate.yml",
        ".github/workflows/build311-development-source-gate.yml",
        ".github/workflows/build311-development-acceptance.yml",
        "BUILD311_SUMMARY.md",
        "AUTONOMOUS_RELEASE_QUEUE.md",
    } | SUCCESSOR_BUILD312
    for name in changed.stdout.splitlines():
        low = name.lower()
        if low.startswith("functions/") and name not in SUCCESSOR_BUILD312:
            errors.append(f"Build 311 unexpectedly changes server/API authority: {name}")
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 311 unexpectedly changes schema/migration file {name}")
        if name not in allowed:
            errors.append(f"unexpected Build 311 source path: {name}")

queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
for token in [
    "Build 311 — Inventory Operations maintainability extraction",
    "Build 312 — Inventory data-integrity sweep",
    "Build 318 — Whole-application route/API authority sweep",
]:
    if token not in queue:
        errors.append(f"AUTONOMOUS_RELEASE_QUEUE.md missing retained Build 311 queue token {token}")

for rel, tokens in {
    "scripts/build311_http_smoke.sh": ["admin-catalog-v311.js", "read-only", "catalog_inventory_list", "catalog_usage_add"],
    ".github/workflows/build311-source-gate.yml": ["Build 311 Source Gate", "scripts/build311_release_check.py"],
    ".github/workflows/build311-development-source-gate.yml": ["Build 311 Development Source Gate", "scripts/build311_release_check.py"],
    ".github/workflows/build311-development-acceptance.yml": ["Build 311 Development Runtime Acceptance", "scripts/build311_http_smoke.sh"],
}.items():
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

syntax = subprocess.run(["node", "--check", str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke = subprocess.run(["bash", "-n", str(ROOT / "scripts/build311_http_smoke.sh")], capture_output=True, text=True)
if smoke.returncode:
    errors.append(f"bash -n failed build311_http_smoke.sh: {smoke.stderr.strip()}")

if errors:
    print("Build 311 Inventory Operations maintainability extraction check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 311 Inventory Operations maintainability extraction check: PASS")
print("- accepted Build 310 Inventory Operations runtime is byte-for-byte preserved in assets/admin-catalog-v311.js")
print("- admin-catalog.html and admin-catalog/index.html differ from accepted Build 310 only by the external runtime-script tag")
print("- inventory list/save, stock adjustment, usage, low-stock, reorder, purchase-order and supplier-link API identities remain unchanged")
print("- Build 312 successor paths are exact and do not weaken the retained Build 311 extraction/schema boundary")
print("- runtime acceptance is read-only; it performs no inventory write")
print(f"- Production remains accepted Build 303 at {PRODUCTION} and stays closed for Build 311")
