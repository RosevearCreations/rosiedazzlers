#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def req(rel):
 p=ROOT/rel
 if not p.exists(): errors.append(f'missing {rel}')
 return p

required=[
 'functions/api/_lib/catalog-readiness.js',
 'functions/api/admin/catalog_readiness_report.js',
 'functions/api/admin/catalog_publish_readiness.js',
 'sql/2026-08-07_build246_catalog_publish_readiness.sql',
 'data/build246_completed_steps.json','data/build246_next_steps.json',
 'data/build246_ui_health_routes.json','data/markdown_sanity_build246.json',
 'BUILD246_SUMMARY.md','docs/BUILD246_CATALOG_PUBLISH_READINESS.md',
 'docs/SEO_COMPETITIVE_REVIEW_BUILD246.md'
]
for rel in required:req(rel)

checks={
 'functions/api/_lib/catalog-readiness.js':['evaluateCatalogReadiness','attachCatalogReadiness','Name looks like an identifier','Featured image is still an SVG placeholder'],
 'functions/api/admin/catalog_inventory_save.js':['evaluateCatalogReadiness','This item cannot be public','publish_readiness'],
 'functions/api/admin/catalog_inventory_bulk_update.js':['validatePublishChanges','evaluateCatalogReadiness'],
 'functions/api/admin/catalog_bulk_visibility.js':['admin_catalog_inventory_publish_review','admin_catalog_inventory_bulk_update'],
 'functions/api/catalog_public.js':['attachCatalogReadiness','excluded_unready'],
 'functions/api/admin/catalog_publish_readiness.js':['2026-08-07_build246_catalog_publish_readiness.sql'],
 'admin-catalog.html':['Reviewed public publishing','publishReadinessFilter','Preview public readiness','Publish ready selection'],
 'admin-inventory-manager.html':['Ready to publish','Blocked publishing','publish_score','publish_blockers'],
 'assets/startup-command-center.js':['const BUILD=246','rosie_startup_build246_'],
 'service-worker.js':['rosie-app-v20260807build246','build246_ui_health_routes.json'],
 'SUPABASE_SCHEMA.sql':['catalog_publish_readiness_audit','admin_catalog_inventory_publish_review','catalog-publish-readiness'],
 'DATABASE_STRUCTURE_CURRENT.md':['Build 246 catalog-readiness synchronization'],
}
for rel,markers in checks.items():
 p=req(rel)
 if p.exists():
  text=p.read_text(errors='ignore')
  for marker in markers:
   if marker not in text: errors.append(f'{rel}: missing {marker}')

migration=req('sql/2026-08-07_build246_catalog_publish_readiness.sql')
if migration.exists():
 text=migration.read_text()
 forbidden=['priority,title,why_it_matters','completion_condition','introduced_build','is_current)']
 for marker in forbidden:
  if marker in text: errors.append(f'migration uses obsolete column marker: {marker}')
 for marker in ['process_key,sort_order,category,severity','source_build,is_active','target_build','workstream']:
  if marker not in text: errors.append(f'migration missing current schema marker: {marker}')
 allowed={'customer','booking','payments','seo','media','daip','operations','reliability','documentation'}
 for match in re.finditer(r"\('b246_\d+','[^']*','([^']+)'",text):
  if match.group(1) not in allowed: errors.append(f'invalid roadmap workstream {match.group(1)}')

for rel in ['data/build246_completed_steps.json','data/build246_next_steps.json']:
 p=req(rel)
 if p.exists():
  data=json.loads(p.read_text())
  if data.get('build')!=246: errors.append(f'{rel}: build must be 246')
  if len(data.get('items',[]))!=20: errors.append(f'{rel}: expected 20 items')

routes=req('data/build246_ui_health_routes.json')
if routes.exists():
 data=json.loads(routes.read_text())
 if data.get('build')!=246: errors.append('Build 246 route matrix build mismatch')
 paths={x.get('path') for x in data.get('routes',[])}
 for route in ['/admin-catalog.html','/admin-inventory-manager.html','/admin-startup-guide.html','/book','/pricing']:
  if route not in paths: errors.append(f'Build 246 route matrix missing {route}')

# Route copies and static H1/noindex checks remain enforced.
for root,clean in [('admin-catalog.html','admin-catalog/index.html'),('admin-inventory-manager.html','admin-inventory-manager/index.html'),('admin-startup-guide.html','admin-startup-guide/index.html'),('admin-ui-health.html','admin-ui-health/index.html')]:
 a=req(root);b=req(clean)
 if a.exists() and b.exists() and a.read_text()!=b.read_text():errors.append(f'route copies differ: {root}')
for p in ROOT.rglob('*.html'):
 rel=p.relative_to(ROOT).as_posix()
 if rel.startswith(('functions/','docs/')):continue
 soup=BeautifulSoup(p.read_text(errors='ignore'),'html.parser')
 if len(soup.find_all('h1'))!=1:errors.append(f'{rel}: expected one H1')

marker='<!-- Build 246 synchronization:'
md=list(ROOT.rglob('*.md'))
for p in md:
 if marker not in p.read_text(errors='ignore'):errors.append(f'{p.relative_to(ROOT)}: missing Build 246 synchronization marker')

if errors:
 print('Build 246 catalog publishing readiness check failed:')
 for e in errors: print('-',e)
 sys.exit(1)
print(f'Build 246 catalog publishing readiness check passed ({len(md)} Markdown files synchronized).')
