from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def text(rel):
    p=ROOT/rel
    if not p.exists():
        errors.append(f'missing {rel}')
        return ''
    return p.read_text(encoding='utf-8',errors='ignore')

admin_list=text('functions/api/admin/photo_library_list.js')
if 'listApprovedR2Images' in admin_list: errors.append('ordinary photo_library_list must not scan R2')
for token in ['scan_mode','managed_library_only','r2_scan_per_load:false','loadMediaLibraryRows','loadAssignmentRows']:
    if token not in admin_list: errors.append(f'photo_library_list missing {token}')

public_lib=text('functions/api/_lib/public-website-images.js')
if 'listApprovedR2Images' in public_lib: errors.append('public website image manifest must not scan R2')
for token in ['loadPublicMediaLibraryRows','loadPublicAssignmentRows',"source:'managed_library'",'r2_scan_per_request:false','prefixes:{packages:[]']:
    if token not in public_lib: errors.append(f'public manifest missing {token}')

photo_lib=text('functions/api/_lib/photo-library.js')
for token in ['maxPerPrefix=250','maxTotal=1200','includeMetadata=false','offset+=100',"Prefer:'return=minimal'",'scanned:Number(live.images?.length||0)']:
    if token not in photo_lib: errors.append(f'photo library resource guard missing {token}')
if "return {...live, db_ready:true" in photo_lib: errors.append('sync must not return full live R2 image inventory')

public_endpoint=text('functions/api/public_website_images.js')
for token in ['compactJson','s-maxage=30','build:257']:
    if token not in public_endpoint: errors.append(f'public endpoint missing {token}')

gate=text('admin-daip-gate-c.html')
if "(payload.images||[]).filter" not in gate or "startsWith('CarPhotos/')" not in gate:
    errors.append('Gate C must support compact Build 257 manifest without duplicated prefixes')

studio=text('admin-photo-studio.html')
for token in ['Loading managed photo library','Use Sync only when you have added or removed files directly in R2','Build 257 keeps ordinary editor loads database-only']:
    if token not in studio: errors.append(f'Photo Studio missing Build 257 user guidance: {token}')

sw=text('service-worker.js')
if 'rosie-app-v20260813build257' not in sw: errors.append('service worker cache not bumped to Build 257')

summary=text('BUILD257_SUMMARY.md')
if 'No SQL migration is required for Build 257' not in summary: errors.append('Build 257 summary must state migration status')

md=list(ROOT.rglob('*.md'))
missing=[str(p.relative_to(ROOT)) for p in md if 'BUILD257_SYNC:' not in p.read_text(encoding='utf-8',errors='ignore')]
if missing: errors.append(f'{len(missing)} markdown files missing BUILD257_SYNC marker; first: {missing[:5]}')

if errors:
    print('Build 257 resource hotfix check FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print(f'Build 257 resource hotfix check passed ({len(md)} Markdown files synchronized).')
