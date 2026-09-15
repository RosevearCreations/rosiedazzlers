#!/usr/bin/env python3
"""Build 404 fail-closed authority for recovery and weak-connection hardening."""
from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(p):
    q=ROOT/p
    if not q.exists(): errors.append(f'missing {p}'); return ''
    return q.read_text(encoding='utf-8',errors='ignore')
def req(text, needles, label):
    for n in needles:
        if n not in text: errors.append(f'{label} missing {n!r}')
def pair(text,label):
    c=re.search(r'\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is the active bounded release\.',text)
    n=re.search(r'\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is next only after',text)
    if not c or not n: errors.append(f'{label} cannot resolve current/next'); return None
    return int(c.group(1)),int(n.group(1))
asset=read('assets/reliability-recovery-v404.js')
policies=read('assets/site-policies.js')
booking=read('assets/booking-recovery.js')
booking_check=read('scripts/booking_recovery_failure_handling_check.py')
contract=read('BUILD404_ERROR_RECOVERY_WEAK_CONNECTION_RELIABILITY.md')
queue=read('AUTONOMOUS_RELEASE_QUEUE.md')
handoff=read('AI_PROJECT_HANDOFF.md')
roadmap=read('FORWARD_BUILD_ROADMAP_396_405.md')
req(asset,["SAFE_READ_METHODS = new Set(['GET', 'HEAD'])",'navigator.onLine','sessionStorage','SENSITIVE_NAME','stale_review_required: true','withSubmitLock','createUploadState','Retry upload','labelPartialResults','nothing has been accepted yet','Mutations are never queued or replayed automatically'], 'Build 404 runtime')
if 'localStorage' in asset: errors.append('Build 404 protected drafts must not use localStorage')
if 'setInterval(' in asset: errors.append('Build 404 must not add permanent polling')
for m in ['POST','PATCH','PUT','DELETE']:
    if f"SAFE_READ_METHODS = new Set(['GET', 'HEAD', '{m}'" in asset: errors.append('safeRead includes mutation method')
req(policies,['reliability-recovery-v404.js?v=20260915build404','RDReliability404?.installConnectionUX','canonical server paths remain authoritative'], 'site bootstrap')
req(booking,['const DRAFT_KEY = "rd_booking_draft_v380"','sessionStorage','client_request_id','/api/checkout_recovery'], 'retained booking recovery')
req(booking_check,['canonical checkout remains authoritative','no localStorage, recurring polling, direct booking mutation, or schema migration'], 'retained Build 380 checker')
req(contract,['GET` and `HEAD','stale_review_required: true','No local/offline artifact can masquerade as accepted server state','No sensitive/payment-secret persistence','Production deployment/runtime/business acceptance must independently prove that exact SHA'], 'Build 404 contract')
q=pair(queue,'release queue'); h=pair(handoff,'handoff')
if q!=(404,405): errors.append(f'release queue must be living 404/405, got {q}')
if h!=(404,405): errors.append(f'handoff must be living 404/405, got {h}')
req(roadmap,['### Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening','retry/recovery cannot create duplicate business events','no local/offline artifact can masquerade as accepted server state','no sensitive/payment-secret persistence'], 'roadmap')
for p in ROOT.rglob('*.sql'):
    if re.search(r'(?:^|[^0-9])404(?:[^0-9]|$)',p.name): errors.append(f'Build 404 must remain schema-neutral: {p.relative_to(ROOT)}')
if errors:
    print('BUILD 404 ERROR RECOVERY / WEAK CONNECTION / RELIABILITY: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('BUILD 404 ERROR RECOVERY / WEAK CONNECTION / RELIABILITY: PASS')
print(' - bounded retry is read-only; mutations never auto-replay')
print(' - protected drafts are tab-scoped, expiring and sensitive-field denying')
print(' - upload failures/manual retry and partial-result labeling are explicit')
print(' - retained canonical booking recovery remains authoritative')
print(' - no schema or Production business/provider/customer mutation is authorized')
