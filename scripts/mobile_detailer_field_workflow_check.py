#!/usr/bin/env python3
"""Build 383 — fail-closed source authority for the mobile Detailer field workflow."""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def read(path: str) -> str:
    file = ROOT / path
    if not file.exists():
        errors.append(f"missing required Build 383 source: {path}")
        return ""
    return file.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles: list[str], label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")


def require_versioned_module(text: str, route: str, minimum: int, label: str) -> None:
    """Accept newer cache-busting builds without accepting old or absent entrypoints."""
    active = [int(value) for value in re.findall(re.escape(route) + r"\?v=\d{8}build(\d+)", text)]
    if not active or max(active) < minimum:
        errors.append(f"{label} must load {route} at Build {minimum} or newer")


def require_verified_conjunction(text: str, name: str, fields: set[str]) -> None:
    """Exact AND-only evidence gates; a stale feed can never satisfy them."""
    match = re.search(r"\b" + re.escape(name) + r":([^,}\n]+)", text)
    expression = match.group(1).strip() if match else ""
    if not re.fullmatch(r"[A-Za-z_]\w*(?:&&[A-Za-z_]\w*)*", expression) or set(expression.split("&&")) != fields:
        errors.append(f"{name} must require every evidence field AND verified fresh feed")


shell = read("app/detailer/index.html")
app = read("apps/detailer/detailer-app.js")
live = read("apps/detailer/live-job-module.js")
notes = read("functions/api/detailer/job_note_post.js")
media = read("functions/api/admin/progress_media_post.js")
roadmap = read("FORWARD_BUILD_ROADMAP_378_385.md")

# Later Detailer releases may legitimately advance the shell's active build number.
# Preserve the Build 383 safety contract without forcing newer shells to masquerade as 383.
active_build_match = re.search(r'data-build="(\d+)"', shell)
if not active_build_match:
    errors.append("Detailer shell is missing a numeric data-build marker")
elif int(active_build_match.group(1)) < 383:
    errors.append("Detailer shell predates the retained Build 383 field workflow authority")

require(shell, [
    "Build 383 field workflow",
    "Start requires current audited onsite setup",
    "Complete retains the field-evidence sequence",
], "Detailer shell")
require_versioned_module(shell, "/apps/detailer/detailer-app.js", 749, "Detailer shell")

require(app, [
    "Build 383",
    "fieldGate",
    "fieldGate.canStart",
    "fieldGate.canComplete",
    "Before-service evidence is incomplete.",
    "Completion is blocked until",
    "onFieldState",
], "Detailer app")
require_versioned_module(app, "/apps/detailer/live-job-module.js", 746, "Detailer app")

require(live, [
    "data-live-module=\"build383\"",
    "3. Before photos",
    "4. Service checklist",
    "5. Approved add-ons / scope changes",
    "6. Product usage",
    "7. Completion evidence",
    "8. After photos",
    "9. Customer / final-balance handoff",
    "[FIELD CHECKLIST]",
    "[PRODUCT USAGE]",
    "[APPROVED ADD-ONS]",
    "[COMPLETION EVIDENCE]",
    "/api/detailer/job_note_post",
    "/api/detailer/media_upload_url",
    "/api/detailer/media_post",
    "/final-balance-payment.html?booking_id=",
    "Payment state was not changed.",
    "No setInterval",
], "live field module")
require_verified_conjunction(live, "canStart", {"verified", "beforePhoto", "checklist", "onsiteReady"})
require_verified_conjunction(live, "canComplete", {"verified", "beforePhoto", "checklist", "addons", "products", "completion", "afterPhoto"})

require(notes, [
    "requireStaffAccess",
    "requireActionAccess",
    "detailer.message.send",
    "booking_id",
], "booking-scoped note authority")
require(media, [
    "requireStaffAccess",
    "booking_id",
    "normalizeLiveStage",
    "job_media",
], "booking-scoped media authority")
require(roadmap, [
    "### Build 383 — Mobile Detailer Field Workflow Hardening",
    "### Build 384 — Finance Cockpit & Month-End UX",
    "Preserve staff authorization and customer privacy boundaries.",
], "forward roadmap")

# The field application may hand the customer to the existing final-balance page,
# but it must not call payment/provider mutation APIs or claim authority to approve add-ons.
for label, text in [("Detailer app", app), ("live field module", live)]:
    for forbidden in [
        "/api/payments/",
        "/api/admin/refund",
        "square/final-balance",
        "stripe/payment",
        "mark_paid",
        "payment_status='paid'",
        'payment_status="paid"',
    ]:
        if forbidden.lower() in text.lower():
            errors.append(f"{label} contains forbidden payment/provider mutation reference: {forbidden}")

if "setInterval(" in live or "setInterval(" in app:
    errors.append("Build 383 introduced recurring field polling; the Detailer runtime must remain event-driven")

if errors:
    print("BUILD 383 MOBILE DETAILER FIELD WORKFLOW: FAIL")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("BUILD 383 MOBILE DETAILER FIELD WORKFLOW: PASS")
print(" - arrival/readiness and keys/access retain existing server authority")
print(" - before-photo + checklist evidence fail closed before Start")
print(" - approved scope, product usage, completion evidence and after photos fail closed before Complete")
print(" - field records reuse booking-scoped note/media authorities; no new schema or duplicate ledger")
print(" - final balance is customer handoff only; no provider/payment mutation is introduced")
print(" - event-driven runtime remains free of recurring polling")
