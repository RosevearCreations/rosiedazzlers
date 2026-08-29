#!/usr/bin/env python3
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def txt(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing {rel}'); return ''
    return p.read_text(encoding='utf-8',errors='ignore')

def js(rel):
    try: return json.loads(txt(rel))
    except Exception as e: errors.append(f'invalid JSON {rel}: {e}'); return {}

def run(rel,*args):
    p=subprocess.run([sys.executable,str(ROOT/rel),*args],cwd=ROOT,text=True,capture_output=True)
    if p.returncode: errors.append(f'{rel} failed\n{p.stdout}{p.stderr}')
    elif p.stdout.strip(): print(p.stdout.strip())

# Repository hygiene
root_sql=[p.name for p in ROOT.glob('*.sql') if p.name!='SUPABASE_SCHEMA.sql']
if root_sql: errors.append(f'root SQL copies remain: {root_sql[:8]}')
for rel in ['docs/archive','reports/build261','functions/api/assets']:
    if (ROOT/rel).exists(): errors.append(f'retired tree remains: {rel}')
for rel in ['data/app_modules.json','data/internal_navigation.json','data/route_module_ownership.json','sql/2026-08-29_build267_role_module_hierarchy.sql','functions/api/_lib/staff-auth.js']:
    txt(rel)

# Module/role authority
mods=js('data/app_modules.json').get('modules',[])
keys={m.get('key') for m in mods}
expected={'customer','detailer','operations','admin','it','finance','daip','socials'}
if keys!=expected: errors.append(f'module registry mismatch: {sorted(keys)}')
nav=js('data/internal_navigation.json')
roles=nav.get('roles',{})
want={'detailer':['detailer'],'senior_detailer':['detailer','operations'],'operations_manager':['detailer','operations'],'accountant':['finance'],'it_specialist':['it'],'promoter':['socials'],'daip_manager':['daip'],'admin':['detailer','operations','admin','it','finance','daip','socials']}
for role,ceiling in want.items():
    if roles.get(role,{}).get('modules')!=ceiling: errors.append(f'{role} ceiling mismatch')
if roles.get('admin',{}).get('force_all') is not True: errors.append('admin force_all missing')

# Proven schema-tolerant Build 267 migration
sql=txt('sql/2026-08-29_build267_role_module_hierarchy.sql')
for token in ['rosie_build267_safe_jsonb','unsupported permissions_profile type','staff_users_role_code_check','staff_role_module_defaults','operations_manager','accountant','it_specialist','promoter','daip_manager']:
    if token not in sql: errors.append(f'Build267 SQL missing {token}')

# Runtime sleep rules
for rel in ['assets/app-core/module-resolver.js','apps/detailer/detailer-app.js','apps/detailer/live-job-module.js','apps/operations/operations-app.js']:
    if 'setInterval(' in txt(rel): errors.append(f'prohibited setInterval in {rel}')
if 'setInterval(' in txt('progress.html'): errors.append('customer progress has perpetual interval')

# Thin/event-driven service worker
sw=txt('service-worker.js')
for token in ["rosie-app-v20260829build268","addEventListener('push'","addEventListener('notificationclick'"]:
    if token not in sw: errors.append(f'service worker missing {token}')
precache=sw.split("self.addEventListener('install'",1)[0]
for heavy in ['/app/detailer/','/app/operations/','/app/admin/','/app/finance/','live-job-module.js']:
    if heavy in precache: errors.append(f'heavy module eagerly precached: {heavy}')

# Public content mirror + service depth
p=txt('data/rosie_services_pricing_and_packages.json'); pf=txt('functions/api/data/rosie_services_pricing_and_packages.json')
l=txt('data/landing_pages_content.json'); lf=txt('functions/api/data/landing_pages_content.json')
if p!=pf: errors.append('pricing mirror drift')
if l!=lf: errors.append('landing-page mirror drift')
try:
    addons=json.loads(p).get('addons',[])
    if len(addons)!=24: errors.append(f'expected 24 add-ons, got {len(addons)}')
except Exception as e: errors.append(f'pricing JSON invalid: {e}')

# Current broad static checks
for script,args in [('scripts/cloudflare_pages_functions_check.py',()),('scripts/customer_profile_quality_check.py',()),('scripts/sync_route_copies.py',('--check',)),('scripts/seo_h1_check.py',())]:
    if (ROOT/script).exists(): run(script,*args)
    else: errors.append(f'missing {script}')

if errors:
    print('Build 268 release check: FAIL')
    for e in errors: print(' -',e)
    raise SystemExit(1)
print('Build 268 release check: PASS')
print(' - canonical repository shape is clean')
print(' - module/role boundaries and no-idle-poll rules remain intact')
print(' - schema-tolerant Build 267 migration is canonical')
print(' - current Functions, route parity, service mirrors and SEO checks pass')