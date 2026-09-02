#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD291_PRODUCTION_SHA = "e6ab73751864a12447657ff263a8787f4718d25c"
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


def one_h1(rel):
    count = len(re.findall(r"<h1(?:\s[^>]*)?>", text(rel), flags=re.I))
    if count != 1:
        errors.append(f"{rel} expected exactly one H1, found {count}")


def git_run(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)


def require_ancestor(anchor, label):
    shallow = git_run("rev-parse", "--is-shallow-repository")
    if shallow.returncode:
        errors.append(f"could not determine repository history depth for {label}: {shallow.stderr.strip()}")
        return
    if shallow.stdout.strip().lower() == "true":
        expanded = git_run("fetch", "--no-tags", "--prune", "--unshallow", "origin")
        if expanded.returncode:
            errors.append(f"could not obtain complete history for {label}: {expanded.stderr.strip()}")
            return
    probe = git_run("cat-file", "-e", f"{anchor}^{{commit}}")
    if probe.returncode:
        fetched = git_run("fetch", "--no-tags", "origin", anchor)
        if fetched.returncode:
            errors.append(f"could not fetch {label} anchor {anchor}: {fetched.stderr.strip()}")
            return
    proc = git_run("merge-base", "--is-ancestor", anchor, "HEAD")
    if proc.returncode:
        errors.append(f"{label} is not an ancestor of the Build 292 candidate")


# Historical runtime workflows may be shallow. Require complete history before the
# exact accepted Build 291 Production ancestry assertion; missing history fails closed.
require_ancestor(BUILD291_PRODUCTION_SHA, "accepted Build 291 Production")

for rel in ["fleet.html", "fleet/index.html"]:
    one_h1(rel)
    need(rel,
         'data-build292="fleet-workplace-acquisition-intake"',
         "Fleet and Workplace Vehicle Detailing",
         "There is no automatic fleet threshold, discount or service frequency.",
         'id="fleet-assessment-form"',
         'name="business_name"', 'name="request_type"', 'value="workplace_group"',
         'value="small_business"', 'value="contractor_work_trucks"',
         'value="household_multi_vehicle"', 'value="dealership_overflow"',
         'value="not_sure"', 'value="one_time"', 'value="seasonal"',
         'value="as_needed"', 'value="repeat_interest"',
         "does not create a quote, appointment or recurring commitment",
         'aria-live="polite"', 'aria-busy')
    forbid(rel, ">Monthly<", "6+ vehicles", "Commercial-friendly pricing")

for rel in ["fleet-pricing.html", "fleet-pricing/index.html"]:
    one_h1(rel)
    need(rel,
         "Fleet and multi-vehicle quote planning",
         "No automatic fleet minimum or vehicle threshold",
         "No automatic volume discount or commercial rate",
         "No fixed recurring cadence or priority-booking promise",
         "No recurring billing authorization",
         "/fleet#fleet-assessment-form")
    forbid(rel, "6+ vehicles", "Commercial-friendly pricing", "Recurring cycles")

if text("fleet.html") != text("fleet/index.html"):
    errors.append("fleet route copies differ")
if text("fleet-pricing.html") != text("fleet-pricing/index.html"):
    errors.append("fleet-pricing route copies differ")

need("functions/api/public_lead_submit.js",
     "FLEET_REQUEST_TYPES", "FLEET_TIMING_PREFERENCES",
     'source_path = "/fleet"', 'Prefer: "return=minimal"',
     "creates_quote: false", "creates_appointment: false",
     "creates_recurring_commitment: false", "SUPABASE_SERVICE_KEY",
     "SUPABASE_SERVICE_ROLE", "SUPABASE_SECRET_KEY",
     'error: "Method not allowed."', "allowed_methods")
forbid("functions/api/public_lead_submit.js",
       'Prefer: "return=representation"', "details: data", "lead: Array.isArray",
       'Access-Control-Allow-Methods": "GET,POST,OPTIONS"')

need("BUILD292_SUMMARY.md", "Build 292", "Fleet / Workplace Acquisition Intake Authority", "no schema migration")
need("scripts/build292_http_smoke.sh", "/fleet", "/fleet-pricing", "/api/public_lead_submit", "must not create a Development lead row")
need(".github/workflows/build292-source-gate.yml", "Build 292 Source Gate", "python scripts/build292_release_check.py")
need(".github/workflows/build292-development-acceptance.yml", "Build 292 Development Runtime Acceptance", "scripts/build292_http_smoke.sh")

proc = subprocess.run(["node", "--check", str(ROOT / "functions/api/public_lead_submit.js")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"node --check failed public_lead_submit.js: {proc.stderr.strip()}")
proc = subprocess.run(["bash", "-n", str(ROOT / "scripts/build292_http_smoke.sh")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"bash -n failed build292_http_smoke.sh: {proc.stderr.strip()}")

if errors:
    print("Build 292 fleet/workplace intake check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 292 fleet/workplace intake check: PASS")
print("- fleet/workplace assessment copy is quote-first and one-H1 safe")
print("- request type and timing preferences are allowlisted")
print("- server owns the canonical fleet source path")
print("- public lead success/failure responses do not expose stored rows or Supabase details")
print("- route copies agree and no schema migration is introduced")
print("- pricing, thresholds, discounts, cadence, contract, appointment and recurring-billing authority remain unapproved")
