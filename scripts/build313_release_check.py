#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "032bd2fab73b6cba4ab48c9db45b828c34c88d70"
PRODUCTION = "09442c53d385aca7995150ace4bde55abd51d7df"
PAGE = "admin-app.html"
FOLDER_PAGE = "admin-app/index.html"
ASSET = "assets/admin-app-v313.js"
TAG = '<script src="/assets/admin-app-v313.js"></script>'
errors = []

ALLOWED = {
    PAGE,
    FOLDER_PAGE,
    ASSET,
    "scripts/build313_release_check.py",
    "scripts/build313_http_smoke.sh",
    ".github/workflows/build313-source-gate.yml",
    ".github/workflows/build313-development-source-gate.yml",
    ".github/workflows/build313-development-acceptance.yml",
    "scripts/build309_release_check.py",
    "scripts/build311_release_check.py",
    "scripts/build312_release_check.py",
    "BUILD313_SUMMARY.md",
    "AUTONOMOUS_RELEASE_QUEUE.md",
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
        errors.append(f"could not read accepted Build 312 baseline {rel}: {proc.stderr.strip()}")
        return ""
    return proc.stdout


def split_runtime(text, label):
    marker = '<script>\n(function(){'
    start = text.find(marker)
    if start < 0:
        errors.append(f"{label} missing mature App Management inline controller")
        return None
    if text.find(marker, start + 1) >= 0:
        errors.append(f"{label} has multiple App Management controller starts")
        return None
    body_start = start + len('<script>\n')
    end = text.find('</script>', body_start)
    if end < 0:
        errors.append(f"{label} missing App Management controller close")
        return None
    return start, body_start, end, end + len('</script>')


def require_ancestor(anchor, label):
    proc = subprocess.run(["git", "merge-base", "--is-ancestor", anchor, "HEAD"], cwd=ROOT)
    if proc.returncode:
        errors.append(f"{label} is not an ancestor of Build 313 candidate")


require_ancestor(BASELINE, "accepted Build 312 Development")
require_ancestor(PRODUCTION, "accepted Build 303 Production")

baseline_page = baseline_file(PAGE)
baseline_folder = baseline_file(FOLDER_PAGE)
if baseline_page and baseline_folder and baseline_page != baseline_folder:
    errors.append("accepted Build 312 App Management root/folder route copies unexpectedly diverge")
parts = split_runtime(baseline_page, "accepted Build 312 admin-app.html") if baseline_page else None
if parts:
    start, body_start, end, close_end = parts
    expected_asset = baseline_page[body_start:end]
    if read(ASSET) != expected_asset:
        errors.append("versioned App Management asset is not byte-for-byte the accepted Build 312 inline controller")
    expected_page = baseline_page[:start] + TAG + baseline_page[close_end:]
    if read(PAGE) != expected_page:
        errors.append(f"{PAGE} differs from accepted Build 312 source beyond exact runtime extraction")
    if read(FOLDER_PAGE) != expected_page:
        errors.append(f"{FOLDER_PAGE} differs from the exact Build 313 canonical route copy")

page = read(PAGE)
folder_page = read(FOLDER_PAGE)
asset = read(ASSET)
if page != folder_page:
    errors.append(f"{FOLDER_PAGE} is not byte-for-byte synchronized with {PAGE}")

for token in [
    '<h1>App Management</h1>',
    'the single pricing catalog used by booking, services, pricing, checkout',
    'The single shared pricing and package catalog',
    '/admin-catalog.html',
    TAG,
]:
    if token not in page:
        errors.append(f"{PAGE} lost retained Product/Catalog source token {token}")
if '<script>\n(function(){' in page:
    errors.append(f"{PAGE} still contains inline App Management controller")

for token in [
    "function setPricingCatalogState(",
    "function readPricingCatalog(",
    "pricingCatalogState.packages",
    "pricingCatalogState.addons",
    "pricingCatalogState.service_areas",
    "pricingCatalogState.public_requirements",
    "/api/admin/app_settings_get",
    "/api/admin/app_settings_save",
    "saveSetting('pricing_catalog', pricingCatalogState",
    "Booking, pricing, services, checkout, and pricing controls now share this source.",
    "window.AdminPageInit.init({ pageKey:'admin-app'",
]:
    if token not in asset:
        errors.append(f"{ASSET} missing retained Product/Catalog runtime token {token}")
if 'setInterval(' in asset:
    errors.append(f"{ASSET} introduces prohibited idle polling")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 313 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if name not in ALLOWED:
            errors.append(f"unexpected Build 313 source path: {name}")
        if low.startswith("functions/"):
            errors.append(f"Build 313 unexpectedly changes server/API authority: {name}")
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 313 unexpectedly changes schema/migration authority: {name}")

for rel in [
    "functions/api/admin/app_settings_get.js",
    "functions/api/admin/app_settings_save.js",
    "functions/api/_lib/staff-auth.js",
]:
    proc = subprocess.run(["git", "diff", "--quiet", BASELINE, "--", rel], cwd=ROOT)
    if proc.returncode:
        errors.append(f"Build 313 changed retained Product/Catalog server authority {rel}")

for rel, tokens in {
    "scripts/build313_http_smoke.sh": ["admin-app-v313.js", "read-only", "app_settings_get", "pricing_catalog"],
    ".github/workflows/build313-source-gate.yml": ["Build 313 Source Gate", "scripts/build313_release_check.py"],
    ".github/workflows/build313-development-source-gate.yml": ["Build 313 Development Source Gate", "scripts/build313_release_check.py"],
    ".github/workflows/build313-development-acceptance.yml": ["Build 313 Development Runtime Acceptance", "scripts/build313_http_smoke.sh"],
}.items():
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
for token in [
    "Build 313 — Catalog/Product Administration extraction",
    "Build 314 — Media/Photo Studio reliability",
    "Build 319 — Runtime efficiency + CI consolidation",
]:
    if token not in queue:
        errors.append(f"AUTONOMOUS_RELEASE_QUEUE.md missing retained Build 313 queue token {token}")

syntax = subprocess.run(["node", "--check", str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke = subprocess.run(["bash", "-n", str(ROOT / "scripts/build313_http_smoke.sh")], capture_output=True, text=True)
if smoke.returncode:
    errors.append(f"bash -n failed build313_http_smoke.sh: {smoke.stderr.strip()}")

if errors:
    print("Build 313 Catalog/Product Administration extraction check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 313 Catalog/Product Administration extraction check: PASS")
print("- accepted Build 312 App Management controller is byte-for-byte preserved in assets/admin-app-v313.js")
print("- admin-app root/folder routes differ from accepted Build 312 only by the external controller tag")
print("- pricing packages, add-ons, service areas, public requirements and app-settings API authority remain unchanged")
print("- no Product/Catalog server, schema, pricing rule or business-data authority changed")
print("- runtime acceptance is read-only and introduces no idle polling")
print(f"- Production remains accepted Build 303 at {PRODUCTION} and stays closed for Build 313")
