#!/usr/bin/env python3
"""Retained Build 402 fail-closed authority for Operations cockpit QoL and bounded growth experiments."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    p=ROOT/path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

def living_pair(text,label):
    current=re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is the active bounded release\.",text)
    nxt=re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is next only after",text)
    if not current or not nxt:
        errors.append(f"{label} cannot resolve living current/next release")
        return None
    pair=(int(current.group(1)),int(nxt.group(1)))
    if pair[0] < 402:
        errors.append(f"{label} regressed behind retained Build 402 authority: {pair}")
    if pair[1] != pair[0]+1:
        errors.append(f"{label} current/next is not sequential: {pair}")
    return pair

cockpit=read("admin-today.html")
growth=read("admin-growth.html")
framework_text=read("data/growth_experiment_framework.json")
doc=read("BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
roadmap=read("FORWARD_BUILD_ROADMAP_396_405.md")

require(cockpit,[
    'data-build402="admin-operations-cockpit-growth-experiments"','/api/admin/today_needs_attention_report','/api/admin/attention_task_action','Today Operations Cockpit','Urgent exceptions','Normal due work','Operations hub','Manual refresh only. No background polling.','/admin-booking.html','/app/operations/','/admin-growth.html','/admin.html'
],"Build 402 Today/Operations cockpit")
for forbidden in ['setInterval(', 'location.reload(', 'window.location.reload(']:
    if forbidden in cockpit: errors.append(f"Build 402 cockpit contains forbidden polling/reload primitive {forbidden!r}")

require(growth,['/api/admin/value_added_operations_report','/api/admin/membership_interest_list','no automatic enrollment','no appointment creation','no recurring billing'],"retained Growth workbench")
try:
    framework=json.loads(framework_text)
except Exception as exc:
    framework={}; errors.append(f"growth experiment framework is not valid JSON: {exc}")
if framework:
    if framework.get('build') != 402: errors.append("growth experiment framework build is not 402")
    ids={item.get('id') for item in framework.get('experiments',[])}
    expected={'booking_abandonment','reminder_timing','rebooking','referral','review_timing'}
    if ids != expected: errors.append(f"growth experiment ids {sorted(ids)} do not match expected {sorted(expected)}")
    text=framework_text.lower()
    for needle in ['automatic outreach','pricing mutation','booking mutation','consent mutation','schema change']:
        if needle not in text: errors.append(f"growth experiment framework missing guardrail {needle!r}")

require(doc,['schema-neutral and source-only','separates urgent/high exceptions from normal/low due work','Booking abandonment','Reminder timing','Rebooking','Referral','Review request timing','cannot silently change pricing','no `setInterval` or permanent polling is authorized'],"Build 402 contract")
queue_pair=living_pair(queue,'release queue')
handoff_pair=living_pair(handoff,'project handoff')
if queue_pair and handoff_pair and queue_pair != handoff_pair: errors.append(f"living queue/handoff diverges: {queue_pair} vs {handoff_pair}")
require(readme,['BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md','scripts/build402_admin_operations_cockpit_growth_experiment_check.py'],"README")
require(roadmap,['### Build 402 — Admin & Operations Cockpit QoL + Growth Experiment Framework','### Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth'],"forward roadmap")

if errors:
    print('BUILD 402 ADMIN/OPERATIONS COCKPIT + GROWTH EXPERIMENT AUTHORITY: FAIL')
    for error in errors: print(' -',error)
    raise SystemExit(1)
print('BUILD 402 ADMIN/OPERATIONS COCKPIT + GROWTH EXPERIMENT AUTHORITY: PASS')
print(' - retained cockpit/growth authority remains intact while living release state may advance sequentially')
print(' - urgent/high exceptions remain distinct from normal/low due work')
print(' - growth experiment definitions remain evidence-only and fail closed')
print(' - no pricing/booking/payment/consent/provider/schema authority is introduced')
print(' - refresh remains manual; no permanent polling is introduced')
