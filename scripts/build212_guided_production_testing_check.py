from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
errors=[]
required=[
 'admin-test-centre.html','admin-test-centre/index.html',
 'functions/api/_lib/production-test-playbook.js',
 'functions/api/admin/production_test_runs_list.js',
 'functions/api/admin/production_test_run_save.js',
 'sql/2026-06-20_build212_guided_production_testing.sql',
 'data/build212_guided_production_testing.json',
 'data/production_test_playbook_build212.json',
 'docs/PRODUCTION_TEST_GUIDE.md'
]
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'Missing {rel}')
checks={
 'admin-test-centre.html':['Guided Production Test Centre','production_test_runs_list','production_test_run_save','Use an internal test booking','data-visual-placeholder="production_test_centre"'],
 'admin-production.html':['Open Guided Test Centre','testCentreSummary','production_tests_failed'],
 'admin.html':['Open Guided Tests'],
 'functions/api/admin/production_test_runs_list.js':['PRODUCTION_TEST_PLAYBOOK_BUILD212','persistence_available','production_test_runs'],
 'functions/api/admin/production_test_run_save.js':['production_test_runs','Unknown production test','passed","failed","blocked","not_started'],
 'functions/api/admin/production_reliability_report.js':['production_test_runs?','production_tests_passed','Guided production tests need attention'],
 'functions/api/admin/today_needs_attention_report.js':['production_tests:','Guided production test blocked'],
 'scripts/sync_route_copies.py':['admin-test-centre.html'],
 'service-worker.js':['build212','admin-test-centre.html','production_test_playbook_build212.json'],
 'assets/visual-placeholders.js':['production_test_centre'],
 'data/visual_placeholder_registry.json':['production_test_centre'],
 'SUPABASE_SCHEMA.sql':['Build 212 guided production testing schema sync','production_test_runs'],
 'DATABASE_STRUCTURE_CURRENT.md':['Build 212 schema sync','production_test_runs'],
 'AI_PROJECT_HANDOFF.md':['Build 212 central capability: guided production testing','PRODUCTION_TEST_GUIDE.md'],
 'MASTER_VALUE_ROADMAP.md':['Build 212 — guided production testing completed','Completed 20 steps','Next 20 value-added steps'],
 'DOC_INDEX.md':['Build 212 documentation index note'],
}
for rel,needles in checks.items():
    path=ROOT/rel
    if not path.exists():
        errors.append(f'Missing checked file {rel}')
        continue
    text=path.read_text(errors='ignore')
    for needle in needles:
        if needle not in text: errors.append(f'{rel} missing marker: {needle}')
try:
    data=json.loads((ROOT/'data/build212_guided_production_testing.json').read_text())
    if data.get('build')!=212: errors.append('Build 212 JSON has wrong build number')
    if len(data.get('completed_20',[]))!=20: errors.append('Build 212 JSON completed_20 must be exactly 20')
    if len(data.get('next_20',[]))!=20: errors.append('Build 212 JSON next_20 must be exactly 20')
    plan=json.loads((ROOT/'data/production_test_playbook_build212.json').read_text())
    if plan.get('build')!=212 or len(plan.get('tests',[]))<8: errors.append('Build 212 test playbook is incomplete')
except Exception as exc:
    errors.append(f'Build 212 data invalid: {exc}')
for path in ROOT.glob('*.md'):
    if 'Build 212 documentation sync' not in path.read_text(errors='ignore'):
        errors.append(f'Root Markdown not synchronized: {path.name}')
if errors:
    print('Build 212 guided production testing check failed:')
    for error in errors: print('-',error)
    raise SystemExit(1)
print('Build 212 guided production testing checks passed.')
