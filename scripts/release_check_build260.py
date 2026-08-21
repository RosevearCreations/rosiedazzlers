from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def text(rel):
    p=ROOT/rel
    if not p.exists():
        errors.append(f'missing {rel}')
        return ''
    return p.read_text(encoding='utf-8',errors='ignore')

def need(rel,*tokens):
    s=text(rel)
    for token in tokens:
        if token not in s: errors.append(f'{rel} missing {token}')
    return s

def same(a,b,label):
    if text(a)!=text(b): errors.append(f'{label} drifted: {a} != {b}')

# Photo sync must be cursor-paged across separate HTTP invocations and never PATCH per photo.
photo=need('functions/api/_lib/photo-library.js',
    'loadMediaLibraryRowsByR2Keys','startCursors','maxListPagesPerPrefix=20','maxListPagesPerPrefix:1',
    'next_cursor','has_more','on_conflict=media_key','resolution=merge-duplicates,return=minimal',
    'limitPerPrefix:100','maxPerPrefix:100')
sync_start=photo.find('export async function syncR2IntoLibrary')
sync_end=photo.find('\nexport function guessContentType',sync_start)
sync_body=photo[sync_start:sync_end]
if "method:'PATCH'" in sync_body or 'method:"PATCH"' in sync_body:
    errors.append('Build260 Photo Studio sync regressed to per-photo PATCH')
route=need('functions/api/admin/photo_library_sync.js',
    'Build 260 sync requires one approved R2 prefix per request.','body?.cursor','single_prefix_page','build:260')
studio=need('admin-photo-studio.html',
    'Reset this location to default','A single photo may be used in more than one website location.',
    'let cursor=\'\';let page=0','data.next_cursor','bounded request','/api/admin/photo_library_sync')
same('admin-photo-studio.html','admin-photo-studio/index.html','Photo Studio clean route')
assign=need('functions/api/admin/photo_assignment_save.js','reset_to_default','multi_placement')

# Media Health is database-first; public probes are explicit and bounded.
health=need('functions/api/admin/photo_library_health.js','SAMPLE_LIMIT=12','scan_mode:\'database_first\'','r2_scan:false','automatic_public_probe:false','loadMediaLibraryRows','loadAssignmentRows')
if '.list(' in health or 'listApprovedR2Images' in health:
    errors.append('Media Health must not enumerate R2')
if 'SAMPLE_LIMIT=12' not in health: errors.append('Media Health delivery sample is no longer bounded to 12')
need('admin-media-health.html','database-first diagnostics','Run delivery sample (12 max)','Photo Studio = edit and placement','DAIP private media stays separate')
same('admin-media-health.html','admin-media-health/index.html','Media Health clean route')

# Startup evidence and UI/cache health must represent Build260, not old release IDs.
need('assets/startup-command-center.js',"const BUILD=260",'/data/build260_go_live_blockers.json','current catalog only','getEvidenceRows')
need('assets/cache-health-controls.js',"/assets/startup-command-center.js?v=20260818build260",'EXPECTED_BUILD = 260')
need('assets/ui-health-scanner.js','const BUILD=260','/data/build260_ui_health_routes.json')
need('service-worker.js','rosie-app-v20260818build260','build260_go_live_blockers.json','build260_ui_health_routes.json')
need('admin-startup-guide.html','Build 260 · current startup authority','These are verification records, not blanket approvals.','current Build 260 catalog')
same('admin-startup-guide.html','admin-startup-guide/index.html','Startup Guide clean route')
same('admin-ui-health.html','admin-ui-health/index.html','UI Health clean route')
try:
    routes=json.loads(text('data/build260_ui_health_routes.json')).get('routes',[])
    if len(routes)<40: errors.append(f'Build260 UI-health route coverage unexpectedly low: {len(routes)}')
except Exception as exc: errors.append(f'Build260 UI health route data invalid: {exc}')

