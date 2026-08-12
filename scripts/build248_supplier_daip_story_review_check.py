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
 'functions/api/admin/catalog_supplier_link_preview.js',
 'functions/api/admin/daip_media_asset_review.js',
 'functions/api/admin/daip_media_job_action.js',
 'functions/api/admin/daip_media_dashboard.js',
 'functions/api/admin/creative_project_detail.js',
 'functions/api/admin/creative_project_advanced_action.js',
 'sql/2026-08-09_build248_supplier_daip_story_review.sql',
 'admin-catalog.html','admin-daip-media.html','admin-creative-projects.html',
 'docs/SEO_COMPETITIVE_REVIEW_BUILD248.md'
]
for rel in required: read(rel)

need('functions/api/admin/catalog_supplier_link_preview.js',[
 'function pick(html, ...patterns)','readTextLimited','1_500_000','a.co','amzn.to','source_currency','source_price','cost_cad'
])
if 'for(const p of patterns)' in read('functions/api/admin/catalog_supplier_link_preview.js') and 'function pick(html, ...patterns)' not in read('functions/api/admin/catalog_supplier_link_preview.js'):
    errors.append('supplier preview still contains non-iterable patterns helper')
need('admin-catalog.html',['Amazon.ca, Amazon.com, a.co or amzn.to','source_currency','Import into review'])

need('sql/2026-08-09_build248_supplier_daip_story_review.sql',[
 'story_review_status','story_sort_order','max_attempts','dead_lettered_at','content_package_status','ready_for_review','content_package_reviewed'
])
need('SUPABASE_SCHEMA.sql',[
 "'documentation','content','security'",'BEGIN 2026-08-09_build248_supplier_daip_story_review.sql','story_review_status','content_package_status'
])
need('functions/api/admin/daip_media_asset_review.js',['story_review_status','selected','public_destination_enabled:false'])
need('functions/api/admin/daip_media_job_action.js',['dead_letter','max_attempts','DAIP_PROCESSING_QUEUE','raw_media_deleted:false'])
need('admin-daip-media.html',['/api/admin/daip_media_asset_review','/api/admin/daip_media_job_action','Story use','dead-letter'])
need('functions/api/admin/creative_project_detail.js',['content_package_readiness','daip_story_assets','private_story_plan_ready','processing_problem_count'])
need('functions/api/admin/creative_project_advanced_action.js',['approved_sessions_and_reviewed_private_media','evidence_manifest','content_package_review','No content was published'])
need('admin-creative-projects.html',['Reviewed content-package readiness','contentPackageStatus','Review private story media','saveContentPackageGate'])
need('service-worker.js',['rosie-app-v20260809build248'])

for a,b in [('admin-catalog.html','admin-catalog/index.html'),('admin-daip-media.html','admin-daip-media/index.html'),('admin-creative-projects.html','admin-creative-projects/index.html')]:
    if read(a)!=read(b): errors.append(f'route copy mismatch: {a} != {b}')

# Local service schema must be focused on the page's actual town/county rather than repeating every service town.
local_expect={
 'tillsonburg-auto-detailing/index.html':{'Tillsonburg, Ontario','Oxford County, Ontario'},
 'woodstock-ingersoll-auto-detailing/index.html':{'Woodstock, Ontario','Ingersoll, Ontario','Oxford County, Ontario'},
 'simcoe-delhi-auto-detailing/index.html':{'Simcoe, Ontario','Delhi, Ontario','Norfolk County, Ontario'},
 'port-dover-auto-detailing/index.html':{'Port Dover, Ontario','Norfolk County, Ontario'},
}
for rel,expected in local_expect.items():
    s=read(rel)
    if len(re.findall(r'<h1\b',s,re.I))!=1: errors.append(f'{rel} must have exactly one H1')
    m=re.search(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>',s,re.S)
    if not m: errors.append(f'{rel} missing JSON-LD'); continue
    try:
        data=json.loads(m.group(1)); areas=set(data.get('areaServed') or [])
        if areas!=expected: errors.append(f'{rel} areaServed not locally focused: {sorted(areas)}')
    except Exception as exc: errors.append(f'{rel} invalid JSON-LD: {exc}')

need('DOC_INDEX.md',['Two living authorities','AI_PROJECT_HANDOFF.md','MASTER_VALUE_ROADMAP.md'])
need('AI_PROJECT_HANDOFF.md',['Build 248','Amazon supplier-link','reviewed private story evidence'])
need('MASTER_VALUE_ROADMAP.md',['Build 248','Current next work','processing consumer'])
need('STARTUP_GO_LIVE_BLOCKERS.md',['Build 248','supplier-link','story-evidence'])

mds=list(ROOT.rglob('*.md'))
for p in mds:
    text=p.read_text(errors='replace')
    if 'BUILD247_SYNC:' not in text: errors.append(f'{p.relative_to(ROOT)} missing retained BUILD247_SYNC marker')
    if 'BUILD248_SYNC:' not in text: errors.append(f'{p.relative_to(ROOT)} missing BUILD248_SYNC marker')

if errors:
    print('Build 248 supplier/DAIP/story-review checks failed:')
    for e in errors: print(' -',e)
    sys.exit(1)
print(f'Build 248 supplier/DAIP/story-review checks passed ({len(mds)} Markdown files synchronized).')
