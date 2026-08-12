from pathlib import Path
import re,sys
root=Path(__file__).resolve().parents[1]
errors=[]
page=(root/'admin-daip-gate-c.html').read_text(encoding='utf-8')
for req in ['<h1>DAIP Gate C Technical Review</h1>','background:rgba(12,18,31,.94)','/api/public/car_photos','CarPhotos/tillsonburg-interior-proof-before.webp','gc-photo-strip','for="technicalOwner"','for="independentReviewer"','data-visual-placeholder="daip_gate_c_technical_review"']:
    if req not in page: errors.append(f'admin-daip-gate-c.html missing {req}')
if 'var(--surface,#fff)' in page: errors.append('Gate C still contains white --surface fallback')
if '<label>Technical owner<label>' in page or '<label>Independent reviewer<label>' in page: errors.append('Gate C malformed nested labels remain')
api=(root/'functions/api/public/car_photos.js').read_text(encoding='utf-8')
if "prefix:'CarPhotos/'" not in api: errors.append('public CarPhotos endpoint no longer prefix-limited')
if 'DAIP_MEDIA_BUCKET' in api: errors.append('public CarPhotos endpoint must not query private DAIP media')
if (root/'admin-daip-gate-c/index.html').read_text(encoding='utf-8') != page: errors.append('clean Gate C route copy drifted')
if "rosie-app-v20260811build251" not in (root/'service-worker.js').read_text(encoding='utf-8'): errors.append('Build 251 service worker cache marker missing')
for md in root.rglob('*.md'):
    if 'BUILD251_SYNC' not in md.read_text(encoding='utf-8',errors='ignore'): errors.append(f'Markdown missing Build251 sync: {md.relative_to(root)}')
for rel,mark in [('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 251'),('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 251'),('DOC_INDEX.md','# Documentation Index — Build 251'),('STARTUP_GO_LIVE_BLOCKERS.md','## 43. Validate Gate C readability'),('BUILD251_SUMMARY.md','Build 251 — Gate C Readability')]:
    p=root/rel
    if not p.exists() or mark not in p.read_text(encoding='utf-8',errors='ignore'): errors.append(f'{rel} missing {mark}')
for html in root.rglob('*.html'):
    txt=html.read_text(encoding='utf-8',errors='ignore')
    if not re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex',txt,re.I):
        count=len(re.findall(r'<h1(?:\s|>)',txt,re.I))
        if count>1: errors.append(f'{html.relative_to(root)} has {count} H1s')
if errors:
    print('Build 251 release check FAILED'); print('\n'.join('- '+e for e in errors)); sys.exit(1)
print('Build 251 release check passed')
