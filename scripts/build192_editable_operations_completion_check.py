#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
checks = {
    'admin-site-settings.html': [
        'data-build192="structured-editors-history-restore"',
        'function renderHistoryRestoreList()',
        '/api/admin/editable_site_settings_restore',
        'case "site_policies"',
        'case "document_templates"',
        'case "business_hours_holidays"',
        'case "option_libraries"',
        'case "analytics_event_registry"',
        'case "media_requirements"',
        'case "landing_pages_content"',
    ],
    'book.html': [
        'data-policy-copy="driveway_access"',
        'data-policy-copy="water_power"',
        'business_hours_conflict',
        'Business hours/holiday warning',
    ],
    'functions/api/availability.js': [
        'loadEditableSetting',
        'business_hours_conflict',
        'holiday_closures',
    ],
    'functions/api/admin/booking_save.js': [
        'businessHoursWarning',
        'holiday_closure',
        'business_hours_closed',
    ],
    'functions/api/_lib/booking-documents.js': [
        'DEFAULT_DOCUMENT_TEMPLATES',
        'renderDocumentTemplate',
        'rendered_templates',
        'appointment_confirmation',
        'invoice',
    ],
    'functions/api/admin/analytics_registry_warnings.js': [
        'analytics_event_registry',
        'unknown_event_count',
        'Add this event to analytics_event_registry',
    ],
    'admin-analytics.html': [
        'analytics-registry-warnings',
        '/api/admin/analytics_registry_warnings',
    ],
    'admin-media-health.html': [
        'media-requirements-db-sync',
        'media_requirements',
        '/api/admin/editable_site_settings_restore',
    ],
    'admin.html': [
        'editableSettingsDiagnostics',
        '/api/admin/editable_site_settings_status',
    ],
    'admin-app.html': [
        'loadSharedOptionLibraries',
        'data-option-library="communication_channels"',
    ],
    'data/document_templates.json': ['192.0.0', '{{customer_name}}', '{{invoice_url}}'],
    'data/admin_option_libraries.json': ['communication_channels', 'finance_entry_types', 'booking_statuses'],
    'SUPABASE_SCHEMA.sql': ['Build 192'],
}
missing = []
for rel, needles in checks.items():
    path = ROOT / rel
    if not path.exists():
        missing.append(f'{rel}: file missing')
        continue
    text = path.read_text(encoding='utf-8', errors='replace')
    for needle in needles:
        if needle not in text:
            missing.append(f'{rel}: missing {needle!r}')

required_files = [
    'functions/api/admin/analytics_registry_warnings.js',
    'sql/2026-06-05_build192_editable_operations_completion_no_ddl_note.sql',
]
for rel in required_files:
    if not (ROOT / rel).exists():
        missing.append(f'{rel}: file missing')

if missing:
    print('Build 192 editable operations completion check failed:')
    for item in missing:
        print(' -', item)
    sys.exit(1)
print('Build 192 editable operations completion check passed.')
