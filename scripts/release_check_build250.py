from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
errors=[]
services=(root/'services.html').read_text(encoding='utf-8')
if services.count('<h1') != 1: errors.append('services.html must contain exactly one H1')
for banned in ['openPriceChartBtn','openDetailsChartBtn','Open price chart','Open details chart']:
    if banned in services: errors.append(f'services.html still contains removed control: {banned}')
for required in ['vehicle-size-picker','principal-services','full-service-hub','/api/public/car_photos','service-photo-needed.svg','Choose your main detailing service']:
    if required not in services: errors.append(f'services.html missing {required}')
if services.index('id="principal-services"') > services.index('id="full-service-hub"'): errors.append('Full Service Hub must remain below principal services')
api=root/'functions/api/public/car_photos.js'
if not api.exists(): errors.append('public CarPhotos R2 manifest endpoint missing')
else:
    a=api.read_text(encoding='utf-8')
    if "prefix:'CarPhotos/'" not in a: errors.append('CarPhotos endpoint must be prefix-limited')
    if 'DAIP_MEDIA_BUCKET' in a: errors.append('public CarPhotos endpoint must never query private DAIP media')
for md in root.rglob('*.md'):
    if 'BUILD250_SYNC' not in md.read_text(encoding='utf-8',errors='ignore'): errors.append(f'Markdown missing Build250 sync: {md.relative_to(root)}')
for rel, marker in [('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 250'),('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 250'),('DOC_INDEX.md','# Documentation Index — Build 250'),('STARTUP_GO_LIVE_BLOCKERS.md','## 42. Validate simplified Services path and approved CarPhotos'),('service-worker.js','rosie-app-v20260810build250'),('docs/SEO_COMPETITIVE_REVIEW_BUILD250.md','Build 250 — SEO, competitor and clarity review')]:
    p=root/rel
    if not p.exists() or marker not in p.read_text(encoding='utf-8',errors='ignore'): errors.append(f'{rel} missing Build 250 marker: {marker}')
for html in root.rglob('*.html'):
    txt=html.read_text(encoding='utf-8',errors='ignore')
    if not re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex',txt,re.I):
        count=len(re.findall(r'<h1(?:\s|>)',txt,re.I))
        if count>1: errors.append(f'{html.relative_to(root)} has {count} H1s')
if errors:
    print('Build 250 release check FAILED')
    print('\n'.join('- '+e for e in errors))
    sys.exit(1)
print('Build 250 release check passed')
