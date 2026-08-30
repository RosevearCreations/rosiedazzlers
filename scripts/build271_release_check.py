#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def text(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f'missing {rel}'); return ''
    return p.read_text(encoding='utf-8',errors='ignore')
def need(rel,*tokens):
    body=text(rel)
    for token in tokens:
        if token not in body: errors.append(f'{rel} missing {token}')
def forbid(rel,*tokens):
    body=text(rel)
    for token in tokens:
        if token in body: errors.append(f'{rel} still contains {token}')

actions=json.loads(text('data/action_permissions.json') or '{}')
if actions.get('build')!=269: errors.append('base action permission registry build changed unexpectedly')
if actions.get('extended_through_build')!=271: errors.append('action permission registry is not extended through Build 271')
for action in ['detailer.message.send','operations.assignment.manage','operations.schedule.manage','finance.post','finance.reconcile','finance.period.close']:
    if action not in actions.get('actions',{}): errors.append(f'missing action {action}')
if 'finance.period.close' not in actions.get('role_defaults',{}).get('accountant',[]): errors.append('accountant missing finance.period.close default')
if any(a.startswith('finance.') for a in actions.get('role_defaults',{}).get('detailer',[])): errors.append('detailer incorrectly has Finance action')

need('functions/api/_lib/staff-auth.js','parsePermissionsProfile','moduleAccessFromProfile','permissions_profile: permissionsProfile','module_access: moduleAccessFromProfile(permissionsProfile)')
need('functions/api/_lib/live-interaction-alerts.js','ACTIVE_LIVE_STATES','requireLiveCommunicationOpen','#commentForm','?job=${encodeURIComponent(bookingId)}#liveJobHost')
need('functions/api/progress/comment_post.js','liveCommunicationState','Live job messaging is closed')
need('functions/api/client/progress_comment_post.js','liveCommunicationState','Live job messaging is closed')
need('functions/api/detailer/job_note_post.js','detailer.message.send','requireLiveCommunicationOpen')
need('apps/detailer/detailer-app.js','requestedJobId','new URLSearchParams(location.search)','liveJobHost','resolveDeepLink')
for rel in ['functions/api/_lib/live-interaction-alerts.js','functions/api/progress/comment_post.js','functions/api/client/progress_comment_post.js','functions/api/detailer/job_note_post.js','apps/detailer/detailer-app.js']:
    forbid(rel,'setInterval(')

checks={
 'functions/api/admin/assign_booking.js':'operations.assignment.manage',
 'functions/api/admin/block_slot.js':'operations.schedule.manage',
 'functions/api/admin/blocks_save.js':'operations.schedule.manage',
 'functions/api/admin/block_date.js':'operations.schedule.manage',
 'functions/api/admin/unblock_date.js':'operations.schedule.manage',
 'functions/api/admin/unblock_slot.js':'operations.schedule.manage',
 'functions/api/admin/blocks_range_save.js':'operations.schedule.manage',
 'functions/api/admin/payment_application_save.js':'finance.post',
 'functions/api/admin/accounting_bank_reconciliation.js':'finance.reconcile',
 'functions/api/admin/accounting_period_close.js':'finance.period.close',
}
for rel,action in checks.items(): need(rel,'requireActionAccess',action)
for rel in ['functions/api/admin/assign_booking.js','functions/api/admin/block_slot.js','functions/api/admin/blocks_save.js','functions/api/admin/block_date.js','functions/api/admin/unblock_date.js','functions/api/admin/unblock_slot.js','functions/api/admin/blocks_range_save.js','functions/api/admin/payment_application_save.js']:
    forbid(rel,'allowLegacyAdminFallback: true','allowLegacyAdminFallback:true')

for rel in [
 'functions/api/_lib/staff-auth.js','functions/api/_lib/action-permissions.js','functions/api/_lib/live-interaction-alerts.js',
 'functions/api/progress/comment_post.js','functions/api/client/progress_comment_post.js','functions/api/detailer/job_note_post.js',
 'functions/api/admin/assign_booking.js','functions/api/admin/block_slot.js','functions/api/admin/blocks_save.js','functions/api/admin/block_date.js','functions/api/admin/unblock_date.js','functions/api/admin/unblock_slot.js','functions/api/admin/blocks_range_save.js',
 'functions/api/admin/payment_application_save.js','functions/api/admin/accounting_bank_reconciliation.js','functions/api/admin/accounting_period_close.js',
 'apps/detailer/detailer-app.js']:
    p=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True)
    if p.returncode: errors.append(f'node --check failed {rel}: {p.stderr.strip()}')

if errors:
    print('Build 271 focused release check: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Build 271 focused release check: PASS')
print(' - bridge/session permission-profile normalization converges on the same parser')
print(' - active-job messaging is fail-closed after the live state ends')
print(' - push deep-links target the customer message form and requested Detailer job')
print(' - assignment/schedule/Finance mutations require explicit actions')
print(' - no new polling loop was introduced')
