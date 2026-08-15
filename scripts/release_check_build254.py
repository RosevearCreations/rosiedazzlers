from pathlib import Path
import re,sys
root=Path(__file__).resolve().parents[1]
errors=[]
def need(rel,*tokens):
 p=root/rel
 if not p.exists(): errors.append(f'missing {rel}'); return ''
 txt=p.read_text(encoding='utf-8',errors='ignore')
 for token in tokens:
  if token not in txt: errors.append(f'{rel} missing {token}')
 return txt
services=need('services.html','website-images.js?v=20260812build254','explicitPhoto || mainImg || automaticFallback','configuredAddonPhoto || automaticAddonPhotos[0]?.url','Build 254 safety rule')
if 'preferredPhoto || mainImg || generalApprovedPhoto' in services: errors.append('services still lets automatic R2 photo outrank configured package image')
if services != need('services/index.html','website-images.js?v=20260812build254'): errors.append('services clean-route copy drifted')
landing=need('assets/landing-page.js','website-images.js?v=20260812build254','if (page?.local_hero_image_url) return page.local_hero_image_url','const automaticR2 =','explicitHero?.url')
local_pos=landing.find('if (page?.local_hero_image_url)')
auto_pos=landing.find('const automaticR2 =')
if local_pos<0 or auto_pos<0 or local_pos>auto_pos: errors.append('landing automatic R2 matching still outranks authored hero')
studio=need('admin-photo-studio.html','data-build254="photo-preservation-hotfix"','Existing site photos are protected.','Save explicit override','content-visibility:auto','scheduleGridRender','updateSelectedCardState')
if 'scrollIntoView(' in studio: errors.append('Photo Studio still forces synchronous scroll/layout')
show=re.search(r'function showEditor\(photo\)\{(.+?)\}\nfunction updateAltCount',studio,re.S)
if show and 'renderGrid()' in show.group(1): errors.append('Photo selection still rebuilds the full grid')
if studio != need('admin-photo-studio/index.html','data-build254="photo-preservation-hotfix"'): errors.append('Photo Studio clean-route copy drifted')
need('service-worker.js','rosie-app-v20260812build254','rosie-app-v20260812build253')
need('BUILD254_SUMMARY.md','Photo Preservation & Photo Studio Performance Hotfix','automatic R2 filename matching is fallback-only')
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 254')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 254')
for md in root.rglob('*.md'):
 if 'BUILD254_SYNC' not in md.read_text(encoding='utf-8',errors='ignore'): errors.append(f'Markdown missing Build254 sync: {md.relative_to(root)}')
if errors:
 print('Build 254 release check FAILED')
 print('\n'.join('- '+e for e in errors)); sys.exit(1)
print('Build 254 release check passed')
