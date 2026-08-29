#!/usr/bin/env python3
from pathlib import Path
import csv
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

required = [
    ROOT / 'docs/modular-app/01_MODULAR_APPLICATION_ARCHITECTURE.md',
    ROOT / 'docs/modular-app/02_BUILD263_IMPLEMENTATION_PLAN.md',
    ROOT / 'data/build263_app_modules.json',
    ROOT / 'data/build263_route_migration_matrix.csv',
    ROOT / 'data/build263_api_namespace_inventory.csv',
    ROOT / 'apps/customer/README.md',
    ROOT / 'apps/detailer/README.md',
    ROOT / 'apps/operations/README.md',
    ROOT / 'apps/admin/README.md',
    ROOT / 'assets/app-core/README.md',
]
for path in required:
    if not path.exists():
        errors.append(f'missing required Build 263 foundation file: {path.relative_to(ROOT)}')

registry_path = ROOT / 'data/build263_app_modules.json'
if registry_path.exists():
    try:
        registry = json.loads(registry_path.read_text(encoding='utf-8'))
        keys = [m.get('key') for m in registry.get('modules', [])]
        expected = ['customer', 'detailer', 'operations', 'admin']
        if keys != expected:
            errors.append(f'module registry keys/order mismatch: {keys!r}')
        if registry.get('runtime_enabled') is not False:
            errors.append('Build 263 foundation registry must remain runtime_enabled=false until shell runtime is implemented/tested')
        policy = registry.get('timer_policy') or {}
        if policy.get('default') != 'none':
            errors.append('timer policy must default to none')
        if policy.get('automatic_mutation_retry') is not False:
            errors.append('automatic mutation retry must remain disabled')
    except Exception as exc:
        errors.append(f'could not parse module registry: {exc}')

matrix_path = ROOT / 'data/build263_route_migration_matrix.csv'
if matrix_path.exists():
    with matrix_path.open(newline='', encoding='utf-8') as fh:
        rows = list(csv.DictReader(fh))
    owners = {'customer', 'detailer', 'operations', 'admin', 'platform_core'}
    if not rows:
        errors.append('route migration matrix is empty')
    bad = [r for r in rows if r.get('target_owner') not in owners]
    if bad:
        errors.append(f'route migration matrix has invalid owners: {bad[:3]}')
    current_html = {p.name for p in ROOT.glob('*.html')}
    matrix_html = {r.get('current_route') for r in rows}
    missing = sorted(current_html - matrix_html)
    extra = sorted(matrix_html - current_html)
    if missing:
        errors.append(f'route migration matrix missing current HTML routes: {missing[:10]}')
    if extra:
        errors.append(f'route migration matrix contains unknown HTML routes: {extra[:10]}')

for doc_name, phrase in [
    ('AI_PROJECT_HANDOFF.md', 'Build 263 Architecture Foundation'),
    ('MASTER_VALUE_ROADMAP.md', 'Build 263 Architecture Foundation'),
    ('DOC_INDEX.md', 'Build 263 modular application architecture'),
]:
    path = ROOT / doc_name
    if not path.exists() or phrase not in path.read_text(encoding='utf-8'):
        errors.append(f'{doc_name} is not synchronized to Build 263 foundation')

architecture = ROOT / 'docs/modular-app/01_MODULAR_APPLICATION_ARCHITECTURE.md'
if architecture.exists():
    text = architecture.read_text(encoding='utf-8')
    required_phrases = [
        'Customer App',
        'Detailer Mobile App',
        'Operations / Supervisor App',
        'Business Administration App',
        'no timer by default',
        'one refresh leader per browser',
        'frontend_visibility_is_not_authorization' if False else 'A hidden menu item is not authorization',
    ]
    for phrase in required_phrases:
        if phrase not in text:
            errors.append(f'architecture document missing required principle: {phrase}')

if errors:
    print('Build 263 modular foundation check: FAIL')
    for err in errors:
        print(f' - {err}')
    sys.exit(1)

print('Build 263 modular foundation check: PASS')
print(' - four module shells registered')
print(' - current top-level HTML routes assigned')
print(' - API inventory present')
print(' - CPU-safe timer/mutation policies preserved')
print(' - living documentation synchronized')
