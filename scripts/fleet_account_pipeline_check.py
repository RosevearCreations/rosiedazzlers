#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def need(path, token):
    p = ROOT / path
    if not p.exists():
        errors.append(f'missing required file: {path}')
        return ''
    text = p.read_text(encoding='utf-8', errors='ignore')
    if token not in text:
        errors.append(f'{path} missing required contract: {token}')
    return text

helper = need('functions/api/_lib/fleet-account-pipeline.js', 'Conversion must come from the booking/quote workflow')
api = need('functions/api/admin/fleet_account_pipeline.js', 'topic=eq.fleet')
page = need('admin-fleet-accounts.html', 'Create / open draft quote')
handoff_helper = need('functions/api/_lib/fleet-quote-handoff.js', 'fleet_quote_handoff_ambiguous')
handoff_api = need('functions/api/admin/fleet_quote_handoff.js', 'concurrent_create_reused')
quote_ui = need('assets/admin-quotes-v298.js', "get('quote_id')")
need('admin-fleet-accounts.html', 'safeMediaUrl')
need('admin-fleet-maintenance.html', '/admin-fleet-accounts.html')
need('functions/api/public_lead_submit.js', 'creates_appointment: false')
need('fleet.html', 'it does not create a quote, appointment or recurring commitment')

# The general fleet pipeline remains status + staff-note only. Quote handoff is a
# separate explicit operation and must never be smuggled into the generic PATCH.
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

# Controlled fleet -> quote handoff contracts.
for token in (
    'id: validation.id',
    'lead_id: validation.id',
    'customer_id: null',
    'booking_id: null',
    'status: "draft"',
    'quoted_amount_cents: 0',
    'accepted_amount_cents: 0',
    'source_channel: "fleet_public_inquiry"',
    'prepare_quote',
):
    if token not in handoff_helper:
        errors.append(f'fleet quote helper missing contract: {token}')

for token in (
    'capability: "manage_bookings"',
    'topic=eq.fleet',
    'lead_id=eq.',
    'limit=3',
    'createRes.status === 409',
    'isDeterministicFleetQuote',
    'changes_lead_status: false',
    'creates_customer_profile: false',
    'creates_booking: false',
    'creates_appointment: false',
    'charges_customer: false',
    'creates_recurring_commitment: false',
):
    if token not in handoff_api:
        errors.append(f'fleet quote handoff API missing contract: {token}')

if 'method: "PATCH"' in handoff_api:
    errors.append('fleet quote handoff must not PATCH the lead, booking, customer or quote as a side effect')
if '/rest/v1/customer_profiles' in handoff_api or '/rest/v1/bookings' in handoff_api:
    errors.append('fleet quote handoff must not create or mutate customer profiles/bookings')
for provider in ('stripe', 'paypal'):
    if provider in handoff_api.lower():
        errors.append(f'fleet quote handoff must not contain payment-provider authority: {provider}')

for token in (
    '/api/admin/fleet_quote_handoff',
    'Create / open draft quote',
    'does not mark the lead quoted',
    'does not create a customer account or booking',
):
    if token not in page:
        errors.append(f'fleet workbench missing quote handoff/help contract: {token}')

for token in ('requestedQuoteId', 'rows.find(r=>r.id===requestedQuoteId)', 'fill(requested)'):
    if token not in quote_ui:
        errors.append(f'quote dashboard missing exact handoff selection contract: {token}')

# This slice deliberately reuses existing tables; no new schema authority is needed.
sql_candidates = list(ROOT.glob('**/*335*.sql'))
if sql_candidates:
    errors.append('Build 335 must not introduce SQL migration files: ' + ', '.join(str(p.relative_to(ROOT)) for p in sql_candidates))

for test in ('scripts/fleet_account_pipeline_test.mjs', 'scripts/fleet_quote_handoff_test.mjs'):
    proc = subprocess.run(['node', test], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f'{test} failed: ' + (proc.stdout + proc.stderr).strip())

if errors:
    print('FLEET ACCOUNT PIPELINE: FAIL')
    for err in errors:
        print(' -', err)
    raise SystemExit(1)

print('FLEET ACCOUNT PIPELINE: PASS')
print(' - live fleet intake remains appointment/booking/billing neutral')
print(' - generic staff pipeline writes remain limited to status and internal note')
print(' - eligible fleet leads can hand off to one deterministic draft quote')
print(' - existing linked quotes are reused and ambiguous duplicates fail closed')
print(' - draft handoff does not mark the lead quoted or create a customer profile/booking')
print(' - customer media links remain protocol constrained')
print(' - executable fleet pipeline and quote-handoff tests passed')
