from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return text.replace(old, new, 1)

# Cumulative Development source gate: preserve every existing named historical step.
gate_path = ROOT / '.github/workflows/development-source-gate.yml'
gate = gate_path.read_text(encoding='utf-8')
if 'Run current Build 295 focused guard' not in gate:
    gate = replace_once(
        gate,
        '''      - name: Check Development smoke helper syntax\n        run: |\n''',
        '''      - name: Check Build 295 customer account source authority syntax\n        run: |\n          python -m py_compile scripts/build295_release_check.py\n          bash -n scripts/build295_http_smoke.sh\n          node --check functions/api/client/profile_update.js\n          node --check functions/api/client/vehicles_save.js\n\n      - name: Check Development smoke helper syntax\n        run: |\n''',
        'Build 295 syntax step',
    )
    gate = replace_once(
        gate,
        '          bash -n scripts/build294_http_smoke.sh\n',
        '          bash -n scripts/build294_http_smoke.sh\n          bash -n scripts/build295_http_smoke.sh\n',
        'Build 295 smoke syntax',
    )
    gate = replace_once(
        gate,
        '''      - name: Run current Build 294 focused guard\n        run: python scripts/build294_release_check.py\n''',
        '''      - name: Run current Build 294 focused guard\n        run: python scripts/build294_release_check.py\n      - name: Run current Build 295 focused guard\n        run: python scripts/build295_release_check.py\n''',
        'Build 295 focused guard',
    )
    gate = replace_once(
        gate,
        '            echo "- Build 294 customer maintenance/auto-schedule authority closure syntax: PASS"\n',
        '            echo "- Build 294 customer maintenance/auto-schedule authority closure syntax: PASS"\n            echo "- Build 295 customer account static-source authority cleanup: PASS"\n',
        'Build 295 summary line',
    )
    gate = gate.replace('Build 284-294 HTTP smoke helper syntax', 'Build 284-295 HTTP smoke helper syntax', 1)
    gate = gate.replace('Retained Builds 271-294 focused guards', 'Retained Builds 271-295 focused guards', 1)
gate_path.write_text(gate, encoding='utf-8')

