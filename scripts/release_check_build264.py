#!/usr/bin/env python3
from pathlib import Path
import json, sys
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

required=[
 'app/index.html','app/customer/index.html','app/detailer/index.html','app/operations/index.html','app/admin/index.html',
 'assets/app-core/module-resolver.js','assets/app-core/runtime-policy.js','assets/app-core/api-client.js','assets/app-core/module-loader.js','assets/app-core/refresh-leader.js',
 'apps/detailer/detailer-app.js','apps/detailer/live-job-module.js','data/build264_app_modules.json','docs/modular-app/03_BUILD264_DETAILER_RUNTIME.md','BUILD264_SUMMARY.md'
]
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'missing Build 264 file: {rel}')

registry={}
try: registry=json.loads(text('data/build264_app_modules.json'))
except Exception as exc: errors.append(f'build264 registry parse failed: {exc}')
if registry:
    if registry.get('build')!=264 or registry.get('runtime_enabled') is not True: errors.append('Build 264 registry identity/runtime flag is wrong')
    modules={m.get('key'):m for m in registry.get('modules',[])}
    if set(modules)!={'customer','detailer','operations','admin'}: errors.append(f'Build 264 modules wrong: {sorted(modules)}')
    if modules.get('detailer',{}).get('runtime_status')!='active_modular_runtime': errors.append('Detailer must be active modular runtime')
    if modules.get('operations',{}).get('runtime_status')!='protected_compatibility_bridge': errors.append('Operations should remain a protected bridge in Build 264')

core_files=['assets/app-core/module-resolver.js','assets/app-core/runtime-policy.js','assets/app-core/api-client.js','assets/app-core/module-loader.js','assets/app-core/refresh-leader.js','apps/detailer/detailer-app.js','apps/detailer/live-job-module.js']
for rel in core_files:
    s=text(rel)
    if 'setInterval(' in s: errors.append(f'{rel} introduces prohibited recurring interval')

need('assets/app-core/module-resolver.js','const BUILD=264','Detailer Mobile App','Operations / Supervisor App','Business Administration App')
need('assets/app-core/runtime-policy.js',"OPEN_STAGES=new Set(['arrived','detailing','paused'])",'automatic_refresh:false','timed_sync:false','may_load_live_module')
need('assets/app-core/api-client.js','ambiguousMutation','No' if False else 'requestJson')
need('assets/app-core/module-loader.js','import(url)','loaded=new Map()')
detailer=need('apps/detailer/detailer-app.js','/api/detailer/jobs?scope=workspace','No automatic retry','/apps/detailer/live-job-module.js?v=20260825build264','out.booking','no follow-up polling was started')
if 'setInterval(' in detailer: errors.append('Detailer app must not poll')
live=need('apps/detailer/live-job-module.js','No setInterval, no background polling','/api/detailer/live_feed','/api/detailer/media_upload_url','directPut','Retry manually')
if 'setInterval(' in live: errors.append('Detailer live module must not poll')
html=need('app/detailer/index.html','Detailer Mobile App','liveJobHost','apps/detailer/detailer-app.js','Build 264 modular runtime')
if 'live-job-module.js' in html: errors.append('Detailer HTML must not eagerly load the heavy live-job bundle')

jobs=need('functions/api/detailer/jobs.js','scope === "workspace"','service_date=gte.${workspaceStartDate()}&limit=80','extra_feed_queries_deferred_until_job_open: true','if (workspace)')
for rel,target in [
 ('functions/api/detailer/live_feed.js','../admin/progress_list.js'),
 ('functions/api/detailer/progress_enable.js','../admin/progress_enable.js'),
 ('functions/api/detailer/media_upload_url.js','../admin/progress_upload_url.js'),
 ('functions/api/detailer/media_upload_session.js','../admin/progress_upload_session.js'),
 ('functions/api/detailer/media_post.js','../admin/progress_media_post.js')]:
    need(rel,target)

auth=need('assets/admin-auth.js','case "app-launcher"','case "app-detailer"','case "app-operations"','case "app-admin"','case "detailer-jobs"')
mirror=text('functions/api/assets/admin-auth.js')
if auth!=mirror: errors.append('Admin auth public/Functions mirrors differ')

sw=need('service-worker.js',"const CACHE='rosie-app-v20260825build264'",'/app/detailer/','/assets/app-core/module-resolver.js','/apps/detailer/detailer-app.js')
url_block=sw.split('const URLS=',1)[1].split("self.addEventListener('install'",1)[0] if 'const URLS=' in sw else ''
if 'live-job-module.js' in url_block: errors.append('Heavy live-job module must not be service-worker precached')
need('assets/cache-health-controls.js','const EXPECTED_BUILD = 264','/assets/app-core/module-resolver.js?v=20260825build264','Build 264 assets confirmed')
need('_routes.json','"include": ["/api/*"]')
need('manifest.webmanifest','/app/detailer/','Rosie Apps')
need('AI_PROJECT_HANDOFF.md','Build 264 Detailer Modular Runtime','No eligible open Detailer job')
need('MASTER_VALUE_ROADMAP.md','Build 264 Modular Runtime Roadmap','Build 265 Operations runtime')
need('DOC_INDEX.md','Build 264 modular runtime documentation','03_BUILD264_DETAILER_RUNTIME.md')
need('STARTUP_GO_LIVE_BLOCKERS.md','Build 264 modular Detailer runtime acceptance','no recurring Detailer API traffic')

# The four canonical entry pages remain non-indexed and have one H1 each.
for rel in ['app/index.html','app/customer/index.html','app/detailer/index.html','app/operations/index.html','app/admin/index.html']:
    s=text(rel).lower()
    if 'noindex' not in s: errors.append(f'{rel} must remain noindex')
    if s.count('<h1')!=1: errors.append(f'{rel} must have exactly one H1')

if errors:
    print('Build 264 modular Detailer runtime check: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Build 264 modular Detailer runtime check: PASS')
print(' - four canonical app entry shells exist')
print(' - Detailer base runtime is bounded and interval-free')
print(' - live-job code is lazy and not service-worker precached')
print(' - mutations do not auto-retry or force workspace polling')
print(' - Detailer API namespace facades preserve shared server authorization')
print(' - living docs and cache identity are synchronized')
