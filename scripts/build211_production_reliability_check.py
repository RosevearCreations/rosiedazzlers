from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
errors=[]
required=[
 'admin-production.html','admin-production/index.html',
 'functions/api/admin/production_reliability_report.js',
 'functions/api/admin/notification_provider_test.js',
 'functions/api/admin/final_balance_checkout_create.js',
 'functions/api/admin/storage_retention_sweep.js',
 'sql/2026-06-18_build211_production_reliability.sql',
 'data/build211_production_reliability.json',
 'data/production_reliability_registry.json'
]
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'Missing {rel}')
checks={
 'admin-production.html':['Production readiness','production_reliability_report','notification_provider_test','final_balance_checkout_create','storage_retention_sweep'],
 'admin.html':['productionReliabilityDiagnostics','production-reliability-card','loadProductionReliabilityDiagnostics'],
 'admin-today.html':['Today Needs Attention'],
 'functions/api/admin/today_needs_attention_report.js':['Notification provider setup','Storage retention review','Create payment link'],
 'functions/api/admin/production_reliability_report.js':['provider_readiness','payment_links_missing','retention_due'],
 'functions/api/admin/final_balance_checkout_create.js':['https://api.stripe.com/v1/checkout/sessions','final_balance_payment_request_id'],
 'functions/api/admin/storage_retention_sweep.js':['permanent_proof','legal_hold','dry_run'],
 'functions/api/admin/notification_provider_test.js':['production_provider_test','configuration_only'],
 'scripts/sync_route_copies.py':['admin-production.html'],
 'service-worker.js':['build211','admin-production.html','build211_production_reliability.json'],
 'SUPABASE_SCHEMA.sql':['Build 211 production reliability schema sync','notification_provider_test_logs','storage_retention_audit'],
 'DATABASE_STRUCTURE_CURRENT.md':['Build 211','production reliability'],
 'AI_PROJECT_HANDOFF.md':['Build 211 central capability','production reliability'],
 'MASTER_VALUE_ROADMAP.md':['Build 211','Completed 20 steps','Next 20 value-added steps']
}
for rel,needles in checks.items():
    p=ROOT/rel
    if not p.exists():
        errors.append(f'Missing checked file {rel}')
        continue
    txt=p.read_text(errors='ignore')
    for needle in needles:
        if needle not in txt: errors.append(f'{rel} missing marker: {needle}')
try:
    data=json.loads((ROOT/'data/build211_production_reliability.json').read_text())
    if data.get('build')!=211: errors.append('Build 211 JSON has wrong build number')
    if len(data.get('completed_20',[]))!=20: errors.append('Build 211 JSON completed_20 must be exactly 20')
    if len(data.get('next_20',[]))!=20: errors.append('Build 211 JSON next_20 must be exactly 20')
except Exception as exc:
    errors.append(f'Build 211 JSON invalid: {exc}')
for p in ROOT.glob('*.md'):
    if 'Build 211 documentation sync' not in p.read_text(errors='ignore'):
        errors.append(f'Root Markdown not synchronized: {p.name}')
if errors:
    print('Build 211 production reliability check failed:')
    for e in errors: print('-',e)
    raise SystemExit(1)
print('Build 211 production reliability checks passed.')
