#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing {rel}'); return ''
    return p.read_text(errors='replace')
def need(rel, needles):
    s=read(rel)
    for n in needles:
        if n not in s: errors.append(f'{rel} missing {n!r}')

required=[
 'admin-daip-media.html','admin-daip-media/index.html','functions/api/_lib/daip-media.js',
 'functions/api/admin/daip_media_start.js','functions/api/admin/daip_media_part.js',
 'functions/api/admin/daip_media_complete.js','functions/api/admin/daip_media_abort.js',
 'functions/api/admin/daip_media_dashboard.js','functions/api/admin/daip_media_session_parts.js',
 'sql/2026-08-07_build247_daip_private_media_ingestion.sql','DAIP_R2_MEDIA_SETUP_GUIDE.md',
 'data/build247_go_live_blockers.json','data/build247_next_steps.json','data/build247_following_steps.json',
 'data/build247_daip_media_ingestion.json','data/build247_ui_health_routes.json'
]
for rel in required: read(rel)
need('functions/api/_lib/daip-media.js',['DAIP_MEDIA_BUCKET','createMultipartUpload','32 * 1024 * 1024','projects/${projectId}/raw/'])
need('functions/api/admin/daip_media_part.js',['resumeMultipartUpload','uploadPart','daip_media_upload_parts'])
need('functions/api/admin/daip_media_complete.js',['.complete(','daip_media_processing_jobs','DAIP_PROCESSING_QUEUE','queue_dispatched'])
need('functions/api/admin/daip_media_abort.js',['.abort()','Completed raw originals cannot be aborted or deleted'])
need('functions/api/admin/daip_media_start.js',['daip_project_media_assets','already_uploaded:true','client_fingerprint','private_internal'])
need('sql/2026-08-07_build247_daip_private_media_ingestion.sql',[
 'create table if not exists public.daip_project_media_assets','create table if not exists public.daip_media_upload_sessions',
 'create table if not exists public.daip_media_upload_parts','create table if not exists public.daip_media_processing_jobs',
 'public_destination_enabled boolean not null default false','enable row level security','DAIP_MEDIA_BUCKET'
])
# Protect Build 218 table from collision.
mig=read('sql/2026-08-07_build247_daip_private_media_ingestion.sql')
if re.search(r'create table if not exists public\.daip_media_assets\b',mig): errors.append('Build247 migration collides with Build218 daip_media_assets')
need('SUPABASE_SCHEMA.sql',['BEGIN 2026-08-07_build247_daip_private_media_ingestion.sql','daip_project_media_assets','daip_media_processing_jobs'])
page=read('admin-daip-media.html')
if len(re.findall(r'<h1\b',page,re.I))!=1: errors.append('admin-daip-media.html must contain exactly one H1')
for x in ['noindex,nofollow,noarchive','DAIP Large Media Intake','DAIP_MEDIA_BUCKET','32 MB','Pause after current chunk','Upload queued files','@media(max-width:']:
    if x not in page: errors.append(f'admin-daip-media.html missing {x!r}')
if read('admin-daip-media.html')!=read('admin-daip-media/index.html'): errors.append('admin-daip-media clean route copy differs')
need('assets/admin-menu.js',['admin-daip-media','/admin-daip-media.html'])
need('assets/admin-auth.js',['admin-daip-media'])
need('scripts/sync_route_copies.py',['admin-daip-media.html'])
need('admin-creative-projects.html',['Upload raw DAIP media',"'/admin-daip-media.html?project_id='+encodeURIComponent(p.id)"])
need('admin-startup-guide.html',['DAIP raw-media readiness','/admin-daip-media.html','build247'])
need('functions/api/admin/production_reliability_report.js',['Private DAIP media R2 binding','daip_project_media_assets','daip_media_processing_jobs'])
need('service-worker.js',['rosie-app-v20260807build247','/admin-daip-media.html','/data/build247_go_live_blockers.json'])
# Machine-readable files.
for rel in ['data/build247_go_live_blockers.json','data/build247_next_steps.json','data/build247_following_steps.json','data/build247_daip_media_ingestion.json','data/build247_ui_health_routes.json','data/markdown_sanity_build247.json']:
    try: json.loads(read(rel))
    except Exception as e: errors.append(f'{rel} invalid JSON: {e}')
try:
    blockers=json.loads(read('data/build247_go_live_blockers.json')).get('items',[])
    keys={r.get('id') or r.get('key') or r.get('process_key') for r in blockers}
    if not {'daip-private-r2-setup','daip-large-media-acceptance'} <= keys: errors.append('Build247 Startup fallback missing DAIP items 38/39')
except: pass
for rel in ['data/build247_next_steps.json','data/build247_following_steps.json']:
    try:
        if len(json.loads(read(rel)).get('items',[]))!=20: errors.append(f'{rel} must contain exactly 20 items')
    except: pass
# All Markdown must carry the current sync marker.
mds=list(ROOT.rglob('*.md'))
for p in mds:
    if 'BUILD247_SYNC:' not in p.read_text(errors='replace'): errors.append(f'{p.relative_to(ROOT)} missing BUILD247_SYNC')
# Runtime must not use deprecated SVG photo fallbacks. Functional vehicle outlines/charts are allowed.
for p in ROOT.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in {'.html','.js','.json','.css'}: continue
    s=p.read_text(errors='replace')
    for bad in ['rosie-reviews-fallback.svg','generic_addon.svg','de_ionizing_treatment.svg','de_badging.svg','engine_cleaning.svg','external_ceramic_coating.svg','external_graphene_fine_finish.svg','external_wax.svg','vinyl_wrapping.svg','window_tinting.svg']:
        if bad in s: errors.append(f'{p.relative_to(ROOT)} still references deprecated photo fallback {bad}')
# Required raster fallbacks are real images in the package.
for rel in ['assets/placeholders/service-photo.jpg','assets/placeholders/local-proof-photo.jpg','assets/placeholders/product-gallery-photo.jpg','assets/placeholders/inventory-tools-photo.jpg','assets/placeholders/workflow-photo.jpg','assets/placeholders/launch-readiness-photo.jpg','assets/brand/rosie-reviews-fallback.png','assets/addons/generic_addon.png']:
    p=ROOT/rel
    if not p.exists() or p.stat().st_size<10000: errors.append(f'{rel} missing or too small to be a real raster fallback')
if errors:
    print('Build 247 DAIP private-media ingestion checks failed:')
    for e in errors: print(' -',e)
    sys.exit(1)
print(f'Build 247 DAIP private-media ingestion checks passed ({len(mds)} Markdown files synchronized).')
