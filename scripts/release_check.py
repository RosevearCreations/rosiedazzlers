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
for rel in [
    'data/app_modules.json','data/internal_navigation.json','data/route_module_ownership.json','data/action_permissions.json',
    'sql/2026-08-29_build267_role_module_hierarchy.sql','sql/2026-08-29_build270_push_subscription_authority.sql',
    'functions/api/_lib/staff-auth.js','functions/api/_lib/permissions-profile.js','functions/api/_lib/action-permissions.js',
    'functions/api/_lib/push-subscriptions.js','functions/api/push_config.js','functions/api/push_subscribe.js','functions/api/push_unsubscribe.js',
    'functions/api/customer_push_config.js','functions/api/customer_push_subscribe.js','functions/api/customer_push_unsubscribe.js'
]:
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

# Thin/event-driven service worker + Build 270 cache identity
sw=txt('service-worker.js')
for token in ["rosie-app-v20260829build270","addEventListener('push'","addEventListener('notificationclick'"]:
    if token not in sw: errors.append(f'service worker missing {token}')
precache=sw.split("self.addEventListener('install'",1)[0]
for heavy in ['/app/detailer/','/app/operations/','/app/admin/','/app/finance/','live-job-module.js']:
    if heavy in precache: errors.append(f'heavy module eagerly precached: {heavy}')

launcher=txt('app/index.html')
for token in ['Staff App Launcher','← Public Site','data-build="270"','v=20260829build270']:
    if token not in launcher: errors.append(f'Build270 launcher missing {token}')
customer_app=txt('app/customer/index.html')
for token in ['data-app-module="customer"','data-build="270"','v=20260829build270']:
    if token not in customer_app: errors.append(f'Build270 customer app missing {token}')
resolver=txt('assets/app-core/module-resolver.js')
for token in ['const BUILD=270',"rosie_module_runtime_flags_v270","rosie_last_staff_module_v270"]:
    if token not in resolver: errors.append(f'Build270 resolver missing {token}')
cache_health=txt('assets/cache-health-controls.js')
for token in ['EXPECTED_BUILD=270','v=20260829build270','Build 270 assets confirmed']:
    if token not in cache_health: errors.append(f'Build270 cache health missing {token}')

# Build 269 role/action compatibility retained
profile=txt('functions/api/_lib/permissions-profile.js')
for token in ['parsePermissionsProfile','profileForDatabase','typeof observedValue === "string"']:
    if token not in profile: errors.append(f'permissions profile helper missing {token}')
session=txt('functions/api/_lib/staff-session.js')
for token in ['parsePermissionsProfile(row.permissions_profile)','moduleAccessFromProfile(row.permissions_profile)']:
    if token not in session: errors.append(f'staff session profile normalization missing {token}')
staff_save=txt('functions/api/staff_save.js')
for token in ['profileForDatabase(permissions_profile, observedProfileValue)','module_access_version:269']:
    if token not in staff_save: errors.append(f'staff save compatibility missing {token}')
actions=js('data/action_permissions.json')
if actions.get('build')!=269: errors.append('action permission registry build mismatch')
for action in ['it.notifications.view','it.notifications.process','finance.reconcile','socials.publish','operations.assignment.manage']:
    if action not in actions.get('actions',{}): errors.append(f'action registry missing {action}')
for rel,action,legacy in [('functions/api/notifications_list.js','it.notifications.view','capability: "manage_progress"'),('functions/api/notifications_process.js','it.notifications.process','capability: "manage_staff"')]:
    body=txt(rel)
    if action not in body: errors.append(f'{rel} missing explicit action {action}')
    if legacy in body: errors.append(f'{rel} still uses broad legacy notification capability')
