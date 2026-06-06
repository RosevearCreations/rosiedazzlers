#!/usr/bin/env python3
from pathlib import Path
import json
import re
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

social = need("functions/api/admin/social_templates_list.js", [
    'String(cleanText(url.searchParams.get("platform")) || "").toLowerCase()',
    'String(cleanText(url.searchParams.get("service_area")) || "").toLowerCase()',
    'String(cleanText(row.platform) || "").toLowerCase()',
    'String(cleanText(row.service_area) || "").toLowerCase()',
    'FALLBACK_CAPTION_TEMPLATES',
    'FALLBACK_HASHTAG_PRESETS'
])
for unsafe in [
    'cleanText(url.searchParams.get("platform")).toLowerCase()',
    'cleanText(url.searchParams.get("service_area")).toLowerCase()',
    'cleanText(row.platform).toLowerCase()',
    'cleanText(row.service_area).toLowerCase()'
]:
    if unsafe in social:
        missing.append(f"functions/api/admin/social_templates_list.js: still has unsafe {unsafe}")

for rel in ["admin-social.html", "admin-social/index.html"]:
    need(rel, [
        'data-build193="social-template-endpoint-hotfix"',
        'templateOptionsNotice',
        'renderTemplateOptionSelects',
        'setTemplateOptionsNotice',
        'Manual draft writing still works'
    ])

schema_path = ROOT / "data/editable_setting_validation_schemas.json"
if not schema_path.exists():
    missing.append("data/editable_setting_validation_schemas.json: file missing")
else:
    try:
        data = json.loads(schema_path.read_text(encoding="utf-8"))
        schemas = data.get("schemas", {})
        if data.get("version") != "193.0.0":
            missing.append("data/editable_setting_validation_schemas.json: version should be 193.0.0")
        for key in [
            "business_profile", "site_policies", "document_templates", "business_hours_holidays",
            "navigation_footer", "option_libraries", "analytics_event_registry", "media_requirements",
            "landing_pages_content"
        ]:
            if key not in schemas:
                missing.append(f"data/editable_setting_validation_schemas.json: missing schema {key}")
    except Exception as exc:
        missing.append(f"data/editable_setting_validation_schemas.json: invalid JSON: {exc}")

need("functions/api/_lib/editable-settings.js", [
    'editable_setting_validation_schemas.json',
    'EDITABLE_SETTING_VALIDATION_SCHEMAS',
    'validateTemplateTokens',
    'validateLinkRows',
    'schema_version'
])
need("functions/api/admin/editable_site_settings_validate.js", [
    'onRequestGet',
    'EDITABLE_SETTING_VALIDATION_SCHEMAS',
    'build: "193"'
])
need("admin-site-settings.html", [
    'data-build193="field-validation-template-token-drawer"',
    'forceSyncBtn',
    'template-token-reference',
    'navigation-link-validation',
    'validation.warnings'
])
need("sql/2026-06-05_build193_social_templates_validation_no_ddl_note.sql", [
    "Build 193 social template endpoint",
    "No database schema changes"
])
for rel in ["DEVELOPMENT_ROADMAP.md", "KNOWN_GAPS_AND_RISKS.md", "DATABASE_STRUCTURE_CURRENT.md", "SUPABASE_SCHEMA.sql", "README.md"]:
    need(rel, ["Build 193"])

if missing:
    print("Build 193 social templates and validation check failed:")
    for item in missing:
        print(" -", item)
    sys.exit(1)
print("Build 193 social templates and validation check passed.")