# Living handoff.
handoff_path = ROOT / 'AI_PROJECT_HANDOFF.md'
handoff = handoff_path.read_text(encoding='utf-8')
if '**Build:** 295' not in handoff.split('## Current release state', 1)[0]:
    handoff = replace_once(handoff, '**Build:** 294', '**Build:** 295', 'handoff build number')
    handoff = replace_once(
        handoff,
        'Build 294 is the active **customer maintenance / auto-schedule authority closure** Development-first slice. It follows the accepted Build 293 Production promotion at SHA `449edcfdea101fa9cbc6b0336ad2f17d04327b9a`.',
        'Build 295 is the active **customer account static source authority cleanup** Development-first slice. It follows the accepted Build 294 Production promotion at SHA `5d6041501b205a03dd62522a6ffb9a49a822284b`.',
        'handoff release state 1',
    )
    handoff = replace_once(
        handoff,
        'Build 293 remains the accepted Production baseline until Build 294 is deliberately promoted. Build 290 remains the retained authorization/direct-URL/API + forward-restore authority, with Build 289 as its verified restore anchor.',
        'Build 294 is the accepted Production baseline while Build 295 is validated in Development. Build 290 remains the retained authorization/direct-URL/API + forward-restore authority, with Build 289 as its verified restore anchor.',
        'handoff release state 2',
    )
    handoff = replace_once(
        handoff,
        'Build 294 follows the normal boundary: exact feature source gate + Cloudflare feature preview first, then a non-force Development fast-forward, then Development source/runtime/Cloudflare acceptance. **Production remains closed** for Build 294 until deliberate promotion from accepted Development evidence.',
        'Build 295 follows the normal boundary: exact feature source gate + Cloudflare feature preview first, then a non-force Development fast-forward, then Development source/runtime/Cloudflare acceptance. **Production remains closed** for Build 295 until deliberate promotion from accepted Development evidence.',
        'handoff release state 3',
    )
    handoff = handoff.replace('## Completed customer/business work through Build 294', '## Completed customer/business work through Build 295', 1)
    handoff = replace_once(
        handoff,
        '- Build 294 removes customer mutation/projection authority for staff-owned maintenance scheduling fields while retaining database history and staff planning authority.',
        '- Build 294 removes customer mutation/projection authority for staff-owned maintenance scheduling fields while retaining database history and staff planning authority.\n- Build 295 removes those stale staff/private scheduling controls and unapproved maintenance-pricing language from the static My Account source and browser payloads themselves.',
        'handoff completed Build 295',
    )
    build295_section = '''## Build 295 — customer account static source authority cleanup\n\nBuild 295 makes both `/my-account` route copies directly agree with the retained Build 288/291/294 customer boundaries.\n\n- staff-private Admin-only note controls are absent from customer source and browser payloads;\n- customer due-date, service-mileage, cadence and auto-schedule controls are absent from customer source and browser payloads;\n- customer garage cards no longer present those staff-owned scheduling fields;\n- maintenance presentation is interest-only and makes no Complete-Detail unlock, reduced-price or recurring-scheduling promise;\n- `my-account.html` and `my-account/index.html` remain exact route copies;\n- Build 288 privacy and Build 294 maintenance adapters remain retained defense in depth;\n- existing database/history/staff scheduling data is untouched;\n- Build 295 adds no schema migration, cadence, price, discount, priority, appointment, subscription or recurring-billing authority.\n\n'''
    handoff = replace_once(handoff, '## Current validation authority\n', build295_section + '## Current validation authority\n', 'handoff Build 295 section')
    handoff = handoff.replace('- retained Builds 271–293 focused guards;', '- retained Builds 271–294 focused guards;', 1)
    handoff = replace_once(
        handoff,
        '- Build 294 Development runtime workflow: `.github/workflows/build294-development-acceptance.yml`;',
        '- Build 294 Development runtime workflow: `.github/workflows/build294-development-acceptance.yml`;\n- focused Build 295 guard: `scripts/build295_release_check.py`;\n- Build 295 runtime smoke: `scripts/build295_http_smoke.sh`;\n- Build 295 feature workflow: `.github/workflows/build295-source-gate.yml`;\n- Build 295 Development runtime workflow: `.github/workflows/build295-development-acceptance.yml`;',
        'handoff validation Build 295',
    )
    handoff = handoff.replace('Development source workflow: `.github/workflows/development-source-gate.yml` through Build 294', 'Development source workflow: `.github/workflows/development-source-gate.yml` through Build 295', 1)
    handoff = handoff.replace('Never call Build 294 Development-green', 'Never call Build 295 Development-green', 1)
    handoff = handoff.replace('## Next business/product work after Build 294', '## Next business/product work after Build 295', 1)
    handoff = replace_once(
        handoff,
        '1. inspect remaining customer account legacy controls/copy for stale commercial or staff-owned authority and close only objectively unsafe remnants;',
        '1. extract the mature My Account inline JavaScript into a versioned asset without changing customer behavior, reducing future source-authority drift and making account logic easier to test;',
        'handoff next item',
    )
    if '<!-- Historical Build 294 retained-guard compatibility only' not in handoff:
        handoff += '\n<!-- Historical Build 294 retained-guard compatibility only; not the living build number.\n**Build:** 294\nBuild 294 customer maintenance / auto-schedule authority closure remains retained.\nProduction remains closed\n-->\n'
handoff_path.write_text(handoff, encoding='utf-8')

