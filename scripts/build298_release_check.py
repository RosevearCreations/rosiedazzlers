#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD297_DEVELOPMENT_SHA = "a034182bf8fd5dc8f8025032834ad7be6ec1d762"
BUILD296_PRODUCTION_SHA = "337ae533130f4bf1c566d47c2ba1bc712cbf780e"
ASSET = "assets/admin-quotes-v298.js"
PAGES = ["admin-quotes.html", "admin-quotes/index.html"]
EXTERNAL_TAG = '<script src="/assets/admin-quotes-v298.js"></script>'
INLINE_PATTERN = re.compile(r'<script>(?P<body>\n\(function\(\)\{[\s\S]*?\n\}\)\(\);\n)</script>(?=</body></html>\s*$)')
errors = []


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def need(rel, *tokens):
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")


for sha, label in [
    (BUILD297_DEVELOPMENT_SHA, "accepted Build 297 Development"),
    (BUILD296_PRODUCTION_SHA, "accepted Build 296 Production"),
]:
    proc = subprocess.run(["git", "merge-base", "--is-ancestor", sha, "HEAD"], cwd=ROOT)
    if proc.returncode:
        errors.append(f"{label} is not an ancestor of Build 298 candidate")

baseline = subprocess.run(
    ["git", "show", f"{BUILD297_DEVELOPMENT_SHA}:admin-quotes.html"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if baseline.returncode:
    errors.append("could not read accepted Build 297 quote-pipeline baseline")
    baseline_source = ""
else:
    baseline_source = baseline.stdout

matches = list(INLINE_PATTERN.finditer(baseline_source)) if baseline_source else []
if len(matches) != 1:
    errors.append(f"accepted Build 297 baseline must contain exactly one mature quote runtime; found {len(matches)}")
    baseline_body = ""
else:
    baseline_body = matches[0].group("body")

asset_body = read(ASSET)
if baseline_body and asset_body != baseline_body:
    errors.append("versioned quote-pipeline asset is not byte-for-byte the accepted Build 297 inline runtime")

expected_page = INLINE_PATTERN.sub(EXTERNAL_TAG, baseline_source, count=1) if len(matches) == 1 else ""
for rel in PAGES:
    body = read(rel)
    if expected_page and body != expected_page:
        errors.append(f"{rel} differs from accepted Build 297 source beyond the exact runtime extraction")
    if EXTERNAL_TAG not in body:
        errors.append(f"{rel} missing Build 298 quote runtime tag")
    if INLINE_PATTERN.search(body):
        errors.append(f"{rel} still contains the mature inline quote runtime")
    for token in [
        'data-page="admin-quotes"',
        'data-build259="editable-quote-pipeline"',
        '/assets/admin-auth.js',
        '/assets/admin-shell.js',
        'id="quoteForm"',
        'id="qBooking"',
        'id="bookingLink"',
        'href="/admin-booking.html"',
        'Save quote',
    ]:
        if token not in body:
            errors.append(f"{rel} lost retained quote/booking source token {token}")

if read(PAGES[0]) != read(PAGES[1]):
    errors.append("quote-pipeline route copies are not exact")

need(
    ASSET,
    "/api/admin/quote_pipeline_list",
    "/api/admin/quote_pipeline_save",
    "credentials:'include'",
    "method:'POST'",
    "booking_id:$('#qBooking').value||null",
    "window.AdminShell.boot({pageKey:'admin-quotes'",
)

changed = subprocess.run(
    ["git", "diff", "--name-only", f"{BUILD297_DEVELOPMENT_SHA}...HEAD"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if changed.returncode:
    errors.append("could not inspect Build 298 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 298 unexpectedly changes schema/migration file {name}")

need("BUILD298_SUMMARY.md", "Build 298", "Operations Booking / Quote Support Maintainability Extraction", "no quote or booking behavior change", "no database or schema migration")
need("scripts/build298_http_smoke.sh", "/assets/admin-quotes-v298.js", "read-only")
need(".github/workflows/build298-source-gate.yml", "Build 298 Source Gate", "python scripts/build298_release_check.py")
need(".github/workflows/build298-development-source-gate.yml", "Build 298 Development Source Gate", "scripts/build298_release_check.py")
need(".github/workflows/build298-development-acceptance.yml", "Build 298 Development Runtime Acceptance", "scripts/build298_http_smoke.sh")
need("AI_PROJECT_HANDOFF.md", "**Build:** 298", BUILD296_PRODUCTION_SHA, "Operations booking/quote support maintainability extraction")
need("MASTER_VALUE_ROADMAP.md", "**Build:** 298", BUILD296_PRODUCTION_SHA, "Build 298 — Operations booking/quote support maintainability extraction")

for rel in [
    ".github/workflows/build298-bootstrap-extraction.yml",
    ".github/workflows/build298-bootstrap-authorities.yml",
    ".github/workflows/build298-retained-guard-scan.yml",
]:
    if (ROOT / rel).exists():
        errors.append(f"temporary Build 298 bootstrap/scan file remains: {rel}")

syntax = subprocess.run(["node", "--check", str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke_syntax = subprocess.run(["bash", "-n", str(ROOT / "scripts/build298_http_smoke.sh")], capture_output=True, text=True)
if smoke_syntax.returncode:
    errors.append(f"bash -n failed build298_http_smoke.sh: {smoke_syntax.stderr.strip()}")

if errors:
    print("Build 298 Operations booking/quote support maintainability extraction check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 298 Operations booking/quote support maintainability extraction check: PASS")
print("- accepted Build 297 quote runtime is byte-for-byte preserved in assets/admin-quotes-v298.js")
print("- both quote route copies differ from Build 297 only by the external classic-script tag")
print("- quote list/save behavior and booking bridge remain unchanged")
print("- no quote or booking behavior, API contract, pricing, recurrence or schema migration was introduced")
print("- temporary Build 298 bootstrap/scan machinery is absent")
print("- accepted Production remains Build 296 and Production stays closed for Build 298")