for rel,target in [('functions/api/admin/_lib/staff-auth.js','../../_lib/staff-auth.js'),('functions/api/admin/_lib/staff-session.js','../../_lib/staff-session.js'),('functions/api/admin/staff_save.js','../staff_save.js'),('functions/api/admin/notifications_list.js','../notifications_list.js'),('functions/api/admin/notifications_process.js','../notifications_process.js')]:
    if target not in txt(rel): errors.append(f'compatibility wrapper drift: {rel}')

# Build 270 push persistence/security authority
push_sql=txt('sql/2026-08-29_build270_push_subscription_authority.sql')
for token in ['notification_push_subscriptions','recipient_staff_user_id','enable row level security','revoke all on table public.notification_push_subscriptions from public, anon, authenticated','grant select, insert, update, delete on table public.notification_push_subscriptions to service_role','notification_push_subscriptions_exactly_one_owner_check']:
    if token not in push_sql: errors.append(f'Build270 push SQL missing {token}')
push_helper=txt('functions/api/_lib/push-subscriptions.js')
for token in ['saveStaffPushSubscription','saveCustomerPushSubscription','revokeStaffPushSubscription','revokeCustomerPushSubscription','notification_opt_in !== true','owner_type']:
    if token not in push_helper: errors.append(f'push subscription helper missing {token}')
for rel,auth_token in [
    ('functions/api/push_subscribe.js','requireStaffAccess'),
    ('functions/api/push_unsubscribe.js','requireStaffAccess'),
    ('functions/api/customer_push_subscribe.js','getCurrentCustomerSession'),
    ('functions/api/customer_push_unsubscribe.js','getCurrentCustomerSession')
]:
    if auth_token not in txt(rel): errors.append(f'{rel} missing authenticated owner boundary {auth_token}')
for rel in ['functions/api/push_config.js','functions/api/customer_push_config.js']:
    body=txt(rel)
    if 'VAPID_PUBLIC_KEY' not in body or 'VAPID_PRIVATE_KEY' not in body: errors.append(f'{rel} missing VAPID readiness inputs')
    if 'vapid_private_key' in body.lower(): errors.append(f'{rel} exposes a private-key response field')
client=txt('assets/app-core/install-client.js')
for token in ['pushRoutes()','customer_push_config','customer_push_subscribe','pushManager.subscribe','Notification.requestPermission','data-app-module']:
    if token not in client: errors.append(f'Build270 install client missing {token}')
enable_pos=client.find('async function enableNotifications')
subscribe_pos=client.find('pushManager.subscribe')
bind_pos=client.find('function bind')
if not (0 <= enable_pos < subscribe_pos < bind_pos): errors.append('push subscription is not confined to the click-driven enableNotifications path')
for forbidden in ['VAPID_PRIVATE_KEY','SUPABASE_SERVICE_ROLE_KEY']:
    for rel in ['assets/app-core/install-client.js','service-worker.js','app/index.html','app/customer/index.html']:
        if forbidden in txt(rel): errors.append(f'server secret name leaked into browser asset: {rel} -> {forbidden}')
for rel in ['functions/api/_lib/push-subscriptions.js','functions/api/push_config.js','functions/api/push_subscribe.js','functions/api/push_unsubscribe.js','functions/api/customer_push_config.js','functions/api/customer_push_subscribe.js','functions/api/customer_push_unsubscribe.js']:
    if 'setInterval(' in txt(rel): errors.append(f'push path contains prohibited polling: {rel}')

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
    print('Build 270 release check: FAIL')
    for e in errors: print(' -',e)
    raise SystemExit(1)
print('Build 270 release check: PASS')
print(' - canonical repository shape is clean')
print(' - module/role boundaries and no-idle-poll rules remain intact')
print(' - Build 267 schema tolerance and Build 269 action permissions remain canonical')
print(' - Build 270 server-only push storage, staff/customer ownership and opt-in-only subscription paths are protected')
print(' - VAPID private-key material is not exposed by browser assets/config responses')
print(' - Functions, route parity, service mirrors, customer-profile and SEO checks pass')
