from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
errors=[]

def need(rel,*tokens):
    p=root/rel
    if not p.exists(): errors.append(f'missing {rel}'); return ''
    txt=p.read_text(encoding='utf-8',errors='ignore')
    for token in tokens:
        if token not in txt: errors.append(f'{rel} missing {token}')
    return txt

helper=need('functions/api/_lib/photo-library.js','PHOTO_BUILD = 253','APPROVED_IMAGE_PREFIXES','landing_pages/','landing-pages/','CarPhotos/','syncR2IntoLibrary','photoSchemaStatus',"segment === '..'")
if 'DAIP_MEDIA_BUCKET' in helper: errors.append('Photo library helper must never touch private DAIP media')
public=need('functions/api/public_website_images.js','buildPublicWebsiteImageManifest','Historical Build 252 guard tokens')
need('functions/api/public/website_images.js','Compatibility alias','buildPublicWebsiteImageManifest')
publiclib=need('functions/api/_lib/public-website-images.js','assignments','allowed_prefixes','isApprovedImageKey')
if 'DAIP_MEDIA_BUCKET' in publiclib: errors.append('Public website image manifest must never touch private DAIP media')

for rel in ['functions/api/admin/photo_library_list.js','functions/api/admin/photo_library_sync.js','functions/api/admin/photo_library_save.js','functions/api/admin/photo_library_move.js','functions/api/admin/photo_assignment_save.js']:
    need(rel,'requireStaffAccess','build:253')

studio=need('admin-photo-studio.html','<h1>Photo Management Studio</h1>','Sync approved R2 photos','Save photo metadata','Rename / move photo','Assign selected photo','build253_photo_targets.json','/api/admin/photo_library_list')
clean=need('admin-photo-studio/index.html','<h1>Photo Management Studio</h1>')
if studio!=clean: errors.append('Photo Studio clean-route copy drifted')

for rel in ['assets/admin-auth.js','functions/api/assets/admin-auth.js','assets/admin-menu.js','functions/api/assets/admin-menu.js']:
    need(rel,'admin-photo-studio')
need('admin.html','photo-studio-dashboard-card','/admin-photo-studio.html')
if (root/'admin.html').read_text(encoding='utf-8')!=(root/'admin/index.html').read_text(encoding='utf-8'): errors.append('Admin dashboard clean-route copy drifted')

sql=need('sql/2026-08-12_build253_photo_management_studio.sql','app_media_assignments','r2_key','seo_title','focal_point','decorative','enable row level security')
need('SUPABASE_SCHEMA.sql','Build 253 — application-wide Photo Management Studio','app_media_assignments')

resolver=need('assets/website-images.js',"'/api/public_website_images'",'assignedImages','package:${rawCode}:${size}','addon:${rawCode}','landing:${rawSlug}:hero','node.dataset.photoTarget')
need('services.html','website-images.js?v=20260812build253','preferredPhotoRow?.alt_text','preferredAddonPhoto?.alt_text')
if (root/'services.html').read_text(encoding='utf-8')!=(root/'services/index.html').read_text(encoding='utf-8'): errors.append('Services clean-route copy drifted')
need('assets/landing-page.js','website-images.js?v=20260812build253','matchedHeroMeta?.alt_text','object-position')
need('index.html','data-photo-target="home:service:ceramic-coating"','data-photo-target="home:location:tillsonburg-auto-detailing"')
need('admin-daip-gate-c.html',"'/api/public_website_images'",'admin:gate-c:feature')
if (root/'admin-daip-gate-c.html').read_text(encoding='utf-8')!=(root/'admin-daip-gate-c/index.html').read_text(encoding='utf-8'): errors.append('Gate C clean-route copy drifted')

upload=need('functions/api/admin/media_asset_upload.js','landing_pages','CarPhotos','products','build:"253"','hasUnsafePath')
need('service-worker.js',"rosie-app-v20260812build253",'/admin-photo-studio.html','/data/build253_photo_targets.json')

targets=json.loads((root/'data/build253_photo_targets.json').read_text(encoding='utf-8'))
keys={row.get('target_key') for row in targets.get('targets',[])}
if targets.get('build')!=253 or len(keys)<100: errors.append('Build 253 target registry is missing/below expected coverage')
for key in ['package:complete_detail:mid','landing:ceramic-coating:hero','home:location:tillsonburg-auto-detailing','admin:gate-c:feature']:
    if key not in keys: errors.append(f'target registry missing {key}')

for md in root.rglob('*.md'):
    if 'BUILD253_SYNC' not in md.read_text(encoding='utf-8',errors='ignore'):
        errors.append(f'Markdown missing Build253 sync: {md.relative_to(root)}')

need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 253','Photo Management Studio')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 253','Photo Management Studio')
need('STARTUP_GO_LIVE_BLOCKERS.md','Validate Build 253 Photo Management Studio')
need('BUILD253_SUMMARY.md','# Build 253 — Application-wide Photo Management Studio')

for html in root.rglob('*.html'):
    txt=html.read_text(encoding='utf-8',errors='ignore')
    if not re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex',txt,re.I):
        count=len(re.findall(r'<h1(?:\s|>)',txt,re.I))
        if count>1: errors.append(f'{html.relative_to(root)} has {count} H1s')

if errors:
    print('Build 253 release check FAILED')
    print('\n'.join('- '+e for e in errors))
    sys.exit(1)
print('Build 253 release check passed')
