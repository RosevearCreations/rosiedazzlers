#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(path):
    return (ROOT / path).read_text(encoding='utf-8', errors='ignore')

def require(path, token):
    body = text(path)
    if token not in body:
        errors.append(f'{path} missing required contract: {token}')
    return body

helper = require('functions/api/_lib/maintenance-retention-followup.js', 'Scheduling and conversion must come from the approved booking workflow')
api = require('functions/api/admin/customer_maintenance_followup.js', 'reminder_engine_suppressed: false')
legacy = require('functions/api/admin/membership_interest_list.js', "'interested','scheduled','converted','closed','unsubscribed'")
page = require('admin-maintenance-retention.html', 'No action here sends email/SMS')
fleet_page = require('admin-fleet-accounts.html', '/admin-maintenance-retention.html')
require('scripts/maintenance_retention_followup_test.mjs', 'Maintenance retention follow-up contract: PASS')

for forbidden in ('processMembershipReminderCandidate', 'dispatchNotificationThroughProvider', '/rest/v1/notification_events', 'stripe', 'paypal'):
    if forbidden.lower() in api.lower():
        errors.append(f'maintenance follow-up API contains forbidden authority token: {forbidden}')

if re.search(r'/rest/v1/bookings[^\n]*(?:POST|PATCH|DELETE)', api, re.I):
    errors.append('maintenance follow-up API must not mutate bookings')

for token in ('"new", "contacted", "interested", "closed", "unsubscribed"', '"scheduled", "converted"', 'customer_visible: false'):
    if token not in helper:
        errors.append(f'maintenance follow-up helper missing boundary: {token}')

for token in ('capability: "manage_bookings"', '/rest/v1/membership_interest_requests', '/rest/v1/vehicle_history_events', 'sends_notification: false', 'conversion_authority: false', 'recurring_billing: false', 'Unsubscribed maintenance interest cannot be reactivated'):
    if token not in api:
        errors.append(f'maintenance follow-up API missing authority: {token}')

if "qualified_count: counts.interested" not in legacy or "counts.qualified" in legacy:
    errors.append('legacy maintenance readiness metrics are not aligned to live interested status')

if len(re.findall(r'<h1\b', page, re.I)) != 1:
    errors.append('maintenance retention workbench must have exactly one H1')
for token in ('name="viewport"', 'noindex,nofollow', '@media(max-width:520px)', 'Reminder suppression', 'Appointment creation', 'Recurring billing'):
    if token not in page:
        errors.append(f'maintenance retention workbench missing UI contract: {token}')

if '/admin-maintenance-retention.html' not in fleet_page:
    errors.append('fleet operations surface must link to maintenance retention review')

sql_candidates = [p for p in ROOT.rglob('*.sql') if '330' in p.name.lower() or 'build330' in p.name.lower()]
if sql_candidates:
    errors.append('Build 330 unexpectedly introduces SQL migration files: ' + ', '.join(str(p.relative_to(ROOT)) for p in sql_candidates))

proc = subprocess.run(['node', 'scripts/maintenance_retention_followup_test.mjs'], cwd=ROOT, text=True, capture_output=True)
if proc.returncode != 0:
    errors.append('maintenance retention follow-up executable test failed: ' + (proc.stdout + proc.stderr).strip())

if errors:
    print('MAINTENANCE RETENTION FOLLOW-UP: FAIL')
    for err in errors:
        print(' -', err)
    raise SystemExit(1)

print('MAINTENANCE RETENTION FOLLOW-UP: PASS')
print(' - waitlist follow-up matches the live status model and cannot manufacture scheduled or converted state')
print(' - unsubscribed interest cannot be reactivated from the workbench')
print(' - reminder review writes only internal vehicle-history evidence')
print(' - no message dispatch, reminder suppression, booking, payment or recurring billing authority')
print(' - executable contract tests passed')
