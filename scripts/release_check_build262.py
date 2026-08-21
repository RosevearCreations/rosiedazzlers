from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def text(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing {rel}'); return ''
    return p.read_text(encoding='utf-8',errors='ignore')
def need(rel,*tokens):
    s=text(rel)
    for token in tokens:
        if token not in s: errors.append(f'{rel} missing {token}')
    return s
def same(a,b,label):
    if text(a)!=text(b): errors.append(f'{label} drifted: {a} != {b}')

# P0 invocation-volume controls
analytics_page=need('admin-analytics.html','Build 262 CPU stabilization','Background 30-second polling is disabled','Refresh rollups')
if 'setInterval(' in analytics_page: errors.append('admin-analytics reintroduced automatic setInterval polling')
same('admin-analytics.html','admin-analytics/index.html','Admin Analytics clean route')
live=need('admin-live.html','Start auto refresh','Build 262','seconds * 1000')
if '/api/admin/bookings' in live: errors.append('admin-live again fetches the full bookings list during live refresh')
# Optional live polling must never go below one minute.
for m in re.finditer(r'<option value="(\d+)"',live):
    if int(m.group(1)) < 60: errors.append(f'admin-live refresh option below 60s: {m.group(1)}')
same('admin-live.html','admin-live/index.html','Admin Live clean route')
progress=need('progress.html','120000','Build 262 CPU stabilization')
if '}, 20000)' in progress or '},20000)' in progress: errors.append('Progress page reintroduced 20-second polling')
same('progress.html','progress/index.html','Progress clean route')

# Public analytics must batch and fail open without heartbeat/retry storms.
pa=need('assets/public-analytics.js','MAX_BATCH = 12','FLUSH_DELAY_MS = 20000','events: batch','analytics heartbeat interval','do not retry the same batch')
if 'setInterval(' in pa: errors.append('public analytics reintroduced interval/heartbeat polling')
if 'Math.random()' in pa: errors.append('public analytics uses Math.random fallback again')
same('assets/public-analytics.js','functions/api/assets/public-analytics.js','Public analytics mirror')

ingest=need('functions/api/analytics/ingest.js','MAX_EVENTS_PER_REQUEST = 12','MAX_BODY_BYTES','analytics_storage_unavailable','site_activity_events','app_management_settings?select=key,value&key=in.')
if 'for (const item of events)' not in ingest: errors.append('analytics ingest lost bounded batch normalization')

# Heavy analytics aggregation must be outside Worker JS.
rollup=need('functions/api/admin/analytics_rollups_refresh.js','refresh_site_activity_rollups_cpu_safe','one RPC call','migration_required')
if 'site_activity_events?select=' in rollup: errors.append('rollup refresh again fetches raw analytics events into the Worker')
sql=need('2026-08-20_build262_cpu_safe_analytics_rollups.sql','create or replace function public.refresh_site_activity_rollups_cpu_safe','execution_location',"~ '^\\d+$'")
same('2026-08-20_build262_cpu_safe_analytics_rollups.sql','sql/2026-08-20_build262_cpu_safe_analytics_rollups.sql','Build262 SQL copy')

overview=need('functions/api/admin/analytics_overview.js','cpu_safe_mode: true','include_recent === true','limit=4000','limit=2000')
for forbidden in ['limit=50000','limit=25000','limit=10000']:
    if forbidden in overview: errors.append(f'analytics_overview reintroduced hot-path {forbidden}')

# Shared settings/auth responses must avoid repeated hot-path work / pretty JSON.
settings=need('functions/api/_lib/app-settings.js','key=in.','requested.length','Build 262 CPU stabilization')
if 'for (const key of requested)' in settings and 'fetch(' in settings.split('for (const key of requested)',1)[1][:800]:
    errors.append('app settings loader appears to fetch once per setting again')
for rel in ['functions/api/_lib/staff-auth.js','functions/api/admin/_lib/staff-auth.js','functions/api/_lib/http.js','functions/api/admin/_lib/http.js']:
    s=need(rel,'JSON.stringify(data)')
    if 'JSON.stringify(data, null, 2)' in s: errors.append(f'{rel} pretty-prints API JSON')

# Photo writes must not automatically replay 5xx during CPU incident.
studio=need('admin-photo-studio.html','did not auto-retry','Runtime & CPU Diagnostics','Reset this location to default')
if 'TRANSIENT_RETRY_PATHS=new Set' in studio: errors.append('Photo Studio automatic 5xx retry set is active again')
same('admin-photo-studio.html','admin-photo-studio/index.html','Photo Studio clean route')

# Self-diagnostics must be browser-local and contain no request bodies/query strings.
auth=need('assets/admin-auth.js','rosie_api_runtime_diagnostics_v262','url.pathname.startsWith("/api/")','route: url.pathname','ray_id','DIAGNOSTIC_LIMIT = 300','admin-runtime-health')
if 'url.search' in auth[auth.find('installApiDiagnosticsFetchWrapper'):auth.find('async function requestJson')]: errors.append('API diagnostics recorder stores query strings')
same('assets/admin-auth.js','functions/api/assets/admin-auth.js','Admin auth diagnostics mirror')
need('admin-runtime-health.html','Runtime &amp; CPU Diagnostics','Cloudflare incident baseline','7,592','2,244','Export full JSON')
same('admin-runtime-health.html','admin-runtime-health/index.html','Runtime diagnostics clean route')
need('assets/runtime-health.js','No diagnostic API calls are made','build262_cpu_source_audit.json','RosieApiDiagnostics')
same('assets/runtime-health.js','functions/api/assets/runtime-health.js','Runtime diagnostics asset mirror')
need('assets/admin-menu.js','Runtime & CPU Diagnostics','admin-runtime-health')
same('assets/admin-menu.js','functions/api/assets/admin-menu.js','Admin menu mirror')

# Current cache/UI identity and static routing.
need('assets/startup-command-center.js','const BUILD=262',"rosie_startup_build262_")
need('assets/cache-health-controls.js','EXPECTED_BUILD = 262','20260820build262','Build 262 assets confirmed')
need('assets/ui-health-scanner.js','const BUILD=262','build262_ui_health_routes.json')
need('service-worker.js','rosie-app-v20260820build262','build262_ui_health_routes.json','admin-runtime-health.html')
routes=need('_routes.json','"/api/*"')
try:
    rd=json.loads(routes)
    if rd.get('include')!=['/api/*']: errors.append('_routes.json must invoke Functions only for /api/*')
except Exception as exc: errors.append(f'_routes.json invalid: {exc}')
if (ROOT/'wrangler.toml').exists() or (ROOT/'wrangler.json').exists() or (ROOT/'wrangler.jsonc').exists():
    errors.append('Build262 must not invent an active Wrangler config for the dashboard-managed Pages project')

try:
    d=json.loads(text('data/build262_ui_health_routes.json'))
    if d.get('build')!=262: errors.append('Build262 UI route registry build != 262')
    if not any(r.get('path')=='/admin-runtime-health' for r in d.get('routes',[])): errors.append('Runtime diagnostics missing from Build262 UI route registry')
except Exception as exc: errors.append(f'Build262 UI routes invalid: {exc}')
try:
    d=json.loads(text('data/build262_cpu_source_audit.json'))
    if d.get('build')!=262 or not d.get('highest_risk_routes'): errors.append('Build262 CPU source audit is missing/empty')
except Exception as exc: errors.append(f'Build262 CPU source audit invalid: {exc}')

# Living docs and specialist runbook.
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 262','2,244','Runtime & CPU Diagnostics','CPU stabilization')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 262','CPU stabilization','Exceeded CPU')
need('STARTUP_GO_LIVE_BLOCKERS.md','# Build 262 CPU stabilization acceptance','Exceeded CPU Time Limits: 0')
need('BUILD262_SUMMARY.md','# Build 262 — CPU Self-Diagnostics & Stabilization','No live-client or DAIP workload')
need('CLOUDFLARE_OBSERVABILITY_BUILD262.md','download config','observability','Do not paste')

# One-H1 sanity on changed browser pages.
for rel in ['admin-runtime-health.html','admin-startup-guide.html','admin-ui-health.html','admin-analytics.html','admin-live.html','progress.html']:
    s=text(rel)
    if len(re.findall(r'<h1(?:\s|>)',s,re.I))>1: errors.append(f'{rel} has more than one H1')

if errors:
    print('Build 262 CPU self-diagnostics/stabilization check FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('Build 262 CPU self-diagnostics/stabilization check passed.')
