#!/usr/bin/env python3
"""Build 218 DAIP test-mode foundation guard.

Checks only static source. It proves the package continues to expose DAIP as a
metadata-only internal test facility rather than silently growing a public upload
or publication path.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def require(rel, needles):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"Missing {rel}")
        return
    text = path.read_text(encoding='utf-8')
    lowered = text.lower()
    for needle in needles:
        if needle.lower() not in lowered:
            errors.append(f"{rel}: missing required evidence {needle!r}")

def forbid(rel, needles):
    path = ROOT / rel
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    for needle in needles:
        if needle in text:
            errors.append(f"{rel}: forbidden production capability marker {needle!r}")

require('sql/2026-07-02_build218_daip_test_mode_foundation.sql', [
    "mode = 'internal_test'", "storage_provisioned boolean not null default false", "worker_enabled boolean not null default false",
    "public_export_enabled boolean not null default false", "automatic_publishing_enabled boolean not null default false",
    "daip_media_jobs", "daip_media_assets", "daip_processing_tasks", "execution_blocked boolean not null default true",
    "daip_privacy_reviews", "daip_audit_events", "enable row level security", "grant all privileges on table public.daip_media_jobs to service_role"
])

schema = (ROOT / 'sql/2026-07-02_build218_daip_test_mode_foundation.sql').read_text(encoding='utf-8')
for forbidden_column in ('public_url text', 'storage_key text', 'storage_path text', 'storage_bucket text', 'signed_url text', 'google_drive_file_id', 'booking_id uuid'):
    if forbidden_column in schema:
        errors.append(f"DAIP test schema must not include {forbidden_column}")
for required_safety in ('test_booking_reference text', 'alter table public.daip_test_daily_sequences enable row level security', 'revoke all on function public.daip_next_test_job_code(date)', 'grant execute on function public.daip_next_test_job_code(date) to service_role'):
    if required_safety not in schema:
        errors.append(f"DAIP test schema is missing required boundary {required_safety!r}")

require('admin-daip.html', [
    '<h1>DAIP Test Lab</h1>', 'noindex,nofollow,noarchive', '/api/admin/daip_test_dashboard',
    '/api/admin/daip_test_job_create', '/api/admin/daip_test_asset_register', '/api/admin/daip_test_privacy_review_save',
    'INTERNAL TEST ONLY', 'public blocked', 'data-visual-placeholder="daip_test_mode_process"'
])
require('functions/api/admin/daip_test_dashboard.js', ['requireStaffAccess', "capability:'manage_staff'", 'readTestControl', 'safe metadata only'])
require('functions/api/_lib/daip-test-mode.js', ['INTERNAL TEST ONLY', 'no_customer_data', 'no_public_export', 'isInternalTestAcknowledged'])
require('functions/api/admin/daip_test_job_create.js', ['INTERNAL TEST ONLY', 'test_booking_reference', 'daip_next_test_job_code'])
require('functions/api/admin/daip_test_asset_register.js', ['containsForbiddenStorageInput', 'metadata-only', 'storage_status:\'not_uploaded\''])
require('functions/api/admin/daip_test_privacy_review_save.js', ['public_export_blocked:true', 'Internal-only privacy review'])
require('functions/api/_lib/daip-test-mode.js', ['ARCHIVE INTERNAL TEST JOB'])
require('functions/api/admin/daip_test_job_archive.js', ['ARCHIVE_TEST_PHRASE', 'test_job_archived'])
require('assets/admin-menu.js', ['admin-daip', 'DAIP Test Lab'])
require('assets/admin-auth.js', ['case "admin-daip"'])
require('scripts/sync_route_copies.py', ['"admin-daip.html"'])
require('functions/api/_lib/production-test-playbook.js', ['daip_test_mode_preflight', 'daip_internal_test_registry', 'daip_internal_privacy_export_block'])
require('AI_PROJECT_HANDOFF.md', ['Build 218 — DAIP internal test foundation', 'DAIP Test Lab'])
require('MASTER_VALUE_ROADMAP.md', ['Build 218 — next 20 DAIP and customer-proof steps', 'DAIP Test Lab safety-preflight'])
require('docs/digital-asset-intelligence-platform/13_DAIP_Test_Mode_Process.md', ['metadata-only', 'RD-TEST', 'public blocked'])
require('docs/digital-asset-intelligence-platform/14_DAIP_Production_Promotion_Gates.md', ['Gate A', 'Gate F', 'No generated asset publishes automatically'])

# One H1 on the new protected screen is still a disciplined HTML rule.
page = (ROOT / 'admin-daip.html').read_text(encoding='utf-8')
if len(re.findall(r'<h1(?:\s|>)', page, flags=re.I)) != 1:
    errors.append('admin-daip.html must have exactly one H1')

if errors:
    print('Build 218 DAIP test-mode checks failed:')
    for error in errors:
        print('-', error)
    sys.exit(1)
print('Build 218 DAIP test-mode checks passed.')
