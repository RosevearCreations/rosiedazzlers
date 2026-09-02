#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "48b2f0f8b8a1f4311b09f79e64e8e8cf64a0f18b"
PRODUCTION = "337ae533130f4bf1c566d47c2ba1bc712cbf780e"
ASSET = "assets/admin-booking-v299.js"
PAGES = ["admin-booking.html", "admin-booking/index.html"]
TAG = '<script type="module" src="/assets/admin-booking-v299.js"></script>'
errors = []

def read(rel):
    p = ROOT / rel
    if not p.exists():
        errors.append(f"missing {rel}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def baseline_page(rel):
    p = subprocess.run(["git", "show", f"{BASELINE}:{rel}"], cwd=ROOT, capture_output=True, text=True)
    if p.returncode:
        errors.append(f"could not read accepted Build 298 baseline {rel}")
        return ""
    return p.stdout

def split_module(text, label):
    marker = '<script type="module">'
    start = text.rfind(marker)
    if start < 0:
        errors.append(f"{label} missing mature booking module")
        return None
    body_start = start + len(marker)
    end = text.find('</script>', body_start)
    if end < 0:
        errors.append(f"{label} missing booking module close")
        return None
    return start, body_start, end, end + len('</script>')

for sha, label in [(BASELINE, 'accepted Build 298 Development'), (PRODUCTION, 'accepted Build 296 Production')]:
    if subprocess.run(["git", "merge-base", "--is-ancestor", sha, "HEAD"], cwd=ROOT).returncode:
        errors.append(f"{label} is not an ancestor of Build 299 candidate")

roots = [baseline_page(rel) for rel in PAGES]
if roots[0] and roots[1] and roots[0] != roots[1]:
    errors.append("accepted Build 298 booking route copies differ")
parts = split_module(roots[0], 'accepted Build 298 admin-booking.html') if roots[0] else None
if parts:
    start, body_start, end, close_end = parts
    expected_asset = roots[0][body_start:end].lstrip('\n')
    if read(ASSET) != expected_asset:
        errors.append("versioned booking asset is not byte-for-byte the accepted Build 298 inline runtime")
    expected_page = roots[0][:start] + TAG + roots[0][close_end:]
    for rel in PAGES:
        body = read(rel)
        if body != expected_page:
            errors.append(f"{rel} differs from accepted Build 298 source beyond exact runtime extraction")
        if TAG not in body:
            errors.append(f"{rel} missing Build 299 booking runtime tag")

if read(PAGES[0]) != read(PAGES[1]):
    errors.append("booking route copies are not exact")

for rel in PAGES:
    body = read(rel)
    for token in ['data-page="admin-booking"', '/assets/admin-auth.js', '/assets/admin-shell.js', 'id="loadBookingsBtn"', 'id="statusForm"', 'id="assignForm"', 'id="financeForm"', 'Manage bookings and assignments']:
        if token not in body:
            errors.append(f"{rel} lost retained booking source token {token}")

asset = read(ASSET)
for token in ['/api/admin/bookings', '/api/admin/booking_update', '/api/admin/assign_booking', '/api/admin/staff_assignable_list', '/api/admin/booking_finance', 'credentials: "include"', 'window.AdminShell']:
    if token not in asset:
        errors.append(f"{ASSET} missing retained runtime token {token}")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 299 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 299 unexpectedly changes schema/migration file {name}")

required = {
    'BUILD299_SUMMARY.md': ['Build 299', 'Operations Booking Dashboard Support Maintainability Extraction', 'no booking behavior change', 'no database or schema migration'],
    'scripts/build299_http_smoke.sh': ['/assets/admin-booking-v299.js', 'read-only'],
    '.github/workflows/build299-source-gate.yml': ['Build 299 Source Gate', 'scripts/build299_release_check.py'],
    '.github/workflows/build299-development-source-gate.yml': ['Build 299 Development Source Gate', 'scripts/build299_release_check.py'],
    '.github/workflows/build299-development-acceptance.yml': ['Build 299 Development Runtime Acceptance', 'scripts/build299_http_smoke.sh'],
    'AI_PROJECT_HANDOFF.md': ['**Build:** 299', PRODUCTION, 'Operations booking-dashboard support maintainability extraction'],
    'MASTER_VALUE_ROADMAP.md': ['**Build:** 299', PRODUCTION, 'Build 299 — Operations booking-dashboard support maintainability extraction'],
}
for rel, tokens in required.items():
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

for rel in ['.github/workflows/build299-bootstrap-extract-booking-runtime.yml', '.github/workflows/build299-bootstrap-authorities.yml', '.github/workflows/build299-bootstrap-docs.yml', '.github/workflows/build299-retained-guard-scan.yml']:
    if (ROOT / rel).exists():
        errors.append(f"temporary Build 299 bootstrap/scan file remains: {rel}")

syntax = subprocess.run(['node', '--check', str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke = subprocess.run(['bash', '-n', str(ROOT / 'scripts/build299_http_smoke.sh')], capture_output=True, text=True)
if smoke.returncode:
    errors.append(f"bash -n failed build299_http_smoke.sh: {smoke.stderr.strip()}")

if errors:
    print('Build 299 Operations booking-dashboard support maintainability extraction check: FAIL')
    for e in errors: print('-', e)
    sys.exit(1)
print('Build 299 Operations booking-dashboard support maintainability extraction check: PASS')
print('- accepted Build 298 booking runtime is byte-for-byte preserved in assets/admin-booking-v299.js')
print('- both booking route copies differ from Build 298 only by the external module tag')
print('- booking, assignment, intake, vehicle-review and existing finance/document orchestration remain unchanged')
print('- no booking behavior, API contract, pricing, scheduling rule or schema migration was introduced')
print('- Production remains accepted Build 296 and stays closed')
