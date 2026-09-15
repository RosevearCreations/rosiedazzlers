#!/usr/bin/env python3
"""Build 406 fail-closed authority for go-live evidence/provider-readiness convergence."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


def require(text, needles, label, casefold=False):
    hay = text.casefold() if casefold else text
    for needle in needles:
        target = needle.casefold() if casefold else needle
        if target not in hay:
            errors.append(f"{label} missing {needle!r}")


contract = read("BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md")
endpoint = read("functions/api/admin/go_live_readiness.js")
ui = read("admin/it.html")
roadmap = read("FORWARD_BUILD_ROADMAP_405_415.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
retained_diagnostics = read("functions/api/admin/production_diagnostics.js")

classes = ["source_ready", "runtime_proven", "provider_dependent", "owner_action", "unavailable"]
require(contract, classes + [
    "Unavailable is not failure", "/admin/it.html", "/api/admin/go_live_readiness",
    "provider outcomes", "source checks are not mislabeled as visual browser proof",
    "no schema migration", "Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance",
    "zero failed, zero queued and zero in-progress"
], "Build 406 contract", casefold=True)

require(endpoint, classes + [
    "onRequestGet", "onRequestHead", "requireStaffAccess", 'capability: "it_diagnostics"',
    "server_state_authoritative: true", "provider_success_inferred: false",
    "unavailable_is_failure: false", "automatic_provider_or_business_mutation: false",
    "automatic_background_replay: false", "CF_PAGES_COMMIT_SHA", "SUPABASE_URL",
    "R2_MEDIA.list({ limit: 1 })", "staff_users?select=id&limit=1",
    "provider_success_observed_by_this_check: false", "Cache-Control", "no-store"
], "Build 406 readiness endpoint")

for forbidden in ["onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete", ".put(", ".delete("]:
    if forbidden in endpoint:
        errors.append(f"Build 406 readiness endpoint contains mutation surface {forbidden!r}")
for pattern in [r"\binsert\s+into\b", r"\bupdate\s+\w+\s+set\b", r"\bdelete\s+from\b", r"\bdrop\s+table\b", r"\balter\s+table\b"]:
    if re.search(pattern, endpoint, re.I):
        errors.append(f"Build 406 readiness endpoint contains SQL mutation pattern {pattern!r}")
for forbidden in ["stripeSecret:", "paypalSecret:", "serviceKey:", "Authorization: `Bearer ${stripe", "Authorization: `Bearer ${paypal"]:
    if forbidden in endpoint:
        errors.append(f"Build 406 readiness endpoint may expose provider secret material via {forbidden!r}")

require(ui, classes + [
    'data-build406="go-live-evidence-provider-readiness-convergence"',
    "/api/admin/go_live_readiness", "Refresh Readiness", "unavailable is not automatically a failure",
    "/api/admin/production_diagnostics", "Refresh Diagnostics", "provider outcome"
], "Admin I.T. readiness cockpit", casefold=True)
if "setInterval" in ui:
    errors.append("Admin I.T. readiness cockpit must not use recurring setInterval polling")
if re.search(r"^[ \t]*loadReadiness\(\);", ui, re.M):
    errors.append("Build 406 readiness evidence must be operator-triggered, not automatically fetched on page load")
if "readinessButton.addEventListener('click', loadReadiness)" not in ui:
    errors.append("Build 406 readiness evidence must retain explicit operator-triggered refresh")

require(retained_diagnostics, [
    "onRequestGet", "requireStaffAccess", "R2_MEDIA.list({ limit: 1 })",
    "staff_users?select=id&limit=1", "No recurring polling", "No live provider mutation was performed"
], "retained Build 379 diagnostics", casefold=True)
if "onRequestPost" in retained_diagnostics:
    errors.append("retained production diagnostics must remain read-only")

require(roadmap, [
    "### Build 406 — Go-Live Evidence & Provider Readiness Convergence",
    "### Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance",
    "source-ready", "runtime-proven", "provider-dependent", "owner-action", "unavailable",
    "no provider action is inferred or fabricated"
], "active roadmap", casefold=True)

require(blockers, [
    "Build 406", "/admin/it.html", "source_ready", "runtime_proven", "provider_dependent",
    "owner_action", "unavailable", "Stripe", "R2", "phone", "tablet", "desktop",
    "Production is not called GREEN from source promotion alone"
], "go-live blocker authority", casefold=True)

for label, text in [("release queue", queue), ("project handoff", handoff), ("README", readme)]:
    require(text, ["Build 406", "Build 407", "FORWARD_BUILD_ROADMAP_405_415.md",
                   "BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md"], label)

for label, text in [("project handoff", handoff), ("README", readme)]:
    require(text, ["BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md"], label)

for p in ROOT.rglob("*"):
    if not p.is_file():
        continue
    rel = p.relative_to(ROOT).as_posix().casefold()
    if "406" in rel and (rel.endswith(".sql") or "migration" in rel or "schema" in rel):
        errors.append(f"Build 406 must not introduce schema/migration artifact: {rel}")

for forbidden in ["automatically charge", "auto-charge", "force main", "bypass protection"]:
    if forbidden in contract.casefold():
        errors.append(f"Build 406 contract contains forbidden authority claim {forbidden!r}")

if errors:
    print("BUILD 406 GO-LIVE EVIDENCE & PROVIDER READINESS CONVERGENCE: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 406 GO-LIVE EVIDENCE & PROVIDER READINESS CONVERGENCE: PASS")
print(" - Admin I.T. is the unified readiness surface")
print(" - source/runtime/provider/owner/unavailable evidence is explicitly classified")
print(" - unavailable evidence is not automatically failure")
print(" - provider success is never inferred from source/configuration presence")
print(" - readiness and retained diagnostics are authenticated, bounded and read-only")
print(" - Build 405 release discipline remains retained; Build 407 payment-provider acceptance is next")
print(" - Build 406 adds no schema or Production business/provider mutation authority")
