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
 'data/build266_app_modules.json','data/build266_route_module_ownership.json','docs/modular-app/05_BUILD266_EXPANDED_MODULE_RUNTIME.md','BUILD266_SUMMARY.md',
 'app/it/index.html','app/finance/index.html','app/daip/index.html','app/socials/index.html','assets/app-core/module-shell.css','assets/app-core/install-client.js','apps/shared/lazy-shell.js','apps/it/it-app.js','functions/api/admin/module_flags.js',
 'assets/app-icons/rosie-192.png','assets/app-icons/rosie-512.png','assets/app-icons/rosie-maskable-512.png'
]
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'missing Build 266 file: {rel}')

registry=loadj('data/build266_app_modules.json')
if registry.get('build')!=266: errors.append('Build266 module registry identity wrong')
mods={m.get('key'):m for m in registry.get('modules',[])}
expected={'customer','detailer','operations','admin','it','finance','daip','socials'}
if set(mods)!=expected: errors.append(f'Build266 modules wrong: {sorted(mods)}')
if mods.get('it',{}).get('toggle_locked_on') is not True: errors.append('I.T. must remain locked on as recovery/control plane')
if registry.get('role_defaults',{}).get('detailer')!={'detailer':True}: errors.append('Detailer role default must be Detailer-only')
if set(k for k,v in registry.get('role_defaults',{}).get('senior_detailer',{}).items() if v)!= {'detailer','operations'}: errors.append('Senior Detailer role default must be Detailer + Operations only')

ownership=loadj('data/build266_route_module_ownership.json')
if ownership.get('build')!=266: errors.append('Build266 ownership registry identity wrong')
for key in expected:
    if key not in ownership.get('modules',{}): errors.append(f'route ownership missing {key}')

resolver=need('assets/app-core/module-resolver.js','const BUILD=266','ROLE_CEILINGS','detailer:[\'detailer\']',"senior_detailer:['detailer','operations']",'module_runtime_flags','CACHE_MS=15*60*1000','loadRuntimeFlags','profileAllows','next.it=true')
if 'setInterval(' in resolver: errors.append('module resolver must not poll')
adminauth=need('assets/admin-auth.js','MODULE_ROLE_CEILINGS','detailer: ["detailer"]','senior_detailer: ["detailer", "operations"]','permissions_profile','module_access','ensureModuleRuntimeFlags','MODULE_FLAGS_CACHE_MS = 15 * 60 * 1000','case "app-finance"','case "app-it"','case "app-daip"','case "app-socials"')
if adminauth!=text('functions/api/assets/admin-auth.js'): errors.append('admin-auth public/Functions mirrors differ')

need('functions/api/_lib/staff-session.js','permissions_profile','module_access')
need('functions/api/_lib/staff-auth.js','permissions_profile','module_access')
need('functions/api/admin/auth_me.js','module_access')
need('functions/api/admin/auth_login.js','permissions_profile','module_access')
need('functions/api/admin/staff_list.js','permissions_profile')
staffsave=need('functions/api/admin/staff_save.js','ROLE_CEILINGS','permissions_profile','module_access','normalizeModuleAccess')
need('admin-staff.html','Application module access','data-module-access="detailer"','data-module-access="operations"','data-module-access="finance"','data-module-access="it"','collectModuleAccess')

flags=need('functions/api/admin/module_flags.js','module_runtime_flags','capability:"manage_staff"','flags.it=true','app_management_settings','DEFAULT_FLAGS')
if 'setInterval(' in flags: errors.append('module flag endpoint text unexpectedly contains interval')

# Shells: one H1, noindex, and no subsystem API reads in lazy shell HTML/JS.
for key in ['it','finance','daip','socials','admin']:
    rel=f'app/{key}/index.html'; s=text(rel); low=s.lower()
    if low.count('<h1')!=1: errors.append(f'{rel} must have exactly one H1')
    if 'noindex' not in low: errors.append(f'{rel} must remain noindex')
    if key!='it' and '/api/' in s: errors.append(f'{rel} should not directly read subsystem APIs')
for rel in ['apps/shared/lazy-shell.js','apps/launcher/app-launcher.js','apps/it/it-app.js','apps/detailer/detailer-app.js','apps/detailer/live-job-module.js','apps/operations/operations-app.js']:
    if 'setInterval(' in text(rel): errors.append(f'{rel} contains prohibited setInterval')

