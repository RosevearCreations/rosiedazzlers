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

need("functions/api/_lib/editable-settings.js", ["field_results", "addSeoLengthFieldResults", "build: \"195\""])
need("data/editable_setting_validation_schemas.json", ["195.0.0", "field_results"])
need("functions/api/admin/editable_site_settings_history_diff.js", ["build: \"195\"", "diffObjects", "history_id"])
need("functions/api/admin/document_template_preview.js", ["build: \"195\"", "sample_variables", "unknown_tokens"])
need("functions/api/admin/document_template_send_test.js", ["build: \"195\"", "dry_run_no_external_send", "queue_preview"])
need("functions/api/admin/editable_navigation_link_scan.js", ["build: \"195\"", "duplicate_href", "internal_clean_route_verify_after_deploy"])
need("functions/api/admin/sitemap_robots_preview.js", ["build: \"195\"", "sitemap_preview", "robots_preview"])
need("functions/api/admin/structured_data_preview.js", ["build: \"195\"", "LocalBusiness", "service_pages"])
need("functions/api/admin/editable_settings_audit_export.js", ["build: \"195\"", "text/csv", "editable-settings-audit-build195.csv"])
need("functions/api/admin/editable_settings_fallback_report.js", ["build: \"195\"", "fallback_backed", "dashboard_message"])
need("functions/api/admin/media_requirements_compare.js", ["build: \"195\"", "compareMedia", "changed_count"])
need("functions/api/admin/invoice_export_package.js", ["build: \"195\"", "policy_stamp", "renderHtml"])
need("functions/api/_lib/booking-documents.js", ["policy_stamp", "loadPolicyStamp", "policy_version"])
need("functions/api/admin/booking_save.js", ["recordBusinessHoursOverrideIfNeeded", "booking_business_hours_override", "override_log"])
for rel in ["admin-site-settings.html", "admin-site-settings/index.html"]:
    need(rel, ["data-build195=\"schema-history-template-export-previews\"", "fieldMarkersBtn", "renderSelectedHistoryDiff", "renderTemplatePreview", "renderLinkScan", "renderSitemapPreview", "renderStructuredDataPreview", "renderAuditExport", "renderFallbackReport", "renderMediaRequirementsDiff"])
for rel in ["admin.html", "admin/index.html"]:
    need(rel, ["data-build195=\"seo-proof-fallback-report-dashboard\"", "fallbackSettingsReport", "localSeoProofDiagnostics", "loadFallbackSettingsReport", "loadLocalSeoProofDiagnostics"])
for rel in ["invoice.html", "invoice/index.html", "order-confirmation.html", "order-confirmation/index.html"]:
    need(rel, ["Policy version"])
for rel in ["admin-payments.html", "admin-content.html", "admin-tax-review.html", "admin-media-health.html"]:
    need(rel, ["/assets/admin-option-libraries.js", "data-option-library"])
need("sql/2026-06-06_build195_schema_history_template_export_no_ddl_note.sql", ["Build 195", "No database schema changes"])
for rel in ["DEVELOPMENT_ROADMAP.md", "KNOWN_GAPS_AND_RISKS.md", "DATABASE_STRUCTURE_CURRENT.md", "SUPABASE_SCHEMA.sql", "README.md", "DOC_INDEX.md"]:
    need(rel, ["Build 195"])

if missing:
    print("Build 195 schema/history/template/export check failed:")
    for item in missing:
        print(" -", item)
    sys.exit(1)
print("Build 195 schema/history/template/export check passed.")
