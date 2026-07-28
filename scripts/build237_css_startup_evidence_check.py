#!/usr/bin/env python3
from pathlib import Path
import re,sys,json
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def need(path,needle):
 p=ROOT/path
 if not p.exists(): errors.append(f"missing {path}")
 elif needle not in p.read_text(encoding='utf-8',errors='ignore'): errors.append(f"{path} missing {needle}")
for path in ['admin-roadmap-execution.html','admin-startup-guide.html','STARTUP_GO_LIVE_BLOCKERS.md','data/build237_next_steps.json','data/build237_go_live_blockers.json','sql/2026-07-28_build237_css_startup_evidence_roadmap.sql','functions/api/admin/launch_readiness_evidence_list.js','functions/api/admin/launch_readiness_evidence_save.js']:
 if not (ROOT/path).exists(): errors.append(f"missing {path}")
need('admin-roadmap-execution.html','/assets/site.css?v=20260728build237')
need('admin-roadmap-execution.html','/assets/admin-shell.js?v=20260728build237')
need('admin-roadmap-execution.html','build237_next_steps.json')
need('admin-startup-guide.html','build237_go_live_blockers.json')
need('admin-launch-readiness.html','launch_readiness_evidence_save')
need('assets/admin-shell.js','ensureAdminCssFallback')
need('SUPABASE_SCHEMA.sql','app_launch_readiness_evidence')
need('DATABASE_STRUCTURE_CURRENT.md','Build 237 database synchronization')
need('service-worker.js','/admin-startup-guide.html')
need('service-worker.js','/data/build237_go_live_blockers.json')
# No stylesheet href may point to a missing local file.
for p in ROOT.rglob('*.html'):
 t=p.read_text(encoding='utf-8',errors='ignore')
 for href in re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)',t,re.I):
  href=href.split('?')[0]
  if href.startswith('/') and not (ROOT/href.lstrip('/')).exists(): errors.append(f"{p.relative_to(ROOT)} missing stylesheet target {href}")
 if 'AdminShell.boot' in t and '/assets/admin-shell.js' not in t: errors.append(f"{p.relative_to(ROOT)} calls AdminShell without dependency")
# Current page copies must match.
for name in ['admin-roadmap-execution','admin-startup-guide','admin-launch-readiness']:
 a=ROOT/f'{name}.html';b=ROOT/name/'index.html'
 if a.exists() and b.exists() and a.read_bytes()!=b.read_bytes(): errors.append(f"route copy drift: {name}")
# One H1 maximum on every HTML page.
for p in ROOT.rglob('*.html'):
 count=len(re.findall(r'<h1\b',p.read_text(encoding='utf-8',errors='ignore'),re.I))
 if count>1: errors.append(f"{p.relative_to(ROOT)} has {count} H1 elements")
# Every Markdown file carries Build 237 sync marker.
for p in ROOT.rglob('*.md'):
 if 'Build 237 synchronization (2026-07-28)' not in p.read_text(encoding='utf-8',errors='ignore'): errors.append(f"Markdown not synchronized: {p.relative_to(ROOT)}")
# Fallback JSON shapes.
for name in ['data/build237_next_steps.json','data/build237_go_live_blockers.json']:
 try:
  d=json.loads((ROOT/name).read_text())
  if len(d.get('items',[]))<20: errors.append(f"{name} has fewer than 20 items")
 except Exception as e: errors.append(f"{name} invalid JSON: {e}")
if errors:
 print('Build 237 check failed:')
 for e in errors: print('-',e)
 sys.exit(1)
print('Build 237 CSS, startup guide, evidence, schema, route, H1 and Markdown checks passed.')
