#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f'missing {path}')
        return ''
    return p.read_text(encoding='utf-8', errors='ignore')

try:
    rules = json.loads(read('config/maintenance-plan-business-rulebook.json') or '{}')
except Exception as exc:
    errors.append(f'invalid rulebook JSON: {exc}')
    rules = {}

if rules.get('schema_version') != 'build-370-v1':
    errors.append('wrong rulebook version')
if rules.get('status') != 'awaiting_business_approval':
    errors.append('rulebook must await business approval')
if rules.get('business_approval_required') is not True:
    errors.append('business approval must be required')

activation = rules.get('activation') or {}
for key in ('plan_enabled','pilot_enrollment_allowed','automatic_enrollment_allowed','recurring_billing_allowed','automatic_renewal_allowed'):
    if activation.get(key) is not False:
        errors.append(f'activation {key} must be false')

authority = rules.get('authority') or {}
for key in ('booking_flow_remains_authoritative','current_service_area_rules_apply','current_site_access_rules_apply','current_weather_and_safety_rules_apply','current_vehicle_condition_review_applies','current_payment_and_deposit_rules_apply'):
    if authority.get(key) is not True:
        errors.append(f'authority {key} must be true')

required = ('eligibility','cadence','price','inclusions','exclusions','cancellation','priority')
decisions = rules.get('decisions') or {}
for domain in required:
    if domain not in decisions:
        errors.append(f'missing decision domain {domain}')
    elif decisions[domain].get('approved') is not False:
        errors.append(f'{domain} must remain unapproved in Build 370')

price = decisions.get('price') or {}
for key in ('pricing_model','amount_cents','discount_percent','price_lock_policy'):
    if price.get(key) is not None:
        errors.append(f'price {key} must remain unset')

cancel = decisions.get('cancellation') or {}
for key in ('notice_hours','late_cancel_fee_cents','missed_visit_policy','pause_policy','termination_policy'):
    if cancel.get(key) is not None:
        errors.append(f'cancellation {key} must remain unset')

priority = decisions.get('priority') or {}
if priority.get('priority_booking_allowed') is not None:
    errors.append('priority decision must remain unset')
if priority.get('guaranteed_slot_allowed') is not False:
    errors.append('guaranteed slot must remain false')

for domain, keys in {
    'eligibility': ('eligible_customer_types','eligible_vehicle_types'),
    'cadence': ('allowed_intervals',),
    'inclusions': ('service_codes','included_add_on_codes','condition_limits'),
    'exclusions': ('excluded_service_codes','excluded_add_on_codes','condition_exclusions'),
}.items():
    row = decisions.get(domain) or {}
    for key in keys:
        if row.get(key) != []:
            errors.append(f'{domain}.{key} must remain an empty draft list')

growth = read('assets/growth-settings.js')
for token in ("rulebook_status: 'awaiting_business_approval'", "enabled: false"):
    if token not in growth:
        errors.append(f'growth settings missing {token}')
if 'enabled: source.enabled === true' in growth:
    errors.append('retained source flag can still activate maintenance plan')

policy = read('docs/MAINTENANCE_PLAN_BUSINESS_RULEBOOK.md').lower()
for token in ('eligibility','cadence','price','inclusions','exclusions','cancellation','priority','build 371','live booking flow'):
    if token not in policy:
        errors.append(f'policy missing {token}')

proc = subprocess.run(['node','--check','assets/growth-settings.js'], cwd=ROOT, text=True, capture_output=True)
if proc.returncode != 0:
    errors.append('growth settings syntax failed')

sql = [p for p in ROOT.rglob('*.sql') if '370' in p.name.lower()]
if sql:
    errors.append('Build 370 must not add a schema migration')

if errors:
    print('MAINTENANCE PLAN BUSINESS RULEBOOK AUTHORITY: FAIL')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

print('MAINTENANCE PLAN BUSINESS RULEBOOK AUTHORITY: PASS')
print(' - required decision domains are explicit')
print(' - unresolved economics and entitlements fail closed')
print(' - enrolment and recurring billing remain disabled')
print(' - existing booking and operational authorities remain in force')
print(' - no Build 370 schema migration detected')
