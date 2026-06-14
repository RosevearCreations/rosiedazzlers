#!/usr/bin/env python3
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
required = [
  'admin-gallery.html','admin-gallery/index.html','admin-quotes.html','admin-quotes/index.html','admin-growth.html','admin-growth/index.html',
  'functions/api/admin/gallery_approvals_list.js','functions/api/admin/gallery_approvals_save.js','functions/api/admin/value_added_operations_report.js',
  'data/value_added_operations_build206.json','sql/2026-06-14_build206_value_added_operations_foundations.sql'
]
missing=[p for p in required if not (ROOT/p).exists()]
if missing:
  raise SystemExit('Missing Build 206 files: '+', '.join(missing))
for page in ['admin-gallery.html','admin-quotes.html','admin-growth.html']:
  text=(ROOT/page).read_text(encoding='utf-8')
  if text.lower().count('<h1') != 1:
    raise SystemExit(f'{page} should have exactly one H1')
  if 'data-build206' not in text:
    raise SystemExit(f'{page} missing Build 206 marker')
data=json.loads((ROOT/'data/value_added_operations_build206.json').read_text(encoding='utf-8'))
for key in ['quote_pipeline','meta_campaigns','memberships','vehicle_history_events','proof_of_work_checklists','fleet_accounts','review_requests','seasonal_campaigns','route_clusters']:
  if not isinstance(data.get(key), list) or not data[key]:
    raise SystemExit(f'Build 206 data missing populated {key}')
admin=(ROOT/'admin.html').read_text(encoding='utf-8')
for href in ['/admin-gallery.html','/admin-quotes.html','/admin-growth.html']:
  if href not in admin:
    raise SystemExit(f'Admin dashboard missing {href}')
print('Build 206 value-added operations check passed.')
