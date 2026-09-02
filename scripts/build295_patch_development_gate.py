from pathlib import Path

path = Path('.github/workflows/development-source-gate.yml')
text = path.read_text(encoding='utf-8')

if 'Run current Build 295 focused guard' in text:
    print('Build 295 cumulative Development gate already patched.')
    raise SystemExit(0)


def once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    text = text.replace(old, new, 1)

once(
    '      - name: Check Development smoke helper syntax\n        run: |\n',
    '      - name: Check Build 295 customer account source authority syntax\n        run: |\n          python -m py_compile scripts/build295_release_check.py\n          bash -n scripts/build295_http_smoke.sh\n          node --check functions/api/client/profile_update.js\n          node --check functions/api/client/vehicles_save.js\n\n      - name: Check Development smoke helper syntax\n        run: |\n',
    'Build 295 syntax step',
)
once(
    '          bash -n scripts/build294_http_smoke.sh\n\n      - name: Check retained vehicle catalogue resilience',
    '          bash -n scripts/build294_http_smoke.sh\n          bash -n scripts/build295_http_smoke.sh\n\n      - name: Check retained vehicle catalogue resilience',
    'Build 295 smoke helper syntax',
)
once(
    '      - name: Run current Build 294 focused guard\n        run: python scripts/build294_release_check.py\n',
    '      - name: Run current Build 294 focused guard\n        run: python scripts/build294_release_check.py\n      - name: Run current Build 295 focused guard\n        run: python scripts/build295_release_check.py\n',
    'Build 295 focused guard',
)
once(
    '            echo "- Build 294 customer maintenance/auto-schedule authority closure syntax: PASS"\n',
    '            echo "- Build 294 customer maintenance/auto-schedule authority closure syntax: PASS"\n            echo "- Build 295 customer account static-source authority cleanup: PASS"\n',
    'Build 295 summary line',
)
text = text.replace('Build 284-294 HTTP smoke helper syntax', 'Build 284-295 HTTP smoke helper syntax', 1)
text = text.replace('Retained Builds 271-294 focused guards', 'Retained Builds 271-295 focused guards', 1)

for token in [
    'Check Build 295 customer account source authority syntax',
    'bash -n scripts/build295_http_smoke.sh',
    'Run current Build 295 focused guard',
    'python scripts/build295_release_check.py',
    'Build 295 customer account static-source authority cleanup: PASS',
]:
    if token not in text:
        raise SystemExit(f'Build 295 gate token missing after patch: {token}')

path.write_text(text, encoding='utf-8')
print('Build 295 cumulative Development gate patch: PASS')
