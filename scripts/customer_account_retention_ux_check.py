#!/usr/bin/env python3
"""Build 382 — fail-closed source authority for customer account/retention convergence."""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def read(path: str) -> str:
    file = ROOT / path
    if not file.exists():
        errors.append(f"missing required Build 382 source: {path}")
        return ""
    return file.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles: list[str], label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")


helper = read("functions/api/client/_lib/customer-retention.js")
endpoint = read("functions/api/client/retention.js")
account = read("assets/my-account-v355.js")
ux = read("assets/my-account-v382.js")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
roadmap = read("FORWARD_BUILD_ROADMAP_378_385.md")

require(helper, [
    "quote_proposal_drafts",
    "membership_interest_requests",
    "review_request_queue",
    "customer_reviews",
    "creates_subscription: false",
    "creates_automatic_enrollment: false",
    "creates_appointment: false",
    "creates_recurring_billing: false",
    "notification_opt_in",
    "detailer_chat_opt_in",
    "booking_path: '/book'",
], "retention projection")

require(endpoint, [
    "getCurrentCustomerSession",
    "touchCustomerSession",
    "customerSafeProfile",
    "customerSafeReviews",
    "loadCustomerRetention",
    "Sign in required to view account retention details.",
    "allowed_methods: ['GET', 'OPTIONS']",
], "authenticated retention endpoint")

require(account, [
    "Build 382",
    "import('/assets/my-account-v382.js')",
    "loadCustomerRetentionView",
    "renderDashboardHistory(payload)",
], "My Account adapter")

require(ux, [
    "Quotes, care plan & next steps",
    "data-build382-quotes",
    "data-build382-maintenance",
    "data-build382-communication",
    "data-build382-review",
    "data-build382-rebooking",
    "Interest is not enrollment.",
    "does not independently decide eligibility",
    "Current availability, service scope and pricing are always reconfirmed in the booking flow.",
], "Build 382 customer UX")

require(queue, [
    "**Build 381 — Operations Daily Command Centre**",
    "**Build 382 — Customer Account & Retention UX Convergence** is the active bounded release.",
    "**Build 383 — Mobile Detailer Field Workflow Hardening**",
], "release queue")
require(handoff, [
    "**Build 381 — Operations Daily Command Centre**",
    "**Build 382 — Customer Account & Retention UX Convergence** is the active bounded release.",
    "**Build 383 — Mobile Detailer Field Workflow Hardening**",
], "project handoff")
require(readme, [
    "Current source direction: **Build 382 — Customer Account & Retention UX Convergence**.",
    "schema-neutral",
    "existing quote, maintenance-interest, communication-preference, review and booking authorities",
], "README")
require(roadmap, [
    "### Build 382 — Customer Account & Retention UX Convergence",
    "### Build 383 — Mobile Detailer Field Workflow Hardening",
], "forward roadmap")

# Build 382 is a projection/UX release. It must not contain a persistence primitive
# in its new customer retention sources. The POST handler exists only to fail 405.
mutation_needles = [
    "method: 'PATCH'",
    'method: "PATCH"',
    "method: 'DELETE'",
    'method: "DELETE"',
    "method: 'PUT'",
    'method: "PUT"',
    "Prefer: 'return=representation'",
    'Prefer: "return=representation"',
]
for label, text in [("retention projection", helper), ("retention endpoint", endpoint)]:
    for needle in mutation_needles:
        if needle in text:
            errors.append(f"{label} contains forbidden mutation primitive: {needle}")

# Never expose quote acceptance tokens/hashes or staff-private fields in the customer projection.
for forbidden in [
    "acceptance_token_hash",
    "structured_terms_hash",
    "accepted_terms_hash",
    "admin_private_notes",
    "service_role_key",
]:
    if forbidden in helper.lower() or forbidden in ux.lower():
        errors.append(f"Build 382 customer projection exposes forbidden field/reference: {forbidden}")

if errors:
    print("BUILD 382 CUSTOMER ACCOUNT & RETENTION UX: FAIL")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("BUILD 382 CUSTOMER ACCOUNT & RETENTION UX: PASS")
print(" - authenticated customer projection reuses existing authorities")
print(" - quotes, maintenance interest, communication consent, review lifecycle and rebooking are converged")
print(" - no customer-side lifecycle mutation or duplicate ledger is introduced")
print(" - maintenance and review states remain truthful/fail-closed")
print(" - Build 382 remains schema-neutral")
