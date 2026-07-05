#!/usr/bin/env python3
"""Build 223 DAIP private-MVP design blueprint safety checks."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(rel):
 p=ROOT/rel
 if not p.exists():errors.append(f'Missing required file: {rel}');return ''
 return p.read_text(encoding='utf-8',errors='ignore')
def require(rel,markers):
 text=read(rel)
 for marker in markers:
  if marker not in text:errors.append(f'{rel}: missing evidence {marker!r}')
require('admin-daip-design.html',['<h1>DAIP Private-MVP Design Blueprint</h1>','noindex,nofollow,noarchive','Gate C remains held','SUBMIT DESIGN BLUEPRINT','zero public destination'])
require('admin-daip-design/index.html',['<h1>DAIP Private-MVP Design Blueprint</h1>','data-build223'])
require('assets/admin-auth.js',['case "admin-daip-design"'])
require('assets/admin-menu.js',['key: "admin-daip-design"','/admin-daip-design.html'])
require('service-worker.js',['rosie-app-v20260705build223','/admin-daip-design.html','/data/build223_daip_private_mvp_design_blueprint.json'])
require('data/build223_daip_private_mvp_design_blueprint.json',['"build": 223','"gate_c": "held"'])
require('sql/2026-07-05_build223_daip_private_mvp_design_blueprint.sql',['daip_private_mvp_design_reviews','daip_private_mvp_design_audit_events','gate_c_held','enable row level security','revoke all privileges','grant all privileges','submitted_for_independent_review'])
require('SUPABASE_SCHEMA.sql',['2026-07-05_build223_daip_private_mvp_design_blueprint.sql','daip_private_mvp_design_reviews'])
require('AI_PROJECT_HANDOFF.md',['Build 223 central capability','DAIP private-MVP design blueprint'])
require('MASTER_VALUE_ROADMAP.md',['Build 223 — DAIP private-MVP design blueprint','Next 20 connected steps after Build 223'])
require('docs/digital-asset-intelligence-platform/18_DAIP_Private_MVP_Design_Blueprint_Review.md',['Gate C','independent review','Never enter'])
require('docs/PRODUCTION_TEST_GUIDE.md',['Build 223 — DAIP private-MVP design blueprint'])
require('functions/api/_lib/production-test-playbook.js',['daip_private_mvp_design_gate_block','daip_private_mvp_design_review_only','daip_private_mvp_design_audit_privacy'])
for rel in ['functions/api/_lib/daip-private-mvp-design.js','functions/api/admin/daip_private_mvp_design_dashboard.js','functions/api/admin/daip_private_mvp_design_save.js']:
 body=read(rel)
 for forbidden in ['getSignedUrl(','createMultipartUpload','R2Bucket','S3Client(','queue.send(','FFmpeg','OpenAI(','gallery_publish','createSignedUrl']:
  if forbidden in body:errors.append(f'{rel}: forbidden technical/public capability marker {forbidden!r}')
page=read('admin-daip-design.html')
if len(re.findall(r'<h1\b',page,flags=re.I))!=1:errors.append('admin-daip-design.html must have exactly one H1')
for sensitive in ['SUPABASE_SERVICE_ROLE_KEY','rawToken','secretKey']:
 if sensitive in page:errors.append(f'admin-daip-design.html exposes forbidden sensitive marker {sensitive!r}')
try:json.loads(read('data/build223_daip_private_mvp_design_blueprint.json'))
except Exception as exc:errors.append(f'Build 223 JSON invalid: {exc}')
if errors:
 print('Build 223 DAIP design blueprint check failed:')
 for error in errors:print('-',error)
 sys.exit(1)
print('Build 223 DAIP design blueprint checks passed.')
