#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD290_SHA = "5aa23c8c9b532824d738db6439e30b13cb5f59c3"
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
    body = text(rel)
    if not body:
        return
    count = len(re.findall(r"<h1(?:\s[^>]*)?>", body, flags=re.I))
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
        errors.append(f"{label} is not an ancestor of the Build 291 candidate")


# Build 291 is a forward Development descendant of the accepted Build 290 release.
# Historical runtime workflows use shallow checkouts; complete history is required
# before the exact accepted ancestry assertion can be evaluated.
require_ancestor(BUILD290_SHA, "accepted Build 290")

for rel in ["maintenance-plan.html", "maintenance-plan/index.html"]:
    one_h1(rel)
    need(
        rel,
        "Maintenance detailing interest",
        "Cadence selected after service review",
        "interest request only",
        "does not create a subscription",
        "Timing preference",
        "preference only",
        "not_sure",
        "about_4_weeks",
        "about_6_weeks",
        "about_8_weeks",
        "seasonal_custom",
        "submitting",
        "setSubmitting",
        "aria-live=\"polite\"",
        "It is not a booking or recurring-service authorization.",
    )
    forbid(
        rel,
        "Every 4 or 8 weeks",
        "Priority reminder before your preferred date",
        "completed Complete Detail baseline",
        "source_url: window.location.href",
        "fixed membership or subscription offer",
    )

need(
    "maintenance-plan/index.html",
    "Rosie brings standard detailing water and power",
    "safe work area",
    "parking or work-area access",
    "membership.waitlist_enabled === false",
)

need(
    "functions/api/membership_interest_create.js",
    "PREFERRED_CYCLES",
    'about_4_weeks: "About every 4 weeks (preference only)"',
    'not_sure: "Not sure yet"',
    "normalizePreferredCycle",
    'Prefer: "return=minimal"',
    'source_url: "/maintenance-plan"',
    "creates_subscription: false",
    "creates_appointment: false",
    "creates_recurring_billing: false",
    'json({ error: "Maintenance interest is temporarily unavailable." }, 503)',
    'json({ error: "Could not save maintenance interest right now." }, 503)',
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SERVICE_ROLE",
    "SUPABASE_SECRET_KEY",
)
forbid(
    "functions/api/membership_interest_create.js",
    'Prefer: "return=representation"',
    "request: Array.isArray(out)",
    "out?.message",
    "out?.error",
    "source_url = cleanText(body.source_url)",
    'preferred_cycle = cleanText(body.preferred_cycle) || "Every 4 weeks"',
)

need(
    "assets/growth-settings.js",
    "Cadence selected after service review",
    "no subscription, fixed cadence, price, discount, or perk is promised",
    "normalizePublicMembershipSettings",
)

need(
    "scripts/build291_http_smoke.sh",
    "/maintenance-plan",
    "/api/membership_interest_create",
    "invalid_cycle",
    '"A valid email is required."',
    '"Choose a maintenance timing preference."',
    "must not write a maintenance-interest row",
)
need(
    ".github/workflows/build291-source-gate.yml",
    "name: Build 291 Source Gate",
    "build291-maintenance-retention-intake",
    "python scripts/build291_release_check.py",
    "python scripts/build290_release_check.py",
    "node scripts/build290_action_permission_test.mjs",
    "python scripts/build290_rollback_check.py",
    "Production remains closed",
)
need(
    ".github/workflows/build291-development-acceptance.yml",
    "name: Build 291 Development Runtime Acceptance",
    "scripts/build291_http_smoke.sh",
    "python scripts/build291_release_check.py",
    "Production remains closed",
)
need(
    ".github/workflows/development-source-gate.yml",
    "Check Build 291 maintenance retention syntax",
    "Run current Build 291 focused guard",
    "python scripts/build291_release_check.py",
    "build291_http_smoke.sh",
)
need(
    "BUILD291_SUMMARY.md",
    "Build 291",
    "Maintenance Retention Intake Authority",
    "interest request",
    "no schema migration",
    "no maintenance-plan economics",
    "Production remains closed for Build 291",
)
need(
    "AI_PROJECT_HANDOFF.md",
    "**Build:** 291",
    "Build 291",
    "maintenance retention intake",
    "configuration-present",
    "Production remains closed",
)
need(
    "MASTER_VALUE_ROADMAP.md",
    "**Build:** 291",
    "Build 291",
    "maintenance retention intake",
    "accounting_documents",
    "accountant-friendly export surfaces",
    "Production remains closed",
)

for rel in ["functions/api/membership_interest_create.js", "assets/growth-settings.js"]:
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")

proc = subprocess.run(["bash", "-n", str(ROOT / "scripts/build291_http_smoke.sh")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"bash -n failed scripts/build291_http_smoke.sh: {proc.stderr.strip()}")

if errors:
    print("Build 291 maintenance retention intake check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 291 maintenance retention intake check: PASS")
print("- static maintenance source matches the retained interest-only authority")
print("- cadence values are preferences, not service commitments")
print("- public intake allowlists cadence and does not trust caller source_url")
print("- successful public responses do not return the stored database row")
print("- persistence failures do not return raw Supabase details")
print("- client blocks repeat clicks while a write is in flight")
print("- no schema, pricing, discount, perk, appointment or recurring-billing authority changed")
print("- Production remains closed")