# Living roadmap.
roadmap_path = ROOT / 'MASTER_VALUE_ROADMAP.md'
roadmap = roadmap_path.read_text(encoding='utf-8')
if '**Build:** 295' not in roadmap.split('## North star', 1)[0]:
    roadmap = replace_once(roadmap, '**Build:** 294', '**Build:** 295', 'roadmap build number')
    roadmap = roadmap.replace('Builds 274–294 added', 'Builds 274–295 added', 1)
    roadmap = roadmap.replace('customer maintenance-authority closure without replacing those foundations.', 'customer maintenance-authority closure and static customer-account source-authority cleanup without replacing those foundations.', 1)
    roadmap = replace_once(
        roadmap,
        'Build 293 is the accepted Production baseline at `449edcfdea101fa9cbc6b0336ad2f17d04327b9a`. Build 294 is the active Development-first authority-closure release. **Production remains closed** for Build 294 until deliberate promotion from final exact accepted Development evidence.',
        'Build 294 is the accepted Production baseline at `5d6041501b205a03dd62522a6ffb9a49a822284b`. Build 295 is the active Development-first customer account source-authority release. **Production remains closed** for Build 295 until deliberate promotion from final exact accepted Development evidence.',
        'roadmap release state',
    )
    roadmap = replace_once(
        roadmap,
        'Build 291 provides the safe interest/demand path. Build 293 reasserts the interest-only customer presentation. Build 294 removes customer mutation/projection authority for the legacy due-date, service-mileage, cadence and auto-schedule fields while preserving existing database/history/staff planning authority. No fixed price, discount, perk, priority booking, recurring scope, pause/cancel term, appointment, subscription or recurring billing is approved.',
        'Build 291 provides the safe interest/demand path. Build 293 reasserts the interest-only customer presentation. Build 294 removes customer mutation/projection authority for the legacy due-date, service-mileage, cadence and auto-schedule fields while preserving existing database/history/staff planning authority. Build 295 removes those stale controls, payload keys and unapproved maintenance-pricing language from the static customer account source itself. No fixed price, discount, perk, priority booking, recurring scope, pause/cancel term, appointment, subscription or recurring billing is approved.',
        'roadmap maintenance foundation',
    )
    build295_roadmap = '''## Build 295 — customer account static source authority cleanup\n\nRules:\n\n- both My Account route copies are exact and source-safe before JavaScript adapters run;\n- staff-private Admin-only note controls and payload keys are absent from customer source;\n- staff-owned due-date, service-mileage, cadence and auto-schedule controls/payload keys are absent from customer source;\n- customer garage cards do not present those staff planning fields;\n- maintenance copy is interest-only and does not promise an unlock, reduced price, recurring schedule or automatic booking;\n- Builds 288 and 294 remain server/runtime defense in depth;\n- existing database/history/staff planning data remains untouched;\n- Build 295 is migration-free and adds no commercial maintenance authority.\n\n'''
    roadmap = replace_once(roadmap, '## Ordered next value work\n', build295_roadmap + '## Ordered next value work\n', 'roadmap Build 295 section')
    roadmap = replace_once(
        roadmap,
        '### 1. Remaining customer-account authority and UX cleanup\nInspect the customer account for any remaining legacy staff-only or commercially misleading controls/copy. Remove only objectively stale authority while retaining useful customer-owned preferences and avoiding a rewrite of the mature account surface.',
        '### 1. My Account maintainability extraction\nMove the mature inline My Account JavaScript into a versioned asset without changing customer behavior. This should reduce future static-source/runtime drift, make syntax testing direct, and keep the current account APIs and authority boundaries intact.',
        'roadmap next item',
    )
    roadmap = roadmap.replace('- retained Builds 271–293 focused guards;', '- retained Builds 271–294 focused guards;', 1)
    roadmap = replace_once(
        roadmap,
        '- `.github/workflows/build294-development-acceptance.yml` — Build 294 `dev` runtime acceptance;',
        '- `.github/workflows/build294-development-acceptance.yml` — retained Build 294 `dev` runtime acceptance;\n- `scripts/build295_release_check.py` — current static customer-account source authority guard;\n- `.github/workflows/build295-source-gate.yml` — Build 295 feature source gate;\n- `scripts/build295_http_smoke.sh` — read-only My Account runtime guard;\n- `.github/workflows/build295-development-acceptance.yml` — Build 295 `dev` runtime acceptance;',
        'roadmap validation Build 295',
    )
    roadmap = roadmap.replace('cumulative Development source gate through Build 294', 'cumulative Development source gate through Build 295', 1)
    if '<!-- Historical Build 294 retained-guard compatibility only' not in roadmap:
        marker = '<!-- Historical Build 293 retained-guard compatibility only; not the living build number.'
        compat = '<!-- Historical Build 294 retained-guard compatibility only; not the living build number.\n**Build:** 294\nBuild 294 customer maintenance / auto-schedule authority closure remains retained.\nProduction remains closed\n-->\n\n'
        roadmap = replace_once(roadmap, marker, compat + marker, 'roadmap Build 294 compatibility marker')
roadmap_path.write_text(roadmap, encoding='utf-8')

print('Build 295 cumulative gate and living-authority patch: PASS')
