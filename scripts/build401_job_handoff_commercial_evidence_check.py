#!/usr/bin/env python3
"""Build 401 fail-closed source authority for job handoff and commercial evidence."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    p=ROOT/path
    if not p.exists(): errors.append(f"missing {path}"); return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

index=read("app/operations/index.html")
app=read("apps/operations/operations-app.js")
module=read("apps/operations/handoff-module.js")
api=read("functions/api/admin/job_handoff_evidence.js")
doc=read("BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
roadmap=read("FORWARD_BUILD_ROADMAP_396_405.md")

require(index,[
    'data-build="401"','data-operations-module="handoff"','Field → office handoff',
    'min-height:50px','No Operations module uses setInterval or background polling.'
],"Operations entry surface")
require(app,[
    "handoff:'/apps/operations/handoff-module.js?v=20260914build401'",
    'Only the selected workstream is loaded. Refresh remains manual.'
],"Operations runtime")
require(module,[
    'Build 401 · authoritative handoff','/api/admin/job_handoff_evidence',
    'Manual snapshot only. No polling','No automatic retry was started.',
    'Detailer notes are not converted into sales.'
],"Handoff module")
for forbidden in ['setInterval(', 'setTimeout(', 'localStorage.setItem(']:
    if forbidden in module: errors.append(f"Handoff module contains forbidden background/local authority primitive {forbidden!r}")
require(api,[
    'capability: "view_live_ops"','ROW_LIMIT = 120','EVIDENCE_LIMIT = 2500',
    'free_form_notes_are_authority:false','inferred_busy_time:false','inferred_payouts:false',
    'hidden_debt:false','automatic_customer_scoring:false','forecasting:false','mutations:false',
    'add_on_attachment:{ available:false','No separate authoritative add-on ledger is inferred',
    'jobs_without_ticket_value','jobs_without_margin'
],"Handoff evidence API")
for forbidden in ['method:"PATCH"','method: "PATCH"','method:"DELETE"','method: "DELETE"','method:"PUT"','method: "PUT"']:
    if forbidden in api: errors.append(f"Handoff evidence API contains mutation primitive {forbidden!r}")
require(doc,[
    'Free-form Detailer notes improve communication but never become payment',
    'Missing ticket, fee, tax, cost, payment, balance or reconciliation evidence remains `unavailable`',
    'schema-neutral and source-only'
],"Build 401 contract")
require(queue,['**Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence**','**Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework**'],"release queue")
require(handoff,['**Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence**','**Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework**'],"project handoff")
require(readme,['Current source direction: **Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence**.','BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md'],"README")
require(roadmap,['professional, in-depth process breakdown','paint correction','odor remediation','water extraction','several hours'],"future add-on content roadmap")

if errors:
    print('BUILD 401 JOB HANDOFF & COMMERCIAL EVIDENCE AUTHORITY: FAIL')
    for error in errors: print(' -',error)
    raise SystemExit(1)
print('BUILD 401 JOB HANDOFF & COMMERCIAL EVIDENCE AUTHORITY: PASS')
print(' - Operations receives one manual responsive field-to-office handoff workstream')
print(' - server-authoritative field evidence is composed, not replaced')
print(' - unavailable commercial evidence stays unavailable instead of estimated')
print(' - no inferred busy time, payout, debt, forecast or customer score is introduced')
print(' - future add-on landing-page professional process/depth requirement is retained')
