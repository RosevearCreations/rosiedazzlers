#!/usr/bin/env python3
"""Build 359 focused source proof for the read-only customer retention dashboard."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / "functions/api/admin/customer_retention_dashboard.js"
PAGE = ROOT / "admin-customer-retention.html"


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise SystemExit(f"FAIL: {label}: missing {needle!r}")


def forbid(text: str, needle: str, label: str) -> None:
    if needle in text:
        raise SystemExit(f"FAIL: {label}: forbidden {needle!r}")


def main() -> None:
    api = API.read_text(encoding="utf-8")
    page = PAGE.read_text(encoding="utf-8")

    for needle, label in [
        ("customer_profile_id=eq.${encodedId}", "exact booking/vehicle customer isolation"),
        ("identity_rule:'exact_customer_profile_id_only'", "identity boundary"),
        ("Boolean(row?.completed_at)", "canonical completion timestamp"),
        ("repeat_service_count:Math.max(completedCount - 1, 0)", "repeat count"),
        ("open_booking_count:open.length", "open bookings"),
        ("saved_vehicle_count:exactVehicles.length", "saved vehicles"),
        ("source:'explicit_customer_vehicle_planning'", "maintenance evidence"),
        ("value:null", "unknown fleet interest when no explicit link exists"),
        ("fuzzy_identity_merge:false", "no fuzzy identity"),
        ("inferred_outreach_consent:false", "no inferred consent"),
        ("persistent_retention_score:false", "no invented score"),
        ("crm_queue:false", "Build 360 queue excluded"),
        ("polling:false", "no polling"),
        ("writes:false", "read-only contract"),
        ("export async function onRequestPut()", "mutation method rejected"),
        ("export async function onRequestPatch()", "mutation method rejected"),
        ("export async function onRequestDelete()", "mutation method rejected"),
    ]:
        require(api, needle, label)

    for needle in ["method: 'PATCH'", 'method: "PATCH"', "method: 'DELETE'", 'method: "DELETE"']:
        forbid(api, needle, "retention API must not mutate")

    for needle, label in [
        ('data-build359="customer-retention-dashboard"', "Build 359 UI marker"),
        ('/api/admin/customer_admin_list', "existing customer authority reuse"),
        ('/api/admin/customer_retention_dashboard', "retention API wiring"),
        ('No customer data was changed.', "read-only UI acknowledgement"),
        ('Fleet interest', "fleet indicator"),
        ('Maintenance interest', "maintenance indicator"),
        ('No open bookings.', "open-booking empty state"),
        ('No saved vehicles.', "vehicle empty state"),
    ]:
        require(page, needle, label)

    forbid(page, "setInterval(", "dashboard polling")
    forbid(page, "setTimeout(", "dashboard background refresh")

    print("GREEN: Build 359 customer retention focused source proof passed.")


if __name__ == "__main__":
    main()
