#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def need(path, token):
    text = (ROOT / path).read_text(encoding='utf-8', errors='ignore')
    if token not in text:
        errors.append(f'{path} missing required contract: {token}')
    return text

helper = need('functions/api/_lib/fleet-account-pipeline.js', 'Conversion must come from the booking/quote workflow')
api = need('functions/api/admin/fleet_account_pipeline.js', 'topic=eq.fleet')
page = need('admin-fleet-accounts.html', 'Status and internal follow-up note only')
need('admin-fleet-accounts.html', 'safeMediaUrl')
need('admin-fleet-maintenance.html', '/admin-fleet-accounts.html')
need('functions/api/public_lead_submit.js', 'creates_appointment: false')
need('fleet.html', 'it does not create a quote, appointment or recurring commitment')

for forbidden in ('converted_booking_id =', 'booking_id =', 'quote_id =', 'auto_schedule_opt_in', 'recurring_billing', 'stripe', 'paypal'):
    if forbidden in api.lower():
        errors.append(f'fleet pipeline API contains forbidden authority token: {forbidden}')

for token in ('"status", "staff_note"', 'marks_conversion: false', 'creates_quote: false', 'creates_appointment: false', 'charges_customer: false'):
    if token not in api and token not in helper:
        errors.append(f'fleet pipeline write boundary missing: {token}')

if "['new','reviewing','contacted','quoted','closed','spam']" not in page:
    errors.append('admin workbench must not offer converted as a writable status')

if "u.protocol==='http:'||u.protocol==='https:'" not in page:
    errors.append('customer-supplied media links must be restricted to HTTP/HTTPS')

if 'topic: "eq.fleet"' not in api and 'topic=eq.fleet' not in api:
    errors.append('fleet pipeline list must hard-filter to fleet topic')

if 'capability: "manage_bookings"' not in api:
    errors.append('fleet pipeline must use staff Operations authorization')

sql_candidates = list(ROOT.glob('**/*329*.sql'))
if sql_candidates:
    errors.append('Build 329 unexpectedly introduces SQL migration files: ' + ', '.join(str(p.relative_to(ROOT)) for p in sql_candidates))

proc = subprocess.run(['node', 'scripts/fleet_account_pipeline_test.mjs'], cwd=ROOT, text=True, capture_output=True)
if proc.returncode != 0:
    errors.append('fleet account executable test failed: ' + (proc.stdout + proc.stderr).strip())

if errors:
    print('FLEET ACCOUNT PIPELINE: FAIL')
    for err in errors:
        print(' -', err)
    raise SystemExit(1)

print('FLEET ACCOUNT PIPELINE: PASS')
print(' - live fleet intake remains quote/booking/billing neutral')
print(' - staff pipeline writes are limited to status and internal note')
print(' - conversion is read-only and delegated to approved workflow')
print(' - customer media links are protocol constrained')
print(' - executable contract tests passed')
