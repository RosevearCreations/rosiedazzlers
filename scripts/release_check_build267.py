#!/usr/bin/env python3
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def text(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing {rel}'); return ''
    return p.read_text(encoding='utf-8')
def need(rel,*tokens):
    s=text(rel)
    for token in tokens:
        if token not in s: errors.append(f'{rel} missing {token!r}')
    return s
def loadj(rel):
    try:return json.loads(text(rel))
    except Exception as exc: errors.append(f'{rel} JSON parse failed: {exc}'); return {}

required=[
 'data/build267_app_modules.json','data/build267_internal_navigation.json','data/build267_route_module_ownership.json',
 'docs/modular-app/06_BUILD267_ROLE_MODULE_NAVIGATION.md','BUILD267_SUMMARY.md',
 'sql/2026-08-29_build267_role_module_hierarchy.sql','2026-08-29_build267_role_module_hierarchy.sql',
 'assets/app-core/module-navigation.js','assets/admin-menu.js','assets/admin-shell.js'
]
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'missing Build267 file: {rel}')

expected_internal=['detailer','operations','admin','it','finance','daip','socials']
expected_roles={
 'detailer':['detailer'],
 'senior_detailer':['detailer','operations'],
 'operations_manager':['detailer','operations'],
 'accountant':['finance'],
 'it_specialist':['it'],
 'promoter':['socials'],
 'daip_manager':['daip'],
 'admin':expected_internal,
}

registry=loadj('data/build267_app_modules.json')
if registry.get('build')!=267: errors.append('Build267 module registry identity wrong')
mods={m.get('key'):m for m in registry.get('modules',[])}
if set(mods)!={'customer',*expected_internal}: errors.append(f'Build267 module keys wrong: {sorted(mods)}')
if registry.get('admin_all_modules_required') is not True: errors.append('admin_all_modules_required must be true')
for role,modules in expected_roles.items():
    got=[k for k,v in registry.get('role_defaults',{}).get(role,{}).items() if v]
    if got!=modules: errors.append(f'{role} registry modules wrong: {got}')
if mods.get('it',{}).get('toggle_locked_on') is not True: errors.append('I.T. recovery/control plane must stay locked on')

nav=loadj('data/build267_internal_navigation.json')
if nav.get('build')!=267: errors.append('Build267 navigation identity wrong')
for role,modules in expected_roles.items():
    info=nav.get('roles',{}).get(role,{})
    if info.get('modules')!=modules: errors.append(f'navigation role modules wrong for {role}: {info.get("modules")}')
if nav.get('roles',{}).get('admin',{}).get('force_all') is not True: errors.append('navigation admin role must force_all')
for key in expected_internal:
    if key not in nav.get('modules',{}): errors.append(f'navigation missing module {key}')
card_count=sum(len(cat.get('cards',[])) for mod in nav.get('modules',{}).values() for cat in mod.get('categories',[]))
if card_count < 60: errors.append(f'expected broad private card hierarchy, found only {card_count} cards')
# every card must have primary route ownership and real href target where local HTML is named
for key,mod in nav.get('modules',{}).items():
    for cat in mod.get('categories',[]):
        for card in cat.get('cards',[]):
            pk=card.get('page_key'); ri=nav.get('route_index',{}).get(pk)
            if not ri: errors.append(f'card {pk} missing route_index')
            elif ri.get('primary_module')!=key: errors.append(f'card {pk} primary module mismatch')
# Root private pages intentionally not represented as cards: account/login + Operations compatibility aliases.
card_hrefs={card.get('href','').split('?',1)[0].lstrip('/') for mod in nav.get('modules',{}).values() for cat in mod.get('categories',[]) for card in cat.get('cards',[])}
root_admin={p.name for p in ROOT.glob('admin*.html')}
special={'admin-account.html','admin-login.html','admin-today.html','admin-blocks.html','admin-assign.html'}
unmapped=sorted(root_admin-card_hrefs-special)
if unmapped: errors.append(f'private root pages missing module card/special classification: {unmapped}')

# SQL: existing admins must converge before constraint expansion.
sql=need('sql/2026-08-29_build267_role_module_hierarchy.sql',
 'where lower(coalesce(role_code, \'\')) = \'admin\'','Build 267 refused to continue','staff_users_role_code_check',
 "'operations_manager'","'accountant'","'it_specialist'","'promoter'","'daip_manager'",
 "'staff_role_module_defaults'", "'admin_all_modules_required', true")
if sql != text('2026-08-29_build267_role_module_hierarchy.sql'): errors.append('Build267 root/sql migration mirrors differ')
pos_admin=sql.find("where lower(coalesce(role_code, '')) = 'admin'")
pos_assert=sql.find('Build 267 refused to continue')
pos_constraint=sql.find('add constraint staff_users_role_code_check')
if not (0 <= pos_admin < pos_assert < pos_constraint): errors.append('Build267 SQL does not prove admin-first -> assertion -> role-constraint ordering')
for key in expected_internal:
    if f'"{key}":true' not in sql: errors.append(f'admin SQL all-module object missing {key}')

