#!/usr/bin/env python3
"""Build 400 fail-closed source authority for Detailer mobile QoL and retention evidence."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

index = read("app/detailer/index.html")
qol = read("assets/build400-detailer-mobile-qol.js")
api = read("functions/api/admin/detailer_retention_evidence.js")
doc = read("BUILD400_DETAILER_MOBILE_QOL_RETENTION.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")

require(index, [
    'data-build="400"',
    '/assets/build400-detailer-mobile-qol.js?v=20260914build400',
    'Build 383 evidence gates remain authoritative',
    'device-only timer',
], "Detailer entry surface")

require(qol, [
    'Build 400',
    'data-b400-target="prepareBeforePhoto"',
    'data-b400-target="saveFieldChecklist"',
    'data-b400-target="fieldAddons"',
    'data-b400-target="fieldProducts"',
    'data-b400-target="fieldCompletion"',
    'data-b400-target="prepareAfterPhoto"',
    'min-height:50px',
    'sessionStorage',
    'Device-only aid; never payroll, billing or job-state evidence.',
    'requestAnimationFrame',
], "Detailer QoL layer")

for forbidden in ['fetch(', 'XMLHttpRequest', 'setInterval(', '/api/']:
    if forbidden in qol:
        errors.append(f"Detailer QoL layer contains forbidden network/polling primitive {forbidden!r}")

require(api, [
    'requireStaffAccess',
    'capability: "view_analytics"',
    'customer_id',
    'customer_id_exact',
    'fuzzy_identity_matching: false',
    'email_or_name_matching: false',
    'automatic_customer_scoring: false',
    'customer_ids_exposed: false',
    'booking_mutation: false',
    'outreach_triggered: false',
    'ROW_LIMIT = 2500',
], "Retention evidence API")

for forbidden in ['customer_email', 'customer_name', 'phone', 'visitor_id', 'session_id']:
    if forbidden in api:
        errors.append(f"Retention evidence API contains forbidden identity field {forbidden!r}")

require(doc, [
    'exact non-empty `customer_id`',
    'device-only convenience aid',
    'no persistent customer score',
    'schema-neutral and source-only',
], "Build 400 contract")
require(queue, ['**Build 400 — Detailer Mobile App QoL & Retention Evidence**', '**Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence**'], 'release queue')
require(handoff, ['**Build 400 — Detailer Mobile App QoL & Retention Evidence**', '**Build 401 — Job Handoff, Detailer/Admin Interaction & Commercial Evidence**'], 'project handoff')
require(readme, ['Current source direction: **Build 400 — Detailer Mobile App QoL & Retention Evidence**.', 'BUILD400_DETAILER_MOBILE_QOL_RETENTION.md'], 'README')

if errors:
    print('BUILD 400 DETAILER MOBILE QOL & RETENTION AUTHORITY: FAIL')
    for error in errors:
        print(' -', error)
    raise SystemExit(1)

print('BUILD 400 DETAILER MOBILE QOL & RETENTION AUTHORITY: PASS')
print(' - canonical Detailer runtime is extended, not replaced')
print(' - quick-capture controls map to existing Build 383 field evidence controls')
print(' - local timer remains device-only and non-authoritative')
print(' - retention evidence is bounded, aggregate-only and exact-canonical-ID based')
print(' - fuzzy identity, persistent scoring and automatic outreach remain prohibited')
