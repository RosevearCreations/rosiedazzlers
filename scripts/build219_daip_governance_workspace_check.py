#!/usr/bin/env python3
"""Build 219 DAIP governance workspace guard.

This static check protects the boundary between owner-decision governance and the
future private-media system. Build 219 may record decisions and test evidence but
must not silently provision or expose media-production capability.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
# Cache names advance with each build; validate required cached routes/data instead.
errors: list[str] = []

def text(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"Missing {rel}")
        return ""
    return path.read_text(encoding="utf-8")

def require(rel: str, needles: list[str]) -> None:
    body = text(rel).lower()
    for needle in needles:
        if needle.lower() not in body:
            errors.append(f"{rel}: missing required evidence {needle!r}")

def forbid_exact(rel: str, needles: list[str]) -> None:
    body = text(rel)
    for needle in needles:
        if needle in body:
            errors.append(f"{rel}: forbidden DAIP production capability marker {needle!r}")

migration = text('sql/2026-07-02_build219_daip_governance_workspace.sql')
for required in (
    'create table if not exists public.daip_governance_decisions',
    'create table if not exists public.daip_governance_audit_events',
    'resolution_status text not null default \'draft\'',
    "check (resolution_status in ('draft','approved'))",
    'alter table public.daip_governance_decisions enable row level security',
    'alter table public.daip_governance_audit_events enable row level security',
    'revoke all privileges on table public.daip_governance_decisions from public, anon, authenticated',
    'grant all privileges on table public.daip_governance_decisions to service_role',
    'governance only and cannot provision storage, uploads, workers, exports, or automatic publishing'
):
    if required not in migration:
        errors.append(f"Build 219 migration missing required boundary {required!r}")
for forbidden in ('storage_bucket text', 'storage_key text', 'storage_path text', 'signed_url text', 'public_url text', 'booking_id uuid', 'upload_url text', 'download_url text', 'google_drive_file_id'):
    if forbidden in migration:
        errors.append(f"Build 219 governance schema must not include {forbidden!r}")

require('admin-daip-governance.html', [
    '<h1>DAIP Governance & Promotion Gates</h1>', 'noindex,nofollow,noarchive',
    '/api/admin/daip_governance_dashboard', '/api/admin/daip_governance_decision_save',
    'Hard stop: a completed decision is not a production switch', 'data-visual-placeholder="daip_governance_gates"',
    'Production features', 'Gates C–F stay held'
])
page = text('admin-daip-governance.html')
if len(re.findall(r'<h1(?:\s|>)', page, flags=re.I)) != 1:
    errors.append('admin-daip-governance.html must have exactly one H1')
if re.search(r'<input[^>]+type=["\']file["\']', page, flags=re.I):
    errors.append('admin-daip-governance.html must not accept a file upload')

require('functions/api/_lib/daip-governance.js', [
    'DAIP_GOVERNANCE_BUILD = 219', 'DAIP-0-01', 'DAIP-0-12', 'REQUIRED_BUILD218_TESTS',
    'Private storage/upload design', 'Private processing MVP', 'Privacy/export proof', 'Controlled production pilot', 'no worker', 'no customer access', 'expectedApprovalPhrase',
    'safeGovernanceText', 'buildGovernanceUpsert', 'production_capabilities_enabled:0'
])
require('functions/api/admin/daip_governance_dashboard.js', ['requireStaffAccess', "capability:'manage_staff'", 'buildGovernanceDashboard'])
require('functions/api/admin/daip_governance_decision_save.js', ['requireStaffAccess', "capability:'manage_staff'", 'buildGovernanceUpsert', 'daip_governance_audit_events'])
forbid_exact('functions/api/admin/daip_governance_dashboard.js', ['createPresigned', 'putObject', 'signed_url', 'upload_url'])
forbid_exact('functions/api/admin/daip_governance_decision_save.js', ['createPresigned', 'putObject', 'signed_url', 'upload_url'])

require('assets/admin-menu.js', ['admin-daip-governance', 'DAIP Governance'])
require('assets/admin-auth.js', ['case "admin-daip-governance"'])
require('scripts/sync_route_copies.py', ['"admin-daip-governance.html"'])
require('service-worker.js', ['/admin-daip-governance.html', '/data/build219_daip_governance_workspace.json'])
require('assets/visual-placeholders.js', ['daip_governance_gates', 'DAIP governance gate visual'])
require('data/visual_placeholder_registry.json', ['"key": "daip_governance_gates"'])
require('data/build219_daip_governance_workspace.json', ['"build": 219', '"explicitly_not_implemented"'])
require('functions/api/_lib/production-test-playbook.js', ['daip_governance_draft_boundary', 'daip_governance_owner_approval', 'daip_promotion_gates_hold'])
require('docs/PRODUCTION_TEST_GUIDE.md', ['Build 219 — DAIP governance workspace release test', 'DAIP promotion-gate hold verification'])
require('AI_PROJECT_HANDOFF.md', ['Build 219 central capability: DAIP governance and promotion gates', 'Gates C–F remain hard-held'])
require('MASTER_VALUE_ROADMAP.md', ['Build 219 — DAIP governance workspace and held promotion gates', 'Build 219 boundary'])
require('docs/digital-asset-intelligence-platform/15_DAIP_Governance_Workspace_Process.md', ['Gate A', 'Gate F', 'cannot and does not create'])
require('DOC_INDEX.md', ['Build 219 DAIP governance workspace documents'])

if errors:
    print('Build 219 DAIP governance workspace checks failed:')
    for error in errors:
        print('-', error)
    raise SystemExit(1)
print('Build 219 DAIP governance workspace checks passed.')
