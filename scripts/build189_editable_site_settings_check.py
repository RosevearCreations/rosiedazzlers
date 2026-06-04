from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

required_files = [
    'admin-site-settings.html',
    'admin-site-settings/index.html',
    'functions/api/_lib/editable-settings.js',
    'functions/api/admin/editable_site_settings.js',
    'functions/api/site_settings_public.js',
    'functions/api/data/landing_pages_content.json',
    'data/landing_pages_content.json',
    'data/business_profile.json',
    'data/site_policies.json',
    'data/document_templates.json',
    'data/business_hours_holidays.json',
    'data/navigation_footer.json',
    'data/analytics_event_registry.json',
    'data/media_requirements.json',
    'sql/2026-06-04_build189_editable_site_settings_foundation.sql',
]

missing = [p for p in required_files if not (ROOT / p).exists()]
if missing:
    raise SystemExit('Build 189 missing files: ' + ', '.join(missing))

landing_js = (ROOT / 'functions/api/landing_pages_public.js').read_text(encoding='utf-8')
for forbidden in ['const DEFAULT_LANDING_PAGES = {', 'const LANDING_PAGE_EXPANSIONS = {', 'const ADDON_LANDING_PAGE_TEMPLATES = {']:
    if forbidden in landing_js:
        raise SystemExit(f'Build 189 failed: landing page content still hard-coded via {forbidden}')
for expected in ['landing_pages_content.json', 'fallbackLandingPagesContent.default_pages', 'fallbackLandingPagesContent.expansion_pages', 'fallbackLandingPagesContent.addon_landing_page_templates']:
    if expected not in landing_js:
        raise SystemExit(f'Build 189 failed: missing landing externalization marker {expected}')

for path in ['data/landing_pages_content.json','functions/api/data/landing_pages_content.json']:
    payload = json.loads((ROOT / path).read_text(encoding='utf-8'))
    if not payload.get('default_pages', {}).get('pages'):
        raise SystemExit(f'{path} missing default_pages.pages')
    if not payload.get('expansion_pages', {}).get('pages'):
        raise SystemExit(f'{path} missing expansion_pages.pages')
    if not payload.get('addon_landing_page_templates'):
        raise SystemExit(f'{path} missing addon_landing_page_templates')

api = (ROOT / 'functions/api/_lib/editable-settings.js').read_text(encoding='utf-8')
for key in ['business_profile','site_policies','document_templates','business_hours_holidays','navigation_footer','option_libraries','analytics_event_registry','media_requirements','landing_pages_content']:
    if key not in api:
        raise SystemExit(f'Build 189 failed: editable-settings helper missing {key}')

admin_page = (ROOT / 'admin-site-settings.html').read_text(encoding='utf-8')
if '/api/admin/editable_site_settings' not in admin_page or 'data-build189' not in admin_page:
    raise SystemExit('Build 189 admin-site-settings page missing API or build marker')

schema = (ROOT / 'SUPABASE_SCHEMA.sql').read_text(encoding='utf-8')
if 'Build 189 editable site settings sync' not in schema:
    raise SystemExit('SUPABASE_SCHEMA.sql missing Build 189 note')

print('Build 189 editable site settings guard passed.')
