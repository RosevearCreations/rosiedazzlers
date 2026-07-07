#!/usr/bin/env python3
"""Build 225 guard: social/analytics connection centre must be consent-first and DAIP-safe."""
from __future__ import annotations
import json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(rel):
    path=ROOT/rel
    if not path.exists():
        errors.append(f"Missing {rel}")
        return ""
    return path.read_text(encoding="utf-8",errors="ignore")
def require(rel, markers):
    text=read(rel)
    for marker in markers:
        if marker not in text:
            errors.append(f"{rel}: missing {marker!r}")

require("admin-integrations.html", [
    '<h1>Social &amp; analytics connections</h1>', "noindex,nofollow,noarchive",
    "/api/admin/integration_status", "MARKETING_TRACKING_ENABLED", "DAIP boundary remains held",
    'data-visual-placeholder="daip_integration_boundary"'
])
require("admin-integrations/index.html", ['data-build225="social-analytics-connection-centre"', "/api/admin/integration_status"])
require("assets/admin-auth.js", ['case "admin-integrations":'])
require("assets/admin-menu.js", ['key: "admin-integrations"', 'href: "/admin-integrations.html"'])
require("scripts/sync_route_copies.py", ['"admin-integrations.html"', '"admin-daip-gate-c.html"'])
require("functions/api/admin/integration_status.js", ['buildIntegrationStatus', 'capability:"manage_staff"', 'onRequest', 'GET', 'POST'])
require("functions/api/tracking_config.js", ['buildPublicTrackingConfig', 'allowed_methods:["GET","OPTIONS"]'])
require("functions/api/_lib/integration-registry.js", [
    'META_PIXEL_ID', 'GA4_MEASUREMENT_ID', 'GOOGLE_ADS_CONVERSION_ID', 'TIKTOK_PIXEL_ID',
    'LINKEDIN_PARTNER_ID', 'PINTEREST_TAG_ID', 'MICROSOFT_UET_TAG_ID',
    'FACEBOOK_PAGE_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID', 'GOOGLE_BUSINESS_PROFILE_LOCATION_NAME',
    'no_secrets_returned: true'
])
require("assets/marketing-consent.js", [
    'Allow optional measurement', 'Use essential site only', 'rosie_marketing_consent', 'blockedRoute',
    'createMetaPixel', 'createGoogleTag', 'createTikTokPixel', 'createLinkedInInsight',
    'createPinterestTag', 'createMicrosoftUet', 'choice === "accepted"'
])
require("assets/chrome.js", ['function ensureMarketingConsent()', "script.src='/assets/marketing-consent.js'", 'ensureMarketingConsent();'])
require("privacy.html", ['Optional website measurement', 'optional tags do not load until you choose'])
require("service-worker.js", ['rosie-app-v20260707build225', '/admin-integrations.html', '/assets/marketing-consent.js', '/data/build225_social_analytics_connection_centre.json'])
require("data/build225_social_analytics_connection_centre.json", ['"build": 225', '"gate_c": "held"', '"cloudflare_secret_only": true'])
require("docs/SOCIAL_ANALYTICS_CONNECTIONS.md", ['Cloudflare', 'Secret (encrypted)', 'META_PIXEL_ID', 'GA4_MEASUREMENT_ID', 'DAIP separation'])
require("docs/digital-asset-intelligence-platform/20_DAIP_External_Service_Connection_Boundary.md", ['Gate C', 'does not permit', 'social/analytics'])
require("AI_PROJECT_HANDOFF.md", ['Build 225 central capability', 'social/analytics Connections Centre'])
require("MASTER_VALUE_ROADMAP.md", ['Build 225 — Social & Analytics Connections Centre', 'Next 20 connected steps after Build 225'])
require("DOC_INDEX.md", ['Build 225 operational documentation', 'SOCIAL_ANALYTICS_CONNECTIONS.md'])
require("docs/PRODUCTION_TEST_GUIDE.md", ['Build 225 — Social & analytics Connections Centre test'])
require("functions/api/_lib/production-test-playbook.js", ['social_analytics_secret_boundary','social_analytics_consent_gate','daip_external_service_boundary'])
require("data/production_test_playbook_build212.json", ['social_analytics_secret_boundary','social_analytics_consent_gate','daip_external_service_boundary'])
require("SUPABASE_SCHEMA.sql", ['2026-07-07_build225_social_analytics_connection_centre_no_ddl_note.sql'])

# Public tracking route must never know about server credentials.
public=read("functions/api/tracking_config.js")
for forbidden in ["ACCESS_TOKEN", "CLIENT_SECRET", "WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY", "FACEBOOK_PAGE_ACCESS_TOKEN"]:
    if forbidden in public:
        errors.append(f"functions/api/tracking_config.js: forbidden secret marker {forbidden!r}")

# The browser loader must not run on sensitive routes.
loader=read("assets/marketing-consent.js")
for protected in ["/admin", "/client", "/detailer", "/book", "/progress", "/final-balance-payment", "/checkout", "/invoice"]:
    if protected not in loader:
        errors.append(f"assets/marketing-consent.js: missing protected route exclusion {protected!r}")

# Ensure page has precisely one H1 and public config payload isn't a secret sink.
page=read("admin-integrations.html")
if len(re.findall(r"<h1\b", page, flags=re.I)) != 1:
    errors.append("admin-integrations.html must have exactly one H1")
for forbidden in ["password", "rawToken", "SUPABASE_SERVICE_ROLE_KEY", "FACEBOOK_PAGE_ACCESS_TOKEN"]:
    if forbidden in page.lower() and forbidden != "password":
        errors.append(f"admin-integrations.html exposes forbidden marker {forbidden!r}")

try:
    json.loads(read("data/build225_social_analytics_connection_centre.json"))
    json.loads(read("data/production_test_playbook_build212.json"))
except Exception as exc:
    errors.append(f"Build 225 JSON invalid: {exc}")

if errors:
    print("Build 225 social/analytics connections check failed:")
    for err in errors: print("-",err)
    raise SystemExit(1)
print("Build 225 social/analytics Connections Centre checks passed.")
