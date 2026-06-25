#!/usr/bin/env python3
"""Build 214 guard: Supabase RLS containment and owner-task orchestration."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
errors=[]
required=['admin-security.html','admin-security/index.html','admin-today.html','admin-today/index.html','functions/api/admin/security_posture_report.js','functions/api/admin/attention_task_action.js','functions/api/admin/today_needs_attention_report.js','sql/2026-06-23_build214_security_task_orchestration.sql','data/build214_security_task_orchestration.json','data/security_posture_registry.json','docs/PRODUCTION_TEST_GUIDE.md']
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'Missing {rel}')
checks={
 'admin-security.html':['Database security posture','security_posture_report','Row-Level Security','data-visual-placeholder="security_posture"'],
 'admin-today.html':['Create owner task','My assigned work','Due date','create_manual','set_due_date'],
 'functions/api/admin/security_posture_report.js':['rosie_security_posture_report','manage_settings','browser_access_risk'],
 'functions/api/admin/attention_task_action.js':['create_manual','set_due_date','due_at','queueTaskNotification'],
 'functions/api/admin/today_needs_attention_report.js':['due_at','Overdue:','escalation_status'],
 'sql/2026-06-23_build214_security_task_orchestration.sql':['enable row level security','revoke all privileges on table','rosie_security_posture_report','owner_attention_tasks'],
 'SUPABASE_SCHEMA.sql':['Build 214 Supabase RLS and owner task orchestration schema sync','rosie_security_posture_report'],
 'DATABASE_STRUCTURE_CURRENT.md':['Build 214 schema sync','rosie_security_posture_report'],
 'AI_PROJECT_HANDOFF.md':['Build 214 central capability','admin-security.html'],
 'MASTER_VALUE_ROADMAP.md':['Build 214 — security containment and owner-task orchestration','Completed 20 steps','Next 20 value-added steps'],
 'docs/PRODUCTION_TEST_GUIDE.md':['Build 214 security and owner-task tests','Supabase RLS containment','Owner task due date and filters'],
 'scripts/sync_route_copies.py':['admin-security.html'],
 'service-worker.js':['build214','admin-security.html','build214_security_task_orchestration.json'],
 'assets/visual-placeholders.js':['security_posture'],
 'data/visual_placeholder_registry.json':['security_posture'],
}
for rel,needles in checks.items():
    p=ROOT/rel
    if not p.exists(): errors.append(f'Missing checked file {rel}');continue
    text=p.read_text(errors='ignore')
    for needle in needles:
        if needle not in text: errors.append(f'{rel} missing marker: {needle}')
try:
    data=json.loads((ROOT/'data/build214_security_task_orchestration.json').read_text())
    if data.get('build')!=214: errors.append('Build 214 JSON has wrong build number')
    if len(data.get('completed_20',[]))!=20: errors.append('Build 214 JSON completed_20 must be exactly 20')
    if len(data.get('next_20',[]))!=20: errors.append('Build 214 JSON next_20 must be exactly 20')
except Exception as exc: errors.append(f'Build 214 structured data invalid: {exc}')
for path in ROOT.glob('*.md'):
    if 'Build 214 documentation sync' not in path.read_text(errors='ignore'):
        errors.append(f'Root Markdown not Build 214 synchronized: {path.name}')
if errors:
    print('Build 214 security/task orchestration check failed:')
    for error in errors: print('-',error)
    raise SystemExit(1)
print('Build 214 security/task orchestration checks passed.')
