#!/usr/bin/env python3
from pathlib import Path
root = Path(__file__).resolve().parents[1]
required = [
  'assets/admin-auth.js',
  'assets/site-policies.js',
  'assets/booking-hours.js',
  'functions/api/booking_hours_status.js',
  'functions/api/admin/editable_setting_dependency_map.js',
  'functions/api/admin/editable_site_settings_restore.js',
  'data/editable_setting_dependency_map.json',
  'sql/2026-06-05_build191_editable_settings_hardening_no_ddl_note.sql',
]
missing = [p for p in required if not (root / p).exists()]
if missing:
  raise SystemExit('Build 191 missing files: ' + ', '.join(missing))
admin_auth = (root / 'assets/admin-auth.js').read_text(encoding='utf-8')
for needle in ['function guardPage', 'function fetchWithAuth', 'guardPage,', 'fetchWithAuth,']:
  if needle not in admin_auth:
    raise SystemExit(f'Build 191 admin-auth missing {needle}')
admin_page = (root / 'admin-site-settings.html').read_text(encoding='utf-8')
for needle in ['adminFetch(', 'renderStructuredEditor', 'editable_setting_dependency_map', 'data-build191']:
  if needle not in admin_page:
    raise SystemExit(f'Build 191 admin-site-settings missing {needle}')
media = (root / 'functions/api/admin/media_asset_health_scan.js').read_text(encoding='utf-8')
if 'data/media_requirements.json' not in media or 'image_requirements_build184' in media:
  raise SystemExit('Build 191 media health still uses build-specific requirements file')
ingest = (root / 'functions/api/analytics/ingest.js').read_text(encoding='utf-8')
for needle in ['loadAnalyticsEventMeta', 'analytics_event_inactive', 'event_registry_known']:
  if needle not in ingest:
    raise SystemExit(f'Build 191 analytics ingest missing {needle}')
quote = (root / 'functions/api/admin/quote_proposal_deliver.js').read_text(encoding='utf-8')
if 'loadDocumentTemplate' not in quote or 'document_templates' not in quote:
  raise SystemExit('Build 191 quote delivery template wiring missing')
print('Build 191 editable settings hardening guard passed.')
