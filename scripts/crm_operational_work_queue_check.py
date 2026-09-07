#!/usr/bin/env python3
"""Focused source proof for Build 360 CRM Operational Work Queue."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "functions/api/_lib/crm-operational-work-queue.js"
API = ROOT / "functions/api/admin/customer_crm_work_queue.js"
PAGE = ROOT / "admin-customer-crm-work-queue.html"
TEST = ROOT / "scripts/crm_operational_work_queue_test.mjs"


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise SystemExit(f"FAIL: {label}: missing {needle!r}")


def forbid(text: str, needle: str, label: str) -> None:
    if needle in text:
        raise SystemExit(f"FAIL: {label}: forbidden {needle!r}")


def main() -> None:
    lib = LIB.read_text(encoding="utf-8")
    api = API.read_text(encoding="utf-8")
    page = PAGE.read_text(encoding="utf-8")
    test = TEST.read_text(encoding="utf-8")

    for needle, label in [
        ("reengagement_after_days: 120", "bounded re-engagement policy"),
        ("resolved_hold_days: 30", "review hold policy"),
        ("code:'maintenance_due'", "maintenance reason"),
        ("code:'recent_service_followup'", "recent-service reason"),
        ("code:'reengagement_due'", "re-engagement reason"),
        ("outreach_consent:null", "no inferred outreach consent"),
        ("automatic_send_allowed:false", "no auto-send authority"),
        ("crm_queue_${action}", "existing audit event namespace"),
        ("manual_contact_confirmed", "manual-contact acknowledgement"),
    ]:
        require(lib, needle, label)

    for needle, label in [
        ("customer_profile_id=not.is.null", "exact customer-profile source boundary"),
        ("customer_admin_audit_events", "existing customer audit trail"),
        ("addCustomerAudit", "audited staff outcomes"),
        ("identity_rule:'exact_customer_profile_id_only'", "identity rule"),
        ("schema_change:false", "no schema change"),
        ("persistent_score:false", "no persistent CRM score"),
        ("fuzzy_identity_merge:false", "no fuzzy identity"),
        ("inferred_outreach_consent:false", "no consent inference"),
        ("automatic_notifications:false", "no automatic notification"),
        ("automatic_booking_creation:false", "no booking authority"),
        ("automatic_payment_action:false", "no payment authority"),
        ("changes_customer_profile:false", "action does not mutate profile"),
    ]:
        require(api, needle, label)

    forbid(api, "/rest/v1/customer_profiles?id=eq.", "CRM endpoint must not patch customer profiles")
    forbid(api, "/api/checkout", "CRM endpoint must not initiate checkout")

    for needle, label in [
        ('data-build360="crm-operational-work-queue"', "Build 360 UI marker"),
        ('/api/admin/customer_crm_work_queue', "CRM API wiring"),
        ('outreach consent: not inferred', "contact boundary visible"),
        ('Record manual contact', "manual contact recorder"),
        ('No contact needed', "no-contact action"),
        ('Refresh queue', "explicit refresh"),
        ('No CRM candidates match', "empty state"),
    ]:
        require(page, needle, label)

    forbid(page, "setInterval(", "no CRM polling")
    forbid(page, "setTimeout(", "no background refresh")

    for needle in [
        "assert.equal(queue.length,2)",
        "recently reviewed unchanged signal should be held out of queue",
        "open booking should suppress re-engagement-only candidate",
        "manual_contact_confirmed:true",
    ]:
        require(test, needle, "executable CRM contract")

    print("GREEN: Build 360 CRM operational work queue focused source proof passed.")


if __name__ == "__main__":
    main()
