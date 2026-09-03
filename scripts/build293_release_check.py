#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD292_PRODUCTION_SHA = "0198026b4ded4cb26ee9e0d3b9d298bfa719d5e3"
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
        errors.append(f"{label} is not an ancestor of the Build 293 candidate")


# Historical runtime workflows may be shallow. Require complete history before the
# exact accepted Build 292 Production ancestry assertion; missing history fails closed.
require_ancestor(BUILD292_PRODUCTION_SHA, "accepted Build 292 Production")

need(
    "assets/customer-next-actions-v293.js",
    "Build 293",
    'DASHBOARD_API = "/api/client/dashboard"',
    'credentials: "include"',
    "What’s next?",
    "review_completed_service",
    "rebook_service",
    "open_progress",
    "book_first_or_next_service",
    "Review completed service",
    "Book this service again",
    "Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated",
    "data-build293-maintenance-boundary",
    "Maintenance timing is an interest preference",
    "No fixed cadence, price, discount, priority, subscription, appointment or recurring billing",
    "Build 289 owns manual recovery",
)
forbid(
    "assets/customer-next-actions-v293.js",
    'method: "POST"',
    "/api/client/reviews_save",
    "/api/membership_interest_create",
    "/api/checkout",
    "setInterval(",
    "referral reward",
    "maintenance discount",
)

need(
    "assets/client-auth.js",
    "loadBuild293CustomerNextActions",
    'path !== "/my-account"',
    "/assets/customer-next-actions-v293.js",
    "data-build293-customer-next-actions",
)

for rel in ["my-account.html", "my-account/index.html"]:
    need(rel, 'id="accountNotice"', 'id="bookingHistory"', 'id="maintenanceConversion"', 'id="reviewForm"', "/assets/client-auth.js")
account_asset = ROOT / "assets/my-account-v296.js"
account_runtime = text("assets/my-account-v296.js") if account_asset.exists() else text("my-account.html")
if "/api/client/dashboard" not in account_runtime:
    errors.append("customer account runtime missing retained Build 293 dashboard authority")

need(
    "functions/api/client/dashboard.js",
    "customerSafeReviews",
    "bookings:",
    "reviews",
    "authenticated: true",
)
need(
    "functions/api/client/_lib/customer-safe-shape.js",
    "const REVIEW_FIELDS = [",
    "'booking_id'",
    "export function customerSafeReview(row) { return pick(row, REVIEW_FIELDS); }",
    "export function customerSafeReviews(rows)",
)

need("BUILD293_SUMMARY.md", "Build 293", "Customer Retention Next-Action Hub", "no schema migration", "navigation/orchestration only")
need("scripts/build293_http_smoke.sh", "/my-account", "/assets/customer-next-actions-v293.js", "/api/client/dashboard", "must not create")
need(".github/workflows/build293-source-gate.yml", "Build 293 Source Gate", "python scripts/build293_release_check.py")
need(".github/workflows/build293-development-acceptance.yml", "Build 293 Development Runtime Acceptance", "scripts/build293_http_smoke.sh")
need(
    "AI_PROJECT_HANDOFF.md",
    "**Build:** 293",
    "Build 293 — customer retention next-action hub",
    "customer-safe review projection retaining `booking_id`",
    "Production remains closed",
)
need(
    "MASTER_VALUE_ROADMAP.md",
    "**Build:** 293",
    "Build 293 — customer retention next-action hub",
    "Customer maintenance/auto-schedule authority closure",
    "accounting_documents",
    "accountant-friendly export surfaces",
)

for rel in ["assets/customer-next-actions-v293.js", "assets/client-auth.js"]:
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")
proc = subprocess.run(["bash", "-n", str(ROOT / "scripts/build293_http_smoke.sh")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"bash -n failed build293_http_smoke.sh: {proc.stderr.strip()}")

if errors:
    print("Build 293 customer retention next-action check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 293 customer retention next-action check: PASS")
print("- one authenticated next-action panel coordinates retained review/rebook/progress/booking authorities")
print("- customer-safe review projection retains booking_id so reviewed completed jobs are not re-prompted")
print("- Build 285 current booking recalculation boundary remains explicit")
print("- Build 291 maintenance interest remains free of unapproved cadence, price, discount, appointment and recurring-billing promises")
print("- Build 289 remains the manual recovery authority; Build 293 does not poll or retry automatically")
print("- living handoff and roadmap identify Build 293 and the next safe authority-closure slice")
print("- no schema migration or new customer write authority is introduced")
print("- Production remains closed")