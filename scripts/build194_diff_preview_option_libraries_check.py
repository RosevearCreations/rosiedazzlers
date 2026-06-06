#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
missing = []

def need(rel, needles):
    path = ROOT / rel
    if not path.exists():
        missing.append(f"{rel}: file missing")
        return ""
    text = path.read_text(encoding="utf-8", errors="replace")
    for needle in needles:
        if needle not in text:
            missing.append(f"{rel}: missing {needle!r}")
    return text

need("functions/api/admin/editable_site_settings_compare.js", [
    'build: "194"', 'diffObjects', 'fallbackForKey', 'loadRecentHistory'
])
need("functions/api/admin/analytics_registry_add_event.js", [
    'build: "194"', 'saveEditableSetting', 'analytics_event_registry', 'added_from_warning'
])
need("assets/admin-option-libraries.js", [
    'AdminOptionLibraries', 'data-option-library', 'option_libraries', 'hydrate'
])
for rel in ["admin-site-settings.html", "admin-site-settings/index.html"]:
    need(rel, [
        'data-build194="diff-preview-permissions"', 'compareBtn', 'renderFallbackDiff',
        'renderDomainPreview', 'renderSeoLengthWarnings', 'domainPermissionMap'
    ])
for rel in ["admin-analytics.html", "admin-analytics/index.html"]:
    need(rel, [
        'data-build194="analytics-registry-quick-add"', 'analytics_registry_add_event',
        'bindRegistryWarningButtons', 'data-add-registry-event'
    ])
for rel in ["admin-booking.html", "admin-booking/index.html"]:
    need(rel, [
        '/assets/admin-option-libraries.js', 'data-option-library="finance_entry_types"',
        'data-option-library="booking_statuses"', 'formatBusinessHourWarnings'
    ])
need("admin-catalog.html", ['/assets/admin-option-libraries.js', 'data-option-library="stock_actions"'])
need("admin-leads.html", ['/assets/admin-option-libraries.js', 'data-option-library="lead_statuses"'])
need("functions/api/_lib/staff-auth.js", ['case "view_analytics":', 'case "manage_settings":'])
need("sql/2026-06-06_build194_diff_preview_option_libraries_no_ddl_note.sql", [
    'Build 194 diff/preview/option-library pass', 'No database schema changes'
])
for rel in ["DEVELOPMENT_ROADMAP.md", "KNOWN_GAPS_AND_RISKS.md", "DATABASE_STRUCTURE_CURRENT.md", "SUPABASE_SCHEMA.sql", "README.md"]:
    need(rel, ["Build 194"])

if missing:
    print("Build 194 diff/preview/option-library check failed:")
    for item in missing:
        print(" -", item)
    sys.exit(1)
print("Build 194 diff/preview/option-library check passed.")
