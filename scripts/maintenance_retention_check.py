#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

public_page = text("maintenance-plan.html")
create_api = text("functions/api/membership_interest_create.js")
admin_api = text("functions/api/admin/membership_interest_list.js")
admin_page = text("admin-growth.html")

for token in ["interest request only", "recurring billing authorization", "not a booking or recurring-service authorization"]:
    if token.lower() not in public_page.lower():
        errors.append(f"maintenance-plan.html missing public interest-only contract: {token}")

for token in ["creates_automatic_enrollment: false", "creates_appointment: false", "creates_recurring_billing: false"]:
    if token not in create_api:
        errors.append(f"membership_interest_create.js missing fail-closed contract: {token}")

for token in ["interest_requests", "reminder_candidates", "metrics", "readiness", "automatic_enrollment: false", "recurring_billing: false", "due_reminder_count"]:
    if token not in admin_api:
        errors.append(f"admin membership readiness API missing {token}")

for token in ["/api/admin/membership_interest_list", "Maintenance Plan readiness", "no automatic enrollment", "No recurring billing", "Maintenance Plan operating help", "data-interest-waitlist"]:
    if token.lower() not in admin_page.lower():
        errors.append(f"admin-growth.html missing retention/help surface: {token}")

if "@media(max-width:" not in admin_page.replace(" ", ""):
    errors.append("admin-growth.html missing explicit small-screen responsive contract")

if errors:
    print("Maintenance/retention authority: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("Maintenance/retention authority: PASS")
print(" - public capture remains interest-only and non-billing")
print(" - API explicitly denies automatic enrollment, appointment creation and recurring billing")
print(" - staff workbench exposes waitlist/reminder metrics and current readiness")
print(" - operating help and responsive admin presentation remain protected")
