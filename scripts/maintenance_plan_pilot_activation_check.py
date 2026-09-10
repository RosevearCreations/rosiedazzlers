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
    pilot = json.loads(read('config/maintenance-plan-pilot-activation.json') or '{}')
except Exception as exc:
    errors.append(f'invalid pilot activation JSON: {exc}')
    pilot = {}

try:
    rulebook = json.loads(read('config/maintenance-plan-business-rulebook.json') or '{}')
except Exception as exc:
    errors.append(f'invalid rulebook JSON: {exc}')
    rulebook = {}

if pilot.get('schema_version') != 'build-371-v1':
    errors.append('wrong pilot activation version')
if pilot.get('status') != 'prepared_fail_closed':
    errors.append('Build 371 pilot must remain prepared_fail_closed')
if pilot.get('scope') != 'vehicle_specific_pilot':
    errors.append('pilot scope must be vehicle specific')
if pilot.get('canonical_rulebook') != 'config/maintenance-plan-business-rulebook.json':
    errors.append('pilot must consume the canonical Build 370 rulebook')

requires = pilot.get('requires') or {}
for key in (
    'all_rulebook_domains_approved',
    'canonical_customer_identity',
    'canonical_vehicle_identity',
    'vehicle_customer_match',
    'explicit_staff_activation_intent',
    'pilot_enrollment_flag',
    'plan_enabled_flag',
):
    if requires.get(key) is not True:
        errors.append(f'pilot requirement {key} must be true')

prohibited = pilot.get('prohibited') or {}
for key in (
    'automatic_enrollment',
    'automatic_renewal',
    'recurring_billing',
    'guaranteed_priority',
    'provider_mutation',
    'parallel_customer_or_vehicle_model',
):
    if prohibited.get(key) is not True:
        errors.append(f'pilot prohibition {key} must be true')

for key in ('mutation_authority', 'provider_mutation_authority', 'persistence_authority'):
    if pilot.get(key) is not False:
        errors.append(f'{key} must remain false in Build 371')

required_domains = ('eligibility','cadence','price','inclusions','exclusions','cancellation','priority')
decisions = rulebook.get('decisions') or {}
for domain in required_domains:
    if (decisions.get(domain) or {}).get('approved') is not False:
        errors.append(f'current rulebook domain {domain} must remain unapproved until the business decides it')

activation = rulebook.get('activation') or {}
for key in ('plan_enabled','pilot_enrollment_allowed','automatic_enrollment_allowed','recurring_billing_allowed','automatic_renewal_allowed'):
    if activation.get(key) is not False:
        errors.append(f'current canonical activation {key} must remain false')

helper = read('functions/api/_lib/maintenance-plan-pilot.js')
for token in (
    'REQUIRED_DECISION_DOMAINS',
    'vehicle_belongs_to_customer',
    'activation_requested',
    'can_activate',
    'mutation_authority: false',
    'provider_mutation_authority: false',
    'recurring_billing_allowed: false',
    'automatic_renewal_allowed: false',
    'guaranteed_priority_allowed: false',
):
    if token not in helper:
        errors.append(f'pilot evaluator missing {token}')

for banned in ('stripe', 'paypal', 'createPaymentIntent', 'subscriptions.create', 'INSERT INTO', 'UPDATE customers', 'UPDATE vehicles'):
    if banned.lower() in helper.lower():
        errors.append(f'pilot evaluator contains forbidden mutation/provider token {banned}')

growth = read('assets/growth-settings.js')
if "rulebook_status: 'awaiting_business_approval'" not in growth or 'enabled: false' not in growth:
    errors.append('public maintenance-plan fail-closed boundary is missing')

policy = read('docs/MAINTENANCE_PLAN_PILOT_ACTIVATION.md').lower()
for token in ('vehicle-specific','explicit','seven','no recurring billing','build 372'):
    if token not in policy:
        errors.append(f'pilot activation policy missing {token}')

sql = [p for p in ROOT.rglob('*.sql') if '371' in p.name.lower()]
if sql:
    errors.append('Build 371 must not add a schema migration')

for command in (
    ['node','--check','functions/api/_lib/maintenance-plan-pilot.js'],
    ['node','--check','scripts/maintenance_plan_pilot_activation_test.mjs'],
    ['node','scripts/maintenance_plan_pilot_activation_test.mjs'],
):
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print('MAINTENANCE PLAN PILOT ACTIVATION AUTHORITY: FAIL')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

print('MAINTENANCE PLAN PILOT ACTIVATION AUTHORITY: PASS')
print(' - vehicle-specific pilot decision mechanics are present')
print(' - all seven business domains remain required and currently unapproved')
print(' - explicit activation intent and canonical customer/vehicle identity are required')
print(' - automatic enrolment, renewal, billing, guaranteed priority and provider mutation remain prohibited')
print(' - no Build 371 schema migration detected')
