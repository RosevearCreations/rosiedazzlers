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

# 503 noise/reliability
chrome=need('assets/chrome.js',"path.startsWith('/admin')","public-analytics.js?v=20260819build261",'public PWA manifest is unnecessary')
need('assets/public-analytics.js','FAILURE_BACKOFF_MS','analyticsTemporarilyDisabled','response.status === 429 || response.status >= 500','120000')
sw=need('service-worker.js','rosie-app-v20260819build261',"'/manifest.webmanifest'",'response.status>=500','ignoreSearch:true','url.pathname.startsWith(\'/api/\')')
need('assets/admin-runtime.js','Cloudflare/Pages temporarily returned ${response.status}')
same('assets/chrome.js','functions/api/assets/chrome.js','chrome asset mirror')
same('assets/public-analytics.js','functions/api/assets/public-analytics.js','analytics asset mirror')

# assignment endpoint must not burn schema probes every save
assign=need('functions/api/admin/photo_assignment_save.js','Build 261','multi_placement_supported:true','reset_to_default:true','on_conflict=target_key','build:261')
if 'photoSchemaStatus' in assign: errors.append('photo_assignment_save still runs photoSchemaStatus on every write')

studio=need('admin-photo-studio.html','Download unassigned placements CSV','Print unassigned placements','unassignedPlacementTargets','No manual Photo Studio assignment','TRANSIENT_RETRY_PATHS','Reset this location to default','A single photo may be used in more than one website location.')
same('admin-photo-studio.html','admin-photo-studio/index.html','Photo Studio clean route')

# DAIP 400-prone UX must retain safety but remove typing traps
helper=need('functions/api/_lib/daip-test-mode.js','replace(/\\s+/g','toUpperCase()','extra = {}')
need('functions/api/admin/daip_test_job_create.js','invalid_test_reference','safety_acknowledgement_required','runtime_build:261')
daip=need('admin-daip.html','Generate safe test reference','value="INTERNAL TEST ONLY" readonly','generateTestReference','Check all three safety acknowledgements')
same('admin-daip.html','admin-daip/index.html','DAIP Test Lab clean route')

# cache health coherence
need('assets/startup-command-center.js','const BUILD=261',"rosie_startup_build261_")
need('assets/cache-health-controls.js','EXPECTED_BUILD = 261','20260819build261','Build 261 assets confirmed')
need('assets/ui-health-scanner.js','const BUILD=261','build261_ui_health_routes.json')
need('admin-startup-guide.html','Build 261 · current startup runtime','20260819build261')
same('admin-startup-guide.html','admin-startup-guide/index.html','Startup guide clean route')
try:
    d=json.loads(text('data/build261_ui_health_routes.json'))
    if d.get('build')!=261: errors.append('Build261 UI route data build is not 261')
except Exception as exc: errors.append(f'Build261 UI route JSON invalid: {exc}')

# living docs
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 261','unassigned-placement')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 261','public analytics off protected')
need('BUILD261_SUMMARY.md','# Build 261 — Admin Runtime Reliability','No new SQL migration is required for Build 261')

# H1 and responsive sanity
for rel in ['admin-photo-studio.html','admin-daip.html','admin-startup-guide.html']:
    s=text(rel)
    if len(re.findall(r'<h1(?:\s|>)',s,re.I))>1: errors.append(f'{rel} has more than one H1')
if '@media' not in studio: errors.append('Photo Studio lost responsive CSS')
if '@media' not in daip: errors.append('DAIP Test Lab lost responsive CSS')

if errors:
    print('Build 261 reliability/DAIP/photo-audit check FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('Build 261 reliability/DAIP/photo-audit check passed.')
