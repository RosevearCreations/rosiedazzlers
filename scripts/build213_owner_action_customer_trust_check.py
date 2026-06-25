#!/usr/bin/env python3
"""Build 213 guard: owner action controls and customer-trust workflow records."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

required = [
    'admin-today.html', 'admin-today/index.html',
    'admin-progress.html', 'admin-progress/index.html',
    'progress.html', 'progress/index.html',
    'functions/api/admin/attention_task_action.js',
    'functions/api/admin/live_interaction_audit_export.js',
    'functions/api/admin/today_needs_attention_report.js',
    'functions/api/progress/recommendation_decide.js',
    'functions/api/progress/summary_acknowledge.js',
    'functions/api/progress/view.js',
    'functions/api/admin/job_summary_generate.js',
    'sql/2026-06-22_build213_owner_action_customer_trust.sql',
    'data/build213_owner_action_customer_trust.json',
    'docs/PRODUCTION_TEST_GUIDE.md',
]
for rel in required:
    if not (ROOT / rel).exists():
        errors.append(f'Missing {rel}')

checks = {
    'admin-today.html': ['Assign me', 'Snooze 1 day', 'updateTask(', 'attention_task_action', 'owner_attention'],
    'admin-progress.html': ['Export interaction audit', 'live_interaction_audit_export'],
    'progress.html': ['Acknowledge summary', 'summary_acknowledge', 'acknowledgement_confirmed', 'paymentLinksBox'],
    'functions/api/admin/attention_task_action.js': ['assign_to_me', 'snooze_tomorrow', 'snooze_week', 'owner_attention_tasks', 'live_interaction_audit_events'],
    'functions/api/admin/live_interaction_audit_export.js': ['toCsv(rows)', 'live_interaction_audit_events', 'job_updates', 'job_media'],
    'functions/api/admin/today_needs_attention_report.js': ['attention_tasks:', 'shouldHideByTask', 'latestManualTasks', 'attention_task'],
    'functions/api/progress/recommendation_decide.js': ['acknowledgement_name', 'acknowledgement_confirmed', 'recommendation_price_acknowledgements', 'payment_link_ready'],
    'functions/api/progress/summary_acknowledge.js': ['customer_acknowledged_at', 'completed_job_summaries', 'completed_summary_acknowledgement_v1'],
    'functions/api/progress/view.js': ['payment_links', 'final_balance_payment_requests', 'customer_acknowledgement_name'],
    'functions/api/admin/job_summary_generate.js': ['completed_job_summary_revisions', 'revision_number', 'customer_acknowledged_at'],
    'sql/2026-06-22_build213_owner_action_customer_trust.sql': ['owner_attention_tasks', 'live_interaction_audit_events', 'recommendation_price_acknowledgements', 'completed_job_summary_revisions'],
    'SUPABASE_SCHEMA.sql': ['Build 213 owner action and customer trust schema sync', 'owner_attention_tasks', 'completed_job_summary_revisions'],
    'DATABASE_STRUCTURE_CURRENT.md': ['Build 213 schema sync', 'owner_attention_tasks', 'recommendation_price_acknowledgements'],
    'AI_PROJECT_HANDOFF.md': ['Build 213 central capability', 'owner_attention_tasks', 'customer acknowledgement'],
    'MASTER_VALUE_ROADMAP.md': ['Build 213 — owner action control', 'Completed 20-step', 'Next 20 value-added steps'],
    'docs/PRODUCTION_TEST_GUIDE.md': ['Build 213 owner-action and customer-trust tests', 'Today Needs Attention owner actions', 'Completed-job summary acknowledgement'],
    'service-worker.js': ['build213', 'build213_owner_action_customer_trust.json'],
    'data/visual_placeholder_registry.json': ['owner_attention', 'customer_acknowledgement'],
    'assets/visual-placeholders.js': ['owner_attention', 'customer_acknowledgement'],
}
for rel, needles in checks.items():
    p = ROOT / rel
    if not p.exists():
        errors.append(f'Missing checked file {rel}')
        continue
    text = p.read_text(encoding='utf-8', errors='ignore')
    for needle in needles:
        if needle not in text:
            errors.append(f'{rel} missing marker: {needle}')

try:
    data = json.loads((ROOT / 'data/build213_owner_action_customer_trust.json').read_text(encoding='utf-8'))
    if data.get('build') != 213:
        errors.append('Build 213 structured record has wrong build number')
    if data.get('primary_migration') != 'sql/2026-06-22_build213_owner_action_customer_trust.sql':
        errors.append('Build 213 structured record has wrong migration')
except Exception as exc:
    errors.append(f'Build 213 structured record invalid: {exc}')

for path in ROOT.glob('*.md'):
    text = path.read_text(encoding='utf-8', errors='ignore')
    if 'Build 213 documentation sync' not in text and path.name not in {'AI_PROJECT_HANDOFF.md', 'MASTER_VALUE_ROADMAP.md', 'DATABASE_STRUCTURE_CURRENT.md'}:
        errors.append(f'Root Markdown not Build 213 synchronized: {path.name}')

if errors:
    print('Build 213 owner action/customer trust check failed:')
    for err in errors:
        print('-', err)
    raise SystemExit(1)
print('Build 213 owner action/customer trust checks passed.')
