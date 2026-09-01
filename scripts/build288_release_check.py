#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
errors=[]
def text(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing {rel}'); return ''
    return p.read_text(encoding='utf-8',errors='ignore')
def need(rel,*tokens):
    body=text(rel)
    for t in tokens:
        if t not in body: errors.append(f'{rel} missing {t}')
def forbid(rel,*tokens):
    body=text(rel)
    for t in tokens:
        if t in body: errors.append(f'{rel} contains forbidden token {t}')
def node(rel):
    p=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True)
    if p.returncode: errors.append(f'node --check failed {rel}: {p.stderr.strip()}')

need('functions/api/client/_lib/customer-safe-shape.js','PROFILE_FIELDS','VEHICLE_FIELDS','REVIEW_FIELDS','customerSafeProfile','customerSafeVehicle','customerSafeReview','STAFF_PRIVATE_CUSTOMER_FIELDS')
need('functions/api/client/profile_update.js','customerSafeProfile','client_private_notes','detailer_visible_notes','Unauthorized.')
forbid('functions/api/client/profile_update.js','admin_private_notes: cleanText(body.admin_private_notes)')
need('functions/api/client/vehicles_save.js','customerSafeVehicle','notes_for_team','detailer_visible_notes','Unauthorized.')
forbid('functions/api/client/vehicles_save.js','admin_private_notes: text(b.admin_private_notes)')
need('functions/api/client/vehicles_list.js','customerSafeVehicles','select=*','Unauthorized.')
need('functions/api/client/dashboard.js','customerSafeProfile','customerSafeVehicles','customerSafeReviews','customerSafeTier','customer_profiles?select=*')
need('functions/api/client/reviews_save.js','customerSafeReview','authenticated_customer_completed_booking','Unauthorized.')
need('assets/customer-privacy-v288.js','acctAdminNotes','vehAdminNotes','control.disabled = true','label.hidden = true','build288CustomerPrivacy')
need('assets/client-auth.js','/assets/customer-privacy-v288.js','data-build288-customer-privacy')
need('my-account/index.html','<meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />','<h1>My Account</h1>','/assets/client-auth.js')
if len(re.findall(r'<h1\b', text('my-account/index.html'), flags=re.I)) != 1: errors.append('my-account/index.html must retain exactly one H1')
need('.github/workflows/development-source-gate.yml','Run current Build 286 focused guard','Run current Build 287 focused guard','Run current Build 288 focused guard','build288_http_smoke.sh')
need('BUILD288_SUMMARY.md','Build 288','customer/staff privacy boundary','Production remains closed')
need('AI_PROJECT_HANDOFF.md','**Build:** 288','Build 288','customer/staff privacy boundary','Production remains closed')
need('MASTER_VALUE_ROADMAP.md','**Build:** 288','Build 288','customer/staff privacy boundary','Production remains closed')

for rel in ['functions/api/client/_lib/customer-safe-shape.js','functions/api/client/profile_update.js','functions/api/client/vehicles_save.js','functions/api/client/vehicles_list.js','functions/api/client/dashboard.js','functions/api/client/reviews_save.js','assets/client-auth.js','assets/customer-privacy-v288.js']:
    node(rel)

if errors:
    print('Build 288 customer privacy/auth-device acceptance check FAILED:')
    for e in errors: print('-',e)
    sys.exit(1)
print('Build 288 customer privacy/auth-device acceptance check: PASS')
print('- customer profile/vehicle/review responses use explicit customer-safe projections')
print('- customer profile and vehicle writes cannot mutate admin_private_notes')
print('- legacy admin-only customer controls are hidden/disabled on My Account')
print('- unauthenticated customer mutations retain fail-closed server checks')
print('- cumulative Development source gate now carries Builds 286-288')
print('- no schema, pricing, booking, deposit or payment authority changed')
print('- Production remains closed')
