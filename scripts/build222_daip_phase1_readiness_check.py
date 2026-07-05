#!/usr/bin/env python3
"""Build 222 guard: DAIP readiness may authorize a written design review only."""
from pathlib import Path
import json, re, sys
ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"Missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

def require(rel, needles):
    body = read(rel)
    for needle in needles:
        if needle not in body:
            errors.append(f"{rel}: missing {needle!r}")

require('functions/api/_lib/daip-phase1-readiness.js', [
    'DAIP_READINESS_BUILD = 222', 'ready_for_design_review', 'AUTHORIZE DESIGN REVIEW',
    'Gate A and Gate B must both be Ready', 'technical_capabilities_enabled:0', 'public_capabilities_enabled:0'
])
for rel in ['functions/api/admin/daip_phase1_readiness_dashboard.js', 'functions/api/admin/daip_phase1_readiness_save.js']:
    require(rel, ['export async function onRequest(context)', "method === 'OPTIONS'", 'Method not allowed.', "capability:'manage_staff'"])
require('functions/api/admin/daip_phase1_readiness_save.js', ['daip_phase1_readiness_reviews', 'daip_phase1_readiness_audit_events', 'buildPhase1ReadinessInsert'])
require('admin-daip-readiness.html', [
    'data-page="admin-daip-readiness"', '<h1>DAIP Phase 1 Readiness</h1>',
    '/api/admin/daip_phase1_readiness_dashboard', '/api/admin/daip_phase1_readiness_save',
    'AUTHORIZE DESIGN REVIEW', 'data-visual-placeholder="daip_phase1_readiness_review"'
])
require('assets/admin-auth.js', ['case "admin-daip-readiness":'])
require('assets/admin-menu.js', ['key: "admin-daip-readiness"', 'label: "DAIP Readiness"'])
require('scripts/sync_route_copies.py', ['"admin-daip-readiness.html"'])
require('service-worker.js', ['rosie-app-v20260704build222', '/admin-daip-readiness.html', '/data/build222_daip_phase1_readiness_design_review.json'])
require('data/build222_daip_phase1_readiness_design_review.json', ['"build": 222', 'written private-MVP design review'])
require('sql/2026-07-04_build222_daip_phase1_readiness_design_review.sql', [
    'daip_phase1_readiness_reviews', 'daip_phase1_readiness_audit_events',
    'enable row level security', 'revoke all privileges', 'grant all privileges', 'ready_for_design_review'
])
require('SUPABASE_SCHEMA.sql', ['2026-07-04_build222_daip_phase1_readiness_design_review.sql', 'daip_phase1_readiness_reviews'])
require('AI_PROJECT_HANDOFF.md', ['Build 222 central capability', 'DAIP Phase 1 readiness review'])
require('MASTER_VALUE_ROADMAP.md', ['Build 222 — DAIP Phase 1 readiness review', 'Next 20 connected steps after Build 222'])
require('docs/digital-asset-intelligence-platform/17_DAIP_Phase_1_Readiness_and_Design_Review.md', ['Gate C', 'written private-MVP design review'])
require('docs/PRODUCTION_TEST_GUIDE.md', ['Build 222 — DAIP Phase 1 readiness review'])
require('functions/api/_lib/production-test-playbook.js', ['daip_phase1_readiness_gate_block', 'daip_phase1_written_design_review_only', 'daip_phase1_readiness_audit_privacy'])

for rel in [
    'functions/api/_lib/daip-phase1-readiness.js',
    'functions/api/admin/daip_phase1_readiness_dashboard.js',
    'functions/api/admin/daip_phase1_readiness_save.js'
]:
    body = read(rel)
    for forbidden in ['getSignedUrl(', 'createMultipartUpload', 'R2Bucket', 'S3Client(', 'queue.send(', 'FFmpeg', 'OpenAI(', 'customer_media', 'gallery_publish']:
        if forbidden in body:
            errors.append(f"{rel}: forbidden technical/public capability marker {forbidden!r}")

page = read('admin-daip-readiness.html')
if len(re.findall(r'<h1\b', page, flags=re.I)) != 1:
    errors.append('admin-daip-readiness.html must have exactly one H1')
if 'rawToken' in page or 'SUPABASE_SERVICE_ROLE_KEY' in page:
    errors.append('admin-daip-readiness.html exposes forbidden sensitive marker')

try:
    json.loads(read('data/build222_daip_phase1_readiness_design_review.json'))
except Exception as exc:
    errors.append(f'Build 222 data JSON invalid: {exc}')

if errors:
    print('Build 222 DAIP readiness check failed:')
    for item in errors:
        print('-', item)
    sys.exit(1)
print('Build 222 DAIP readiness checks passed.')