# Current Startup catalog must retire old one-off migrations but preserve history in DB.
catalog=need('functions/api/_lib/startup-process-catalog.js','RETIRED_STARTUP_PROCESS_IDS_BUILD260','STARTUP_PROCESS_CATALOG_BUILD260','STARTUP_PROCESS_BUILD = 260','photo-studio-sync-260','media-health-260','daip-project-flow-260')
need('functions/api/admin/startup_process_list.js','STARTUP_PROCESS_CATALOG_BUILD260','RETIRED_STARTUP_PROCESS_IDS_BUILD260','shared_database_plus_build260')
need('functions/api/_lib/launch-readiness-evidence.js','deploy_260','photo_sync_260','media_health_260','daip_project_flow_260','quote_pipeline_259')

# DAIP roles: Creative Projects starts real work; Dry Run is fictional; Gate C is technical/governance evidence.
creative=need('admin-creative-projects.html','Start a fresh DAIP project here','New creative project','private DAIP Media Intake')
dry=need('admin-daip-intake-dry-run.html','rehearsal, not','fictional','Creative Project')
gate=need('admin-daip-gate-c.html','What Gate C is','technical/governance','not as a per-project')
same('admin-creative-projects.html','admin-creative-projects/index.html','Creative Projects clean route')
same('admin-daip-intake-dry-run.html','admin-daip-intake-dry-run/index.html','DAIP Dry Run clean route')
same('admin-daip-gate-c.html','admin-daip-gate-c/index.html','DAIP Gate C clean route')

# Build260 migration/current roadmap.
sql=need('sql/2026-08-18_build260_startup_catalog_health_sync.sql','Historical evidence is retained','deploy-260','photo-studio-sync-260','media-health-260','daip-project-flow-260','b260_20')
need('functions/api/_lib/roadmap-execution.js','BUILD=260','b260_01','b260_20','Build 260')

# Documentation authority remains exactly two living planning documents.
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 260')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 260')
need('STARTUP_GO_LIVE_BLOCKERS.md','Build 260','specialist')
need('DOC_INDEX.md','Only `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md` are living planning authorities.','AI_PROJECT_HANDOFF.md','MASTER_VALUE_ROADMAP.md')
need('BUILD260_SUMMARY.md','# Build 260 — Photo Sync Stabilization','cursor page','Build 260 next-20')
md=list(ROOT.rglob('*.md'))
missing_sync=[str(p.relative_to(ROOT)) for p in md if 'BUILD260_SYNC:' not in p.read_text(encoding='utf-8',errors='ignore')]
if missing_sync: errors.append(f'{len(missing_sync)} Markdown files missing BUILD260_SYNC marker; first {missing_sync[:5]}')
for p in md:
    rel=str(p.relative_to(ROOT))
    s=p.read_text(encoding='utf-8',errors='ignore')
    if rel not in {'AI_PROJECT_HANDOFF.md','MASTER_VALUE_ROADMAP.md'} and 'DOCUMENT STATUS — Build 260' not in s and rel not in {'STARTUP_GO_LIVE_BLOCKERS.md','DOC_INDEX.md'}:
        errors.append(f'{rel} missing Build260 historical/specialist status banner')
        if len(errors)>40: break

# SEO/mobile route basics.
for rel in ['admin-photo-studio.html','admin-media-health.html','admin-startup-guide.html','admin-ui-health.html','admin-creative-projects.html','admin-daip-intake-dry-run.html','admin-daip-gate-c.html']:
    s=text(rel)
    if len(re.findall(r'<h1(?:\s|>)',s,re.I))>1: errors.append(f'{rel} has more than one H1')
    if '@media' not in s and rel in {'admin-photo-studio.html','admin-media-health.html'}: errors.append(f'{rel} missing responsive CSS')

if errors:
    print('Build 260 stabilization/startup/DAIP/media-health check FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print(f'Build 260 stabilization/startup/DAIP/media-health check passed ({len(md)} Markdown files classified).')
