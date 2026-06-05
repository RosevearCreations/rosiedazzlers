#!/usr/bin/env python3
from pathlib import Path
root = Path(__file__).resolve().parents[1]
required = [
    'functions/api/admin/editable_site_settings_status.js',
    'functions/api/admin/editable_site_settings_sync.js',
    'functions/api/admin/editable_site_settings_validate.js',
    'functions/api/admin/editable_site_settings_history.js',
    'sql/2026-06-04_build190_editable_settings_live_rendering.sql',
    'data/business_profile.json',
    'data/navigation_footer.json',
]
missing = [p for p in required if not (root / p).exists()]
if missing:
    raise SystemExit('Build 190 missing files: ' + ', '.join(missing))
chrome = (root / 'assets/chrome.js').read_text(encoding='utf-8')
for needle in ['loadPublicSiteSettings', 'applyBusinessProfileSettings', 'applyNavigationSettings', 'injectBusinessProfileSchema', 'RosiePublicSiteSettings']:
    if needle not in chrome:
        raise SystemExit(f'Build 190 chrome missing {needle}')
admin = (root / 'admin-site-settings.html').read_text(encoding='utf-8')
for needle in ['editable_site_settings_status', 'editable_site_settings_sync', 'editable_site_settings_validate', 'editable_site_settings_history', 'Build 190']:
    if needle not in admin:
        raise SystemExit(f'Build 190 admin settings page missing {needle}')
lib = (root / 'functions/api/_lib/editable-settings.js').read_text(encoding='utf-8')
for needle in ['validateEditableSetting', 'recordSettingHistory', 'listEditableFallbackKeys']:
    if needle not in lib:
        raise SystemExit(f'Build 190 editable-settings lib missing {needle}')
analytics = (root / 'assets/public-analytics.js').read_text(encoding='utf-8')
if 'analytics_event_registry' not in analytics or 'event_label' not in analytics:
    raise SystemExit('Build 190 analytics registry wiring missing')
print('Build 190 editable settings live rendering guard passed.')
