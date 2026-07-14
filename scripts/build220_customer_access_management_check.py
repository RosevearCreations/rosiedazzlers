#!/usr/bin/env python3
"""Build 220 regression guard: customer administration + DAIP readiness only.

This pass must improve customer support without exposing credentials or quietly
advancing DAIP into storage/processing/public media.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
# Cache names advance with every release; validate cached routes/data rather than a frozen historical cache label.
errors: list[str] = []

def text(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"Missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

def require(rel: str, needles: list[str]) -> None:
    body = text(rel)
    for needle in needles:
        if needle not in body:
            errors.append(f"{rel}: missing required evidence {needle!r}")

def forbid(rel: str, needles: list[str]) -> None:
    body = text(rel)
    for needle in needles:
        if needle in body:
            errors.append(f"{rel}: forbidden unsafe marker {needle!r}")

migration = text('sql/2026-07-03_build220_customer_access_management_and_daip_readiness.sql')
for needle in (
    'add column if not exists archived_at',
    'create table if not exists public.customer_admin_audit_events',
    'create table if not exists public.customer_account_recovery_requests',
    'alter table public.customer_admin_audit_events enable row level security',
    'alter table public.customer_account_recovery_requests enable row level security',
    'revoke all privileges on table public.customer_auth_sessions from public, anon, authenticated',
    'revoke all privileges on table public.customer_auth_tokens from public, anon, authenticated',
    'grant all privileges on table public.customer_admin_audit_events to service_role',
    'no bucket, storage key, upload URL, worker, processing task, customer asset route, export, or publishing capability'
):
    if needle not in migration:
        errors.append(f"Build 220 migration missing required boundary {needle!r}")
for needle in ('create table if not exists public.daip_', 'storage_bucket text', 'signed_url text', 'upload_url text', 'google_drive_file_id'):
    if needle in migration:
        errors.append(f"Build 220 migration must not create DAIP production infrastructure: {needle!r}")

require('admin-customers.html', [
    '<h1>Customer Management & Account Access</h1>',
    'noindex,nofollow,noarchive',
    '/api/admin/customer_admin_list', '/api/admin/customer_admin_detail',
    '/api/admin/customer_admin_save', '/api/admin/customer_admin_access_action',
    '/api/admin/customer_account_help_list',
    'There is no separate username', 'Staff send time-limited setup/reset links',
    'Archive client account', 'data-visual-placeholder="customer_access_control"',
    'DAIP remains gated'
])
page = text('admin-customers.html')
if len(re.findall(r'<h1(?:\s|>)', page, flags=re.I)) != 1:
    errors.append('admin-customers.html must contain exactly one H1')
if re.search(r'<input[^>]+(?:name|id)=["\'][^"\']*(?:password|reset_token|session_token)[^"\']*["\']', page, flags=re.I):
    errors.append('admin-customers.html must not include staff credential/token inputs')

require('login.html', [
    'There is no separate username', 'Forgot your password?', 'Forgot which email you used?',
    '/api/client/auth_forgot_password', '/api/client/auth_account_help',
    '/api/client/auth_reset_password', '/api/client/auth_verify_email',
    '<meta name="referrer" content="no-referrer" />'
])
if len(re.findall(r'<h1(?:\s|>)', text('login.html'), flags=re.I)) != 1:
    errors.append('login.html must contain exactly one H1')

require('functions/api/_lib/customer-auth-tokens.js', [
    'used_at=is.null', 'retire prior auth tokens', 'Atomically claim',
    "messageVariant = 'standard'", 'customer_account_setup', 'randomToken()',
    'trustedCustomerAuthOrigin', 'PUBLIC_SITE_ORIGIN', 'Customer auth origin is not approved'
])
require('functions/api/client/auth_reset_password.js', [
    'revokeAllCustomerSessions', 'email_verified_at', 'createCustomerSession'
])
require('functions/api/client/auth_forgot_password.js', ['If that email exists, a reset link has been sent.', 'Match the unknown-email response exactly', 'canIssuePasswordReset'])
forbid('functions/api/client/auth_forgot_password.js', ['delivery: { ok: dispatch'])
require('functions/api/client/auth_account_help.js', [
    'genericResponse', 'does not confirm whether an account exists', 'request_fingerprint'
])
require('functions/api/_lib/customer-admin.js', [
    'customerAccessLevel', 'canManageCustomerSecurity', 'canArchiveCustomer',
    'safeAuditSummary', 'password_hash', 'revokeAllCustomerSessions'
])
require('functions/api/admin/customer_admin_save.js', [
    'confirm_email_change', 'CHANGE EMAIL', 'sendCustomerAuthEmail', 'revokeAllCustomerSessions'
])
require('functions/api/admin/customer_admin_access_action.js', [
    'send_password_reset', 'send_account_setup', 'resend_verification',
    'revoke_sessions', 'archive', 'ARCHIVE CLIENT', 'Staff send reset/setup links; they never view or set a client password'
])
require('functions/api/admin/customer_account_help_list.js', ['canManageCustomerSecurity', 'customer_account_recovery_requests'])
require('functions/api/admin/customer_account_help_action.js', ['safe_resolution_note', 'token|password|signed'])
for legacy in ('functions/api/admin/customers_detail.js','functions/api/customers_detail.js','customers_detail.js'):
    require(legacy, ['safeCustomerProfile(profile)', 'password_hash'])

require('assets/admin-auth.js', ['case "admin-customers"', 'actor.is_detailer === true'])
require('scripts/sync_route_copies.py', ['"admin-customers.html"'])
require('service-worker.js', ['/admin-customers.html', '/data/build220_customer_access_management.json'])
require('assets/visual-placeholders.js', ['customer_access_control', 'Customer account access visual'])
require('data/visual_placeholder_registry.json', ['"key": "customer_access_control"'])
require('data/build220_customer_access_management.json', ['"build": 220', 'DAIP Gates C-F remain held'])
require('functions/api/_lib/production-test-playbook.js', [
    'customer_access_profile_edit_boundary', 'customer_access_secure_reset_and_recovery',
    'customer_access_archive_audit', 'daip_phase1_readiness_packet_hold'
])
require('data/production_test_playbook_build212.json', ['customer_access_profile_edit_boundary', 'daip_phase1_readiness_packet_hold'])
require('docs/PRODUCTION_TEST_GUIDE.md', ['Build 220 — customer access management and DAIP readiness packet', 'Archive client account', 'DAIP readiness packet hard stop'])
require('docs/digital-asset-intelligence-platform/16_DAIP_Phase_1_Readiness_Packet.md', [
    'DAIP-0-01', 'DAIP-0-12', 'Gates C–F stay held', 'No direct browser write to DAIP database tables',
    'Minimum private-MVP design questions'
])
require('AI_PROJECT_HANDOFF.md', ['Build 220 central capability: controlled customer access management and DAIP readiness', 'Gates C–F remain held'])
require('MASTER_VALUE_ROADMAP.md', ['Build 220 — customer access management and DAIP readiness packet', 'Build 220 boundary'])
require('DOC_INDEX.md', ['Build 220 current documentation rule', '16_DAIP_Phase_1_Readiness_Packet.md'])
require('SUPABASE_SCHEMA.sql', ['Build 220 schema mirror', 'customer_account_recovery_requests'])

if errors:
    print('Build 220 customer access management check failed:')
    for error in errors:
        print('-', error)
    raise SystemExit(1)
print('Build 220 customer access management checks passed.')
