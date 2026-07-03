#!/usr/bin/env python3
"""Build 221 guard: customer-admin route 405 compatibility hotfix."""
from pathlib import Path
import re, sys, json
ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(rel):
    p = ROOT / rel
    if not p.exists():
        errors.append(f"Missing {rel}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(rel, needles):
    body = read(rel)
    for n in needles:
        if n not in body:
            errors.append(f"{rel}: missing {n!r}")

route_files = [
    'functions/api/admin/customer_admin_list.js',
    'functions/api/admin/customer_admin_detail.js',
    'functions/api/admin/customer_admin_save.js',
    'functions/api/admin/customer_admin_access_action.js',
    'functions/api/admin/customer_account_help_list.js',
    'functions/api/admin/customer_account_help_action.js',
]
for rel in route_files:
    require(rel, ['export async function onRequest(context)', "method === 'OPTIONS'", "Method not allowed."])

require('functions/api/admin/customer_admin_list.js', ["method === 'GET'", "method === 'POST'", "allowed_methods:['GET','POST','OPTIONS']"])
require('functions/api/admin/customer_account_help_list.js', ["method === 'GET'", "method === 'POST'", "allowed_methods:['GET','POST','OPTIONS']"])
require('admin-customers.html', ["res.status===405", "customer_admin_list|customer_account_help_list", "Re-deploy Pages Functions with the customer-admin routes included."])
require('admin-customers/index.html', ["res.status===405", "customer_admin_list|customer_account_help_list"])
require('service-worker.js', ["rosie-app-v20260703build221", "/data/build221_customer_admin_route_hotfix.json", "rosie-app-v20260703build220"])
require('data/build221_customer_admin_route_hotfix.json', ['"build": 221', 'HTTP 405', 'No customer passwords'])
require('AI_PROJECT_HANDOFF.md', ['Build 221 hotfix — customer-admin route 405 repair', 'No Supabase migration is required'])
require('MASTER_VALUE_ROADMAP.md', ['Build 221 hotfix — customer-admin route 405 repair'])

for rel in route_files + ['admin-customers.html']:
    body = read(rel)
    # Route handlers may pass rawToken internally to the mail helper, but token values must never be returned or placed on the page.
    forbidden_markers = ['password_input', 'customer_password', 'signed_url', 'upload_url', 'storage_bucket']
    if rel == 'admin-customers.html':
        forbidden_markers.append('rawToken')
    for forbidden in forbidden_markers:
        if forbidden in body:
            errors.append(f"{rel}: forbidden unsafe marker {forbidden!r}")

# Verify data JSON parses.
try:
    json.loads(read('data/build221_customer_admin_route_hotfix.json'))
except Exception as exc:
    errors.append(f"data/build221_customer_admin_route_hotfix.json is invalid JSON: {exc}")

if errors:
    print('Build 221 customer-admin route hotfix check failed:')
    for e in errors:
        print('-', e)
    sys.exit(1)
print('Build 221 customer-admin route hotfix checks passed.')