# Detailer: global flag read before access + open-job live only remains.
need('apps/detailer/detailer-app.js','await resolver.loadRuntimeFlags()','/api/detailer/jobs?scope=workspace','may_load_live_module','/apps/detailer/live-job-module.js?v=20260829build266')
need('apps/detailer/live-job-module.js','Two-way job messages','CUSTOMER MESSAGE','performs no automatic refresh')
# Operations stays explicit/manual and now checks global flag.
need('apps/operations/operations-app.js','await resolver.loadRuntimeFlags()','Choose a workstream' if False else 'setMode(null)')

# Customer progress: no perpetual interval; active-job-only one-shot 2-minute timer.
progress=need('progress.html','ACTIVE_PROGRESS_STAGES','scheduleProgressRefresh','window.setTimeout(() => loadProgress({ quiet:true }), 120000','No active job = no customer live-progress messaging refresh timer')
if 'setInterval(' in progress: errors.append('Customer Progress must not contain perpetual setInterval in Build266')
if progress!=text('progress/index.html'): errors.append('Progress clean-route copy drift')
need('functions/api/progress/view.js','automatic_refresh_active_job_only: true','? 120 : 0')

# Installable app / notification event foundation.
manifest=loadj('manifest.webmanifest')
icons=manifest.get('icons',[])
if len(icons)<3: errors.append('manifest requires 192/512/maskable app icons')
if not any('maskable' in str(i.get('purpose','')) for i in icons): errors.append('manifest missing maskable icon')
shortcuts={x.get('url') for x in manifest.get('shortcuts',[])}
for url in ['/app/customer/','/app/','/app/detailer/','/app/operations/']:
    if url not in shortcuts: errors.append(f'manifest shortcut missing {url}')
install=need('assets/app-core/install-client.js','beforeinstallprompt','Notification.requestPermission','showNotification','No' if False else 'serviceWorker.register')
if 'setInterval(' in install: errors.append('install/notification client must not poll')
sw=need('service-worker.js',"const CACHE='rosie-app-v20260829build266'","self.addEventListener('push'","self.addEventListener('notificationclick'",'/api/')
precache=sw.split('const URLS=',1)[1].split("self.addEventListener('install'",1)[0] if 'const URLS=' in sw else ''
for optional in ['/app/detailer/','/app/operations/','/app/admin/','/app/it/','/app/finance/','/app/daip/','/app/socials/','live-job-module.js','today-module.js']:
    if optional in precache: errors.append(f'optional module unexpectedly eager-precached: {optional}')

need('assets/cache-health-controls.js','const EXPECTED_BUILD = 266','20260829build266','Build 266 assets confirmed')
need('AI_PROJECT_HANDOFF.md','**Build:** 266','eight independently authorized and independently sleeping runtime modules','Detailer only','module_runtime_flags','true Windows/macOS system-tray')
need('MASTER_VALUE_ROADMAP.md','**Build:** 266','Completed in Build 266','server-side module entitlement','Capacitor','Tauri')
need('STARTUP_GO_LIVE_BLOCKERS.md','Build 266 current acceptance','rosie-app-v20260829build266','Completed/inactive job')
need('DOC_INDEX.md','Documentation Index — Build 266','05_BUILD266_EXPANDED_MODULE_RUNTIME.md')

# Build265 data mirror convergence must remain intact.
if text('data/landing_pages_content.json')!=text('functions/api/data/landing_pages_content.json'): errors.append('landing content public/function mirrors differ')
if text('data/rosie_services_pricing_and_packages.json')!=text('functions/api/data/rosie_services_pricing_and_packages.json'): errors.append('pricing public/function mirrors differ')

if errors:
    print('Build 266 expanded modular runtime check: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Build 266 expanded modular runtime check: PASS')
print(' - eight module registry + ownership map present')
print(' - Detailer/Senior/Admin role ceilings and per-staff module grants wired')
print(' - global module switches are one-row, cached and timer-free')
print(' - new I.T./Finance/DAIP/Socials/Admin shells are lazy')
print(' - Detailer + customer messaging sleeps when no active job')
print(' - installable PWA/local notification/push-event foundation is present')
print(' - Build 265 pricing/content convergence remains synchronized')
