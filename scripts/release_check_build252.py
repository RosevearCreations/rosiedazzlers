from pathlib import Path
import re,sys,json
root=Path(__file__).resolve().parents[1]
errors=[]

endpoint=(root/'functions/api/public/website_images.js').read_text(encoding='utf-8')
for token in ["prefix: 'packages/'","prefix: 'landing_pages/'","prefix: 'CarPhotos/'","build:252","allowed_prefixes"]:
    if token not in endpoint: errors.append(f'website_images endpoint missing {token}')
if 'DAIP_MEDIA_BUCKET' in endpoint:
    errors.append('public website_images endpoint must not reference private DAIP_MEDIA_BUCKET')

resolver=(root/'assets/website-images.js').read_text(encoding='utf-8')
for token in ['loadWebsiteImageManifest','packageImageMatches','addonImageMatches','landingImageMatches','hydrateR2CardImages','preferredPrefixes']:
    if token not in resolver: errors.append(f'website image resolver missing {token}')

services=(root/'services.html').read_text(encoding='utf-8')
for token in ['/api/public/car_photos','/assets/website-images.js?v=20260812build252','packageImageMatches','addonImageMatches','hydrateR2CardImages','landing-pages, and real-car R2 libraries']:
    if token not in services: errors.append(f'services.html missing {token}')
if (root/'services/index.html').read_text(encoding='utf-8') != services:
    errors.append('services clean-route copy drifted')

landing=(root/'assets/landing-page.js').read_text(encoding='utf-8')
for token in ['/assets/website-images.js?v=20260812build252','landingImageMatches','landingAreaServed','websiteImageManifest','matchedR2Hero']:
    if token not in landing: errors.append(f'landing-page.js missing {token}')
if '"areaServed": ["Tillsonburg, Ontario", "Woodstock, Ontario"' in landing:
    errors.append('dynamic landing structured data still claims the old over-broad town list')

home=(root/'index.html').read_text(encoding='utf-8')
for token in ['data-r2-image-keywords="ceramic coating','data-r2-image-keywords="Tillsonburg auto detailing','hydrateR2CardImages']:
    if token not in home: errors.append(f'index.html missing {token}')

ceramic=(root/'ceramic-coating/index.html').read_text(encoding='utf-8')
if 'data-r2-image-keywords="ceramic coating' not in ceramic or 'hydrateR2CardImages' not in ceramic:
    errors.append('ceramic coating page is not connected to approved R2 imagery')

css=(root/'assets/site.css').read_text(encoding='utf-8')
if 'Build 252 — approved R2 imagery' not in css or '.r2-card-photo' not in css:
    errors.append('Build 252 responsive R2 card CSS missing')

sw=(root/'service-worker.js').read_text(encoding='utf-8')
if "rosie-app-v20260812build252" not in sw or "'/assets/website-images.js'" not in sw:
    errors.append('Build 252 service worker/cache assets missing')

mapping=json.loads((root/'data/build252_public_r2_image_mapping.json').read_text(encoding='utf-8'))
if mapping.get('build') != 252 or not mapping.get('private_media_excluded'):
    errors.append('Build 252 image mapping policy invalid')

for md in root.rglob('*.md'):
    if 'BUILD252_SYNC' not in md.read_text(encoding='utf-8',errors='ignore'):
        errors.append(f'Markdown missing Build252 sync: {md.relative_to(root)}')

for rel,mark in [
    ('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 252'),
    ('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 252'),
    ('DOC_INDEX.md','# Documentation Index — Build 252'),
    ('STARTUP_GO_LIVE_BLOCKERS.md','## 44. Validate approved public R2 image assignment'),
    ('BUILD252_SUMMARY.md','# Build 252 — Approved R2 Website Image Assignment')
]:
    p=root/rel
    if not p.exists() or mark not in p.read_text(encoding='utf-8',errors='ignore'):
        errors.append(f'{rel} missing {mark}')

for html in root.rglob('*.html'):
    txt=html.read_text(encoding='utf-8',errors='ignore')
    if not re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex',txt,re.I):
        count=len(re.findall(r'<h1(?:\s|>)',txt,re.I))
        if count>1: errors.append(f'{html.relative_to(root)} has {count} H1s')

if errors:
    print('Build 252 release check FAILED')
    print('\n'.join('- '+e for e in errors))
    sys.exit(1)
print('Build 252 release check passed')
