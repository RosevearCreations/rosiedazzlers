from pathlib import Path
import json, re, sys
root=Path(__file__).resolve().parents[1]
errors=[]
def need(rel,*tokens):
    p=root/rel
    if not p.exists():
        errors.append(f'missing {rel}'); return ''
    txt=p.read_text(encoding='utf-8',errors='ignore')
    for token in tokens:
        if token not in txt: errors.append(f'{rel} missing {token}')
    return txt
studio=need('admin-photo-studio.html','data-build256="assignment-visibility-before-after"','Assigned to:','✓ assigned','— this photo','— assigned','Before & After pairs','before_after_pair','counterpartTargetKey','The public Before & After set appears only when both sides are assigned.')
if studio != need('admin-photo-studio/index.html','data-build256="assignment-visibility-before-after"'):
    errors.append('Photo Studio clean-route copy drifted')
if 'scrollIntoView(' in studio:
    errors.append('Photo Studio reintroduced forced scroll layout')
# Ensure the only assignment mutation remains explicit button flow.
if "$('#saveAssignment').addEventListener('click'" not in studio:
    errors.append('explicit save assignment button flow missing')

target_path=root/'data/build253_photo_targets.json'
try:
    data=json.loads(target_path.read_text(encoding='utf-8'))
    targets=data.get('targets',[])
    heroes={t.get('component_key') for t in targets if t.get('target_type')=='landing_hero'}
    pairs=[t for t in targets if t.get('target_type')=='before_after_pair']
    if data.get('build') != 253 or data.get('revision') != 256: errors.append('photo target registry must retain Build 253 identity with Build 256 revision')
    if len(pairs) != len(heroes)*6: errors.append(f'expected 6 Before/After slots per landing page; got {len(pairs)} for {len(heroes)} pages')
    keys={t.get('target_key') for t in pairs}
    for slug in heroes:
        for n in range(1,4):
            for side in ('before','after'):
                key=f'landing:{slug}:before-after:{n}:{side}'
                if key not in keys: errors.append(f'missing pair target {key}')
except Exception as exc:
    errors.append(f'photo target registry invalid: {exc}')

website=need('assets/website-images.js','export function landingBeforeAfterPairs','if(!before?.url || !after?.url) continue;','hydrateBeforeAfterSets','data-photo-managed-before-after="true"')
mirror=need('functions/api/assets/website-images.js','export function landingBeforeAfterPairs')
if website != mirror: errors.append('website-images function mirror drifted')
need('assets/landing-page.js','landingBeforeAfterPairs','beforeAfterMarkup','data-photo-managed-before-after="true"','website-images.js?v=20260812build256')
need('assets/site.css','Build 256 — owner-assigned Before & After pairs','.before-after-pair','.before-after-label')
need('ceramic-coating/index.html','website-images.js?v=20260812build256')
need('services.html','website-images.js?v=20260812build256','explicitPhoto || mainImg || automaticFallback')
need('service-worker.js','rosie-app-v20260812build256','rosie-app-v20260812build255')
need('BUILD256_SUMMARY.md','Photo Assignment Visibility & Before/After Pairing','No new SQL migration is required')
need('AI_PROJECT_HANDOFF.md','# CURRENT LIVING AUTHORITY 1 OF 2 — Build 256')
need('MASTER_VALUE_ROADMAP.md','# CURRENT LIVING AUTHORITY 2 OF 2 — Build 256')
for md in root.rglob('*.md'):
    if 'BUILD256_SYNC' not in md.read_text(encoding='utf-8',errors='ignore'):
        errors.append(f'Markdown missing Build256 sync: {md.relative_to(root)}')
if errors:
    print('Build 256 release check FAILED')
    print('\n'.join('- '+e for e in errors)); sys.exit(1)
print('Build 256 release check passed')
