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
studio=need('admin-photo-studio.html','data-build255="click-to-edit-photo-editor"','Edit / assign','Where should this image be used?','Choose the website location to update…','Use this image here','targetGroupLabel','ensureSelectedManaged','No website image has changed.','position:fixed','preventScroll:true')
if 'scrollIntoView(' in studio: errors.append('Photo Studio reintroduced forced scroll layout')
show=re.search(r'function showEditor\(photo\)\{(.+?)\}\nfunction updateAltCount',studio,re.S)
if show and 'renderGrid()' in show.group(1): errors.append('Photo selection rebuilds full photo grid')
if 'data-select-photo="${esc(p.r2_key)}"' not in studio: errors.append('photo cards are not direct click selectors')
if 'clearAssignmentChoice();updateAltCount()' not in studio: errors.append('changing selected photo does not clear stale target choice')
if 'This changes only that explicit website image location. No other photo assignments will be changed.' not in studio: errors.append('assignment confirmation safety wording missing')
if studio != need('admin-photo-studio/index.html','data-build255="click-to-edit-photo-editor"'): errors.append('Photo Studio clean-route copy drifted')
need('service-worker.js','rosie-app-v20260812build255','rosie-app-v20260812build254')
need('BUILD255_SUMMARY.md','Click-to-Edit Photo Studio Editor','No new SQL migration is required')
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 255')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 255')
# Build 254 preservation must still be present on public image resolvers.
need('services.html','explicitPhoto || mainImg || automaticFallback','configuredAddonPhoto || automaticAddonPhotos[0]?.url')
need('assets/landing-page.js','if (page?.local_hero_image_url) return page.local_hero_image_url','explicitHero?.url')
for md in root.rglob('*.md'):
 if 'BUILD255_SYNC' not in md.read_text(encoding='utf-8',errors='ignore'): errors.append(f'Markdown missing Build255 sync: {md.relative_to(root)}')
if errors:
 print('Build 255 release check FAILED')
 print('\n'.join('- '+e for e in errors)); sys.exit(1)
print('Build 255 release check passed')
