#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(rel):
 p=ROOT/rel
 if not p.exists(): errors.append(f'missing {rel}'); return ''
 return p.read_text(encoding='utf-8',errors='ignore')
def need(rel,*tokens):
 s=read(rel)
 for token in tokens:
  if token not in s: errors.append(f'{rel} missing {token}')
required=[
 'admin-startup-guide.html','assets/startup-command-center.js','functions/api/admin/startup_process_list.js',
 'functions/api/_lib/startup-process-catalog.js','data/build239_go_live_blockers.json',
 'data/build239_unified_startup_command_center.json','sql/2026-08-01_build239_unified_startup_command_center.sql',
 'docs/BUILD239_UNIFIED_STARTUP_COMMAND_CENTER.md','docs/SEO_COMPETITIVE_REVIEW_BUILD239.md'
]
for rel in required:
 if not (ROOT/rel).exists(): errors.append(f'missing {rel}')
need('admin-startup-guide.html','Startup Command Center','id="blockers"','id="evidence"','id="production"','id="tests"','id="roadmap"','id="seo"','/assets/site.css?v=20260801build239','/assets/startup-command-center.js?v=20260801build239','data-visual-placeholder="startup_command_center_unified_path"')
need('assets/startup-command-center.js','startup_process_list','launch_readiness_evidence_list','production_reliability_report','production_test_runs_list','roadmap_execution_dashboard','launch_readiness_evidence_save','production_test_run_save','roadmap_execution_save','Packaged fallback','read-only cache')
need('functions/api/admin/startup_process_list.js','app_startup_process_items','packaged_fallback','STARTUP_PROCESS_CATALOG_BUILD239','manage_bookings')
need('sql/2026-08-01_build239_unified_startup_command_center.sql','app_startup_process_items','app_startup_process_audit','deploy_239','migration_239','notification_health','rollback_drill','build239','update public.app_roadmap_execution_items set is_current_cycle=false')
need('SUPABASE_SCHEMA.sql','BEGIN BUILD 239 UNIFIED STARTUP COMMAND CENTER','app_startup_process_items','app_startup_process_audit')
need('DATABASE_STRUCTURE_CURRENT.md','Build 239 startup-process catalog')
need('STARTUP_GO_LIVE_BLOCKERS.md','Startup and Go-Live Blocker Guide — Build 239','/admin-startup-guide.html','Guided production acceptance tests','Establish an approved local-photo, review, and Business Profile cadence')
need('AI_PROJECT_HANDOFF.md','Build 239 — Unified Startup Command Center')
need('MASTER_VALUE_ROADMAP.md','Build 239 value direction')
need('DEVELOPMENT_ROADMAP.md','Build 239 current development cycle')
need('KNOWN_GAPS_AND_RISKS.md','Build 239 remaining gaps and risks')
# Catalog completeness and preservation.
try:
 data=json.loads(read('data/build239_go_live_blockers.json'))
 items=data.get('items',[])
 if data.get('build')!=239: errors.append('Build 239 catalog build number is incorrect')
 if len(items)<34: errors.append(f'Build 239 catalog has only {len(items)} items')
 ids={x.get('id') for x in items}
 for required_id in ['migration-239','notification-health','payment-link-operations','upload-recovery','retention-review','incident-closeout','rollback-drill','local-proof-cadence','startup-single-interface','markdown-retirement']:
  if required_id not in ids: errors.append(f'Build 239 catalog missing preserved/added item {required_id}')
 orders=[x.get('order') for x in items]
 if orders!=sorted(orders) or len(set(orders))!=len(orders): errors.append('Build 239 catalog order is not unique and sorted')
except Exception as exc: errors.append(f'Build 239 catalog invalid: {exc}')
# Legacy readiness routes must forward to the unified interface while remaining available for emergency legacy access.
legacy={
 'admin-launch-readiness.html':'/admin-startup-guide.html#evidence',
 'admin-production.html':'/admin-startup-guide.html#production',
 'admin-test-centre.html':'/admin-startup-guide.html#tests',
 'admin-roadmap-execution.html':'/admin-startup-guide.html#roadmap'
}
for rel,target in legacy.items():
 s=read(rel)
 if 'data-build239-compat-redirect' not in s or target not in s or 'legacy' not in s: errors.append(f'{rel} is not a safe Build 239 compatibility redirect')
 route=ROOT/rel.removesuffix('.html')/'index.html'
 if not route.exists() or route.read_bytes()!=(ROOT/rel).read_bytes(): errors.append(f'route copy drift: {rel}')
# Single normal admin-menu entry.
menu=read('assets/admin-menu.js')
if 'label: "Startup Command Center"' not in menu: errors.append('Admin menu missing Startup Command Center label')
if menu.count('label: "Startup Command Center"')!=1: errors.append('Admin menu has duplicate Startup Command Center entries')
if 'Build 239 compatibility route now forwards into Startup Command Center' not in menu: errors.append('Launch-readiness legacy menu item is not disabled')
# All Markdown synchronized.
marker='<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->'
for p in ROOT.rglob('*.md'):
 if marker not in p.read_text(encoding='utf-8',errors='ignore'): errors.append(f'Markdown not synchronized: {p.relative_to(ROOT)}')
# All local stylesheet/script refs resolve and at most one H1 per page.
for p in ROOT.rglob('*.html'):
 s=p.read_text(encoding='utf-8',errors='ignore')
 if len(re.findall(r'<h1\b',s,re.I))>1: errors.append(f'{p.relative_to(ROOT)} has more than one H1')
 for target in re.findall(r'(?:href|src)=["\']([^"\']+)["\']',s,re.I):
  clean=target.split('?',1)[0].split('#',1)[0]
  if clean.startswith('/') and clean.lower().endswith(('.css','.js')) and not (ROOT/clean.lstrip('/')).exists(): errors.append(f'{p.relative_to(ROOT)} missing local asset {clean}')
# New JS syntax via node is handled by cloudflare check; ensure no inline duplicate process state source.
if 'build238_go_live_blockers.json' in read('assets/startup-command-center.js'): errors.append('Startup command JS still reads Build 238 catalog')
if errors:
 print('Build 239 check failed:')
 for item in errors: print('-',item)
 sys.exit(1)
print('Build 239 unified Startup Command Center, catalog, redirects, schema, fallback, Markdown, route, and H1 checks passed.')