resolver=need('assets/app-core/module-resolver.js','const BUILD=267','operations_manager:[\'detailer\',\'operations\']',"accountant:['finance']","it_specialist:['it']","promoter:['socials']","daip_manager:['daip']","if(role(actor)==='admin') return true","rosie_module_runtime_flags_v267")
if 'setInterval(' in resolver: errors.append('Build267 module resolver must remain timer-free')
adminauth=need('assets/admin-auth.js','operations_manager: ["detailer", "operations"]','accountant: ["finance"]','it_specialist: ["it"]','promoter: ["socials"]','daip_manager: ["daip"]','if (role === "admin") return true','case "admin-sanity"','case "admin-booking"','pageModules')
if adminauth != text('functions/api/assets/admin-auth.js'): errors.append('admin-auth public/Functions mirrors differ')

staffsave=need('functions/api/admin/staff_save.js','operations_manager:["detailer","operations"]','accountant:["finance"]','it_specialist:["it"]','promoter:["socials"]','daip_manager:["daip"]','if(roleCode==="admin")')
need('admin-staff.html','Operations Manager','Accountant / Finance','I.T. Specialist','Promoter / Marketing','DAIP Manager','Admin accounts are always granted every internal module')

staffauth=need('functions/api/admin/_lib/staff-auth.js','BUILD267_ROLE_MODULE_CEILINGS','inferRequestModule','actorHasModuleAccess','staff_availability_','local_seo_','public_inquiry_leads_','catalog_usage_','app_settings_')
if staffauth != text('functions/api/_lib/staff-auth.js'): errors.append('staff-auth shared mirrors differ')
# Dedicated roles must not be implemented by setting dangerous broad capability booleans in source.
for dangerous in ['accountant','it_specialist','promoter','daip_manager']:
    # role should occur in ceilings only; staff save normalization should not force can_manage_staff etc.
    if f'roleCode==="{dangerous}"' in staffsave and 'can_manage_staff: true' in staffsave: errors.append(f'{dangerous} appears to receive broad manage_staff')

menu=need('assets/admin-menu.js','hierarchical internal navigation','Only workflows in this module are shown here.','All apps','Module home','module-navigation.js?v=20260829build267')
if 'fetch(' in menu: errors.append('module menu should not fetch business/API data')
shell=need('assets/admin-shell.js','ensureModuleHierarchy','header .nav-links','globalScope.AdminMenu.render','/app/finance/','/app/it/','/app/socials/')
if shell != text('functions/api/assets/admin-shell.js'): errors.append('admin-shell mirrors differ')
need('admin-creative-projects.html','data-page="admin-creative-projects"','/assets/admin-shell.js?v=20260829build267',"pageKey:'admin-creative-projects'")
if text('admin-creative-projects.html') != text('admin-creative-projects/index.html'): errors.append('Creative Projects clean-route copy drift')
if text('admin-booking.html') != text('admin-booking/index.html'): errors.append('Booking clean-route copy drift')
if 'data-page="admin-booking"' not in text('admin-booking.html'): errors.append('Booking page key not normalized')
if text('admin-sanity.html') != text('admin-sanity/index.html'): errors.append('Sanity clean-route copy drift')
if "pageKey:'admin-sanity'" not in text('admin-sanity.html'): errors.append('Sanity page not owned/authenticated by I.T.')

for key in expected_internal:
    rel=f'app/{key}/index.html'
    s=need(rel,'data-module-home-cards','module-navigation.js')
    if s.lower().count('<h1') != 1: errors.append(f'{rel} must have exactly one H1')

need('service-worker.js',"const CACHE='rosie-app-v20260829build267'",'/assets/app-core/module-navigation.js')
sw=text('service-worker.js')
precache=sw.split('const URLS=',1)[1].split("self.addEventListener('install'",1)[0] if 'const URLS=' in sw else ''
for heavy in ['live-job-module.js','today-module.js','schedule-module.js','blocks-module.js','assignments-module.js','live-module.js']:
    if heavy in precache: errors.append(f'heavy lazy module precached in Build267: {heavy}')
need('assets/cache-health-controls.js','const EXPECTED_BUILD = 267','20260829build267','Build 267 assets confirmed')
need('AI_PROJECT_HANDOFF.md','**Build:** 267','role-aware module homes','Administrators cannot be narrowed','admin-first fail-closed database convergence')
need('MASTER_VALUE_ROADMAP.md','**Build:** 267','Completed in Build 267','Build 268 should then implement event-driven push')
need('STARTUP_GO_LIVE_BLOCKERS.md','Build 267 current acceptance','rosie-app-v20260829build267','Administrator → all seven internal modules')
need('DOC_INDEX.md','Documentation Index — Build 267','06_BUILD267_ROLE_MODULE_NAVIGATION.md','BUILD267_SUMMARY.md')

# Build265 data mirror convergence still mandatory.
if text('data/landing_pages_content.json')!=text('functions/api/data/landing_pages_content.json'): errors.append('landing content mirrors differ')
if text('data/rosie_services_pricing_and_packages.json')!=text('functions/api/data/rosie_services_pricing_and_packages.json'): errors.append('pricing content mirrors differ')

if errors:
    print('Build 267 role/module navigation check: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Build 267 role/module navigation check: PASS')
print(f' - {card_count} categorized private workflow cards across seven internal modules')
print(' - focused role ceilings + forced all-module Administrator policy are synchronized')
print(' - migration grants/asserts current admins before role constraint expansion')
print(' - protected-page menu hierarchy is module-local and static/no-API')
print(' - server compatibility entitlement is route-scoped, not broad capability escalation')
print(' - Build264/265/266 lazy/runtime/service convergence remains preserved')
