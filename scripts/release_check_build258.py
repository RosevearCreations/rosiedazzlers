from pathlib import Path
import json,re,sys
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

photo_lib=need('functions/api/_lib/photo-library.js','versionedPublicUrl','r2_etag','refreshRows','refreshed','refreshLimit','listApprovedR2Images(env,{limitPerPrefix:250,maxPerPrefix:250,maxTotal:1200,includeMetadata:false})')
for token in ['alt_text:null','caption:null']:
    if token not in photo_lib: errors.append(f'new-photo sync safety missing {token}')
public_lib=need('functions/api/_lib/public-website-images.js','build:258','versionedPublicUrl','media.r2_etag||media.updated_at||media.uploaded_at','loadPublicMediaRowsByIds','r2_scan_per_request:false')
if 'listApprovedR2Images' in public_lib: errors.append('public image manifest must not scan R2 on page requests')
need('functions/api/public_website_images.js','Historical Build 257 compatibility token: build:257','build:258')
admin_list=need('functions/api/admin/photo_library_list.js','build:258','r2_scan_per_load:false','managed_library_only')
if 'listApprovedR2Images' in admin_list: errors.append('ordinary Photo Studio load must remain database-only')
need('functions/api/admin/photo_library_sync.js','Historical Build 253 compatibility token: build:253','build:258','syncR2IntoLibrary')

delete=need('functions/api/admin/photo_library_delete.js','is_active=eq.true','bucket.delete(r2Key)','inactive_history_removed','is_active=eq.false','restoreHistory','build:258')
if delete.find('is_active=eq.true')>delete.find('bucket.delete(r2Key)'): errors.append('delete must check active assignment before R2 deletion')

resolver=need('assets/website-images.js','explicitImageForTarget','hydrateManagedImageSlots','managedGalleryContent','evidence|technique|efficiency','gallery:before-after','Build 258 wires explicit assignments')
mirror=need('functions/api/assets/website-images.js','managedGalleryContent','gallery:before-after')
if resolver!=mirror: errors.append('website-images Functions mirror drifted')
placeholder=need('assets/visual-placeholders.js','node.dataset.r2ImageKeywords','node.dataset.photoTarget','node.dataset.photoImageTarget')
placeholder_mirror=need('functions/api/assets/visual-placeholders.js','node.dataset.photoImageTarget')
if placeholder!=placeholder_mirror: errors.append('visual-placeholders Functions mirror drifted')

services=need('services.html','Which service should we choose?','hub:services:interior','landing:ceramic-coating:hero','landing:tillsonburg-auto-detailing:hero','page:services:review-proof','website-images.js?v=20260813build258','site.css?v=20260813build258')
pricing=need('pricing.html','Town-focused detailing pages','High-intent service pages','landing:tillsonburg-auto-detailing:hero','landing:ceramic-coating:hero','page:pricing:review-proof','website-images.js?v=20260813build258')
faq=need('faq.html','Where these pages are accessed','page:faq:booking-help','page:faq:service-choices','page:faq:help-articles','page:faq:local-proof','website-images.js?v=20260813build258')
gifts=need('gift-cards.html','Gift card options','gift-card:interior','gift-card:complete','gift-card:custom','gift-card-preview-art','website-images.js?v=20260813build258')
gallery=need('gallery.html','Detailing results, evidence, and techniques','managedGalleryContent','Evidence','Technique','Efficiency','website-images.js?v=20260813build258')
home=need('index.html','page:home:review-proof','website-images.js?v=20260813build258')
landing=need('assets/landing-page.js','website-images.js?v=20260813build258','explicitImageForTarget','review-proof','beforeAfterMarkup')
ceramic=need('ceramic-coating/index.html','landing:ceramic-coating:review-proof','website-images.js?v=20260813build258')

for root_page,route in [('services.html','services/index.html'),('pricing.html','pricing/index.html'),('faq.html','faq/index.html'),('gift-cards.html','gift-cards/index.html'),('gallery.html','gallery/index.html'),('admin-photo-studio.html','admin-photo-studio/index.html')]:
    if text(root_page)!=text(route): errors.append(f'route-copy drift: {root_page} != {route}')

site_css=need('assets/site.css','.decision-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))','@media(max-width:900px)','grid-template-columns:repeat(2,minmax(0,1fr))','@media(max-width:620px)')
if site_css!=text('functions/api/assets/site.css'): errors.append('site.css Functions mirror drifted')

studio=need('admin-photo-studio.html','Delete unassigned image from library + R2','photoDisplayUrl','data.refreshed','active-assignment check','Assigned to:','✓ assigned')

try:
    registry=json.loads(text('data/build253_photo_targets.json'))
    keys={row.get('target_key') for row in registry.get('targets',[])}
    if registry.get('build')!=253 or int(registry.get('current_build') or 0)<258: errors.append('target registry must retain Build253 schema identity and expose current_build >= 258')
    required=['page:home:review-proof','page:services:review-proof','page:pricing:review-proof','page:faq:local-proof','gift-card:interior','hub:services:interior','gallery:evidence:1','gallery:technique:1','gallery:efficiency:1','gallery:before-after:1:before','gallery:before-after:1:after']
    for key in required:
        if key not in keys: errors.append(f'target registry missing {key}')
    if len([k for k in keys if str(k).startswith('gallery:evidence:')])<12: errors.append('gallery evidence target coverage below 12')
    if len([k for k in keys if str(k).startswith('gallery:technique:')])<12: errors.append('gallery technique target coverage below 12')
    if len([k for k in keys if str(k).startswith('gallery:efficiency:')])<12: errors.append('gallery efficiency target coverage below 12')
except Exception as exc:
    errors.append(f'target registry invalid: {exc}')

sw=need('service-worker.js','rosie-app-v20260813build258','Historical Build 257 cache guard: rosie-app-v20260813build257')
need('BUILD258_SUMMARY.md','Public Photo Consistency, Gallery Expansion & Safe Cleanup','No SQL migration is required for Build 258')
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 258')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 258')
need('STARTUP_GO_LIVE_BLOCKERS.md','Validate Build 258 public photo consistency and cleanup')

md=list(ROOT.rglob('*.md'))
missing=[str(p.relative_to(ROOT)) for p in md if 'BUILD258_SYNC:' not in p.read_text(encoding='utf-8',errors='ignore')]
if missing: errors.append(f'{len(missing)} Markdown files missing BUILD258_SYNC marker; first: {missing[:5]}')

# Modified public pages keep one-H1 rule.
for rel in ['services.html','pricing.html','faq.html','gift-cards.html','gallery.html','index.html','ceramic-coating/index.html']:
    count=len(re.findall(r'<h1(?:\s|>)',text(rel),re.I))
    if count>1: errors.append(f'{rel} has {count} H1s')

if errors:
    print('Build 258 public photo consistency check FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print(f'Build 258 public photo consistency check passed ({len(md)} Markdown files synchronized).')
