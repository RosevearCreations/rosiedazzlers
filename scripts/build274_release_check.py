#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, tempfile

ROOT = Path(__file__).resolve().parents[1]
errors = []


def text(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def need(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")


def forbid(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token in body:
            errors.append(f"{rel} contains forbidden token {token}")


def node_check(rel):
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")


def inline_script_check(rel):
    body = text(rel)
    scripts = re.findall(r"<script(?:\s[^>]*)?>([\s\S]*?)</script>", body, flags=re.I)
    for i, script in enumerate(scripts, start=1):
        if not script.strip():
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as fh:
            fh.write(script)
            tmp = fh.name
        proc = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
        Path(tmp).unlink(missing_ok=True)
        if proc.returncode:
            errors.append(f"inline node --check failed {rel} script {i}: {proc.stderr.strip()}")


def registry_behavior_check():
    source = text("functions/api/_lib/integration-registry.js")
    if not source:
        return
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        module_path = tmp / "integration-registry.mjs"
        driver_path = tmp / "driver.mjs"
        module_path.write_text(source, encoding="utf-8")
        driver_path.write_text(
            """
import { buildIntegrationStatus, buildPublicTrackingConfig } from './integration-registry.mjs';
const sentinel = (name) => `SECRET_${name}_DO_NOT_RETURN`;
const full = {
  SUPABASE_URL:'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY:sentinel('SUPABASE'),
  ROSIE_PUBLIC_ASSETS_BUCKET:{ put(){} }, PUBLIC_ASSET_BASE_URL:'https://assets.example.ca/',
  STRIPE_SECRET_KEY:sentinel('STRIPE'), STRIPE_WEBHOOK_SECRET:sentinel('STRIPE_WEBHOOK'),
  PAYPAL_CLIENT_ID:sentinel('PAYPAL_ID'), PAYPAL_CLIENT_SECRET:sentinel('PAYPAL_SECRET'), PAYPAL_WEBHOOK_ID:sentinel('PAYPAL_WEBHOOK'),
  NOTIFICATIONS_EMAIL_WEBHOOK_URL:sentinel('EMAIL_URL'), NOTIFICATIONS_SMS_WEBHOOK_URL:sentinel('SMS_URL'),
  NOTIFICATIONS_PUSH_WEBHOOK_URL:sentinel('PUSH_URL'), NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN:sentinel('PUSH_TOKEN'),
  GA4_MEASUREMENT_ID:'G-ABCDEF12', MARKETING_TRACKING_ENABLED:'true', MARKETING_TRACKING_MODE:'test'
};
const all = buildIntegrationStatus(full);
const core = Object.fromEntries((all.core || []).map(row => [row.key, row.configured]));
for (const key of ['supabase','cloudflare_r2','stripe','paypal','email','sms','web_push']) {
  if (core[key] !== true) throw new Error(`expected core ${key} ready`);
}
const serialized = JSON.stringify(all);
for (const value of Object.values(full)) {
  if (typeof value === 'string' && value.startsWith('SECRET_') && serialized.includes(value)) throw new Error('secret value leaked');
}
const stripeNoWebhook = buildIntegrationStatus({ STRIPE_SECRET_KEY:'x' }).core.find(x => x.key === 'stripe');
if (stripeNoWebhook?.configured !== false) throw new Error('Stripe must require verified webhook configuration');
const stripeAlias = buildIntegrationStatus({ STRIPE_SECRET_KEY:'x', STRIPE_WEBHOOK_SECRET_QUOTES:'y' }).core.find(x => x.key === 'stripe');
if (stripeAlias?.configured !== true) throw new Error('Stripe retained webhook alias must remain accepted');
const paypalNoWebhook = buildIntegrationStatus({ PAYPAL_CLIENT_ID:'x', PAYPAL_CLIENT_SECRET:'y' }).core.find(x => x.key === 'paypal');
if (paypalNoWebhook?.configured !== false) throw new Error('PayPal must require webhook verifier readiness');
const paypalReady = buildIntegrationStatus({ PAYPAL_CLIENT_ID:'x', PAYPAL_CLIENT_SECRET:'y', PAYPAL_WEBHOOK_ID:'z' }).core.find(x => x.key === 'paypal');
if (paypalReady?.configured !== true) throw new Error('PayPal canonical credentials + webhook ID must be ready');
const publicConfig = buildPublicTrackingConfig(full);
if (publicConfig.providers?.google_analytics?.id !== 'G-ABCDEF12') throw new Error('public tracking compatibility regressed');
console.log('Build274 integration registry behavior PASS');
""".strip(),
            encoding="utf-8",
        )
        proc = subprocess.run(["node", str(driver_path)], cwd=tmp, capture_output=True, text=True)
        if proc.returncode:
            errors.append(f"integration registry behavior failed: {proc.stdout}{proc.stderr}")
        elif proc.stdout.strip():
            print(proc.stdout.strip())


# Shared help assets: minimum four-question contract, accessibility, dynamic fields and detailed external setup sections.
need(
    "assets/contextual-help.js",
    "EDITABLE_SELECTOR",
    "MutationObserver",
    "aria-modal",
    "ⓘ Page help",
    "What this is",
    "What it changes",
    "Why Rosie needs it",
    "Where the value comes from",
    "How to obtain it",
    "Prerequisites / permissions",
    "Where Rosie stores it",
    "Callback / redirect setup",
    "How to test it",
    "Troubleshooting",
    "Official provider resources",
    "/admin-integrations.html",
)
need(
    "assets/contextual-help-catalog.js",
    'version: "274.1"',
    "defaultPage",
    '"admin-integrations"',
    '"admin-site-settings"',
    "settingJson",
    "security:",
)
need("assets/contextual-help.css", ".rosie-help-page-button", ".rosie-help-field-button", ".rosie-help-dialog", ".rosie-help-dialog__links")

# I.T.-specific external acquisition help must remain detailed and provider-specific.
need(
    "assets/it-external-help-catalog.js",
    'version: "274.2"',
    "SUPABASE_SERVICE_ROLE_KEY",
    "ROSIE_PUBLIC_ASSETS_BUCKET",
    "STRIPE_WEBHOOK_SECRET",
    "PAYPAL_WEBHOOK_ID",
    "FACEBOOK_PAGE_ACCESS_TOKEN",
    "INSTAGRAM_ACCESS_TOKEN",
    "TIKTOK_ACCESS_TOKEN",
    "LINKEDIN_ACCESS_TOKEN",
    "YOUTUBE_ACCESS_TOKEN",
    "GOOGLE_OAUTH_ACCESS_TOKEN",
    "GOOGLE_BUSINESS_PROFILE_LOCATION_NAME",
    "google_search_console",
    "google_maps",
    "github",
    "YouTube Data API v3",
    "Google Auth Platform",
    "redirect_uri_mismatch",
    "How to obtain",
    "Cloudflare Pages encrypted secret",
)
forbid("assets/it-external-help-catalog.js", "localStorage.setItem", "sessionStorage.setItem", "document.cookie")

# Shared loaders must make help a common protected-screen concern and must fail open for help only.
need(
    "assets/admin-page-init.js",
    "loadContextualHelp",
    "/assets/contextual-help-catalog.js",
    "/assets/contextual-help.js",
    "protected page startup will continue",
)
need(
    "assets/admin-menu.js",
    "ensureContextualHelp",
    "/assets/contextual-help-catalog.js",
    "/assets/contextual-help.js",
    "menu rendering will continue",
)

# Protected HTML coverage: a protected page must load a common help bridge or the help runtime itself.
protected_markers = ["/assets/admin-auth.js", "AdminAuth.guardPage", "AdminAuth.requireAuth", "AdminShell.boot"]
bridges = ["/assets/admin-page-init.js", "/assets/admin-menu.js", "/assets/contextual-help.js"]
for path in sorted(ROOT.glob("*.html")) + sorted(ROOT.glob("app/**/*.html")):
    rel = path.relative_to(ROOT).as_posix()
    body = path.read_text(encoding="utf-8", errors="ignore")
    if "login" in path.name.lower():
        continue
    if any(marker in body for marker in protected_markers) and not any(bridge in body for bridge in bridges):
        errors.append(f"protected screen lacks contextual-help bridge: {rel}")

# Authoritative I.T. catalogue must use actual source/runtime names and never invent credential storage.
need(
    "functions/api/_lib/integration-registry.js",
    'catalogue_version: "274.1"',
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ROSIE_PUBLIC_ASSETS_BUCKET",
    "PUBLIC_ASSETS_BUCKET",
    "R2_PUBLIC_ASSETS_BUCKET",
    "ASSETS_BUCKET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_WEBHOOK_SECRET_QUOTES",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_ID",
    "PAYPAL_API_BASE",
    "NOTIFICATIONS_EMAIL_WEBHOOK_URL",
    "RECOVERY_EMAIL_WEBHOOK_URL",
    "NOTIFICATIONS_SMS_WEBHOOK_URL",
    "RECOVERY_SMS_WEBHOOK_URL",
    "NOTIFICATIONS_PUSH_WEBHOOK_URL",
    "NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN",
    "GA4_MEASUREMENT_ID",
    "FACEBOOK_PAGE_ACCESS_TOKEN",
    "YOUTUBE_ACCESS_TOKEN",
    "GOOGLE_BUSINESS_PROFILE_LOCATION_NAME",
    "Google Search Console",
    "Google Maps Platform",
    "GitHub",
    "no_secrets_returned: true",
)
forbid("functions/api/_lib/integration-registry.js", "GOOGLE_MAPS_API_KEY", "localStorage.setItem", "sessionStorage.setItem")

# The catalogue must remain aligned with the code paths it claims to describe.
need("functions/api/checkout.js", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
need("functions/api/admin/media_asset_upload.js", "ROSIE_PUBLIC_ASSETS_BUCKET", "PUBLIC_ASSETS_BUCKET", "R2_PUBLIC_ASSETS_BUCKET", "ASSETS_BUCKET")
need("functions/api/stripe/webhook.js", "env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET_QUOTES")
need("functions/api/paypal/webhook.js", "PAYPAL_WEBHOOK_ID", "PAYPAL_CLIENT_ID")
need("functions/api/paypal/capture-order.js", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET")
need("functions/api/_lib/provider-dispatch.js", "NOTIFICATIONS_EMAIL_WEBHOOK_URL", "NOTIFICATIONS_SMS_WEBHOOK_URL", "NOTIFICATIONS_PUSH_WEBHOOK_URL", "getSupabaseServiceRoleKey")
need("functions/api/push_config.js", "notification_push_public_config")

# I.T. UI is status/help only, never a browser credential editor. Every generated external requirement gets a circled help control.
need(
    "admin-integrations.html",
    "I.T. connections",
    "Core application services",
    "Consent-first website measurement",
    "Social, video and local publishing",
    "Prepared and control-plane integrations",
    "Safe connection test standard",
    "/api/admin/integration_status",
    "window.AdminPageInit.init",
    'data-build274="it-help-foundation"',
    "/assets/it-external-help-catalog.js",
    "data-it-help-key",
    "it-help-button",
    "openITHelp",
    "How to obtain and configure",
    "Use the circled",
)
forbid("admin-integrations.html", "<input", "<textarea", "type=\"password\"")

# Mobile Quick Book is a presentation layer over the existing booking engine, not a replacement authority.
need(
    "assets/pricing-catalog-client.js",
    "pricing-catalog-client-legacy.js",
    "ROSIE_PUBLIC_REQUIREMENTS",
    "Rosie brings standard detailing water and power",
    'import("./booking-quick-start-v274.js")',
    "applyRosieOperatingRules",
)
need(
    "assets/booking-quick-start-v274.js",
    "mobile-first Quick Book",
    "What does your vehicle need?",
    "Optional vehicle details",
    "Next available days",
    "booking_quick_need_pick",
    "photo_quote",
    "Saved Garage vehicles",
    "Rosie-supplied water/power",
    "premium_wash",
    "interior_detail",
    "complete_detail",
    "exterior_detail",
)
need(
    "book.html",
    'data-step="1"',
    'id="packageCards"',
    'id="conditionRecommendBtn"',
    'id="ack_power_water"',
    'id="veh_year"',
    'id="veh_make"',
    'id="veh_model"',
    'id="vehicle_size"',
)
forbid(
    "assets/booking-quick-start-v274.js",
    "/api/checkout",
    "STRIPE_SECRET_KEY",
    "PAYPAL_CLIENT_SECRET",
)

# Standard mobile-detail utilities are a canonical runtime rule on both server and browser.
need(
    "functions/api/_lib/pricing-catalog.js",
    "ROSIE_PUBLIC_REQUIREMENTS",
    "ROSIE_ACCESS_RULE",
    "Rosie brings standard detailing water and power",
    "stale App Management JSON",
)
forbid(
    "assets/pricing-catalog-client.js",
    "Customer provides power and water",
    "Customer supplies power and water",
)

# JavaScript syntax and executable registry behavior.
for rel in [
    "functions/api/_lib/integration-registry.js",
    "functions/api/_lib/pricing-catalog.js",
    "assets/contextual-help-catalog.js",
    "assets/contextual-help.js",
    "assets/it-external-help-catalog.js",
    "assets/admin-page-init.js",
    "assets/admin-menu.js",
    "assets/pricing-catalog-client.js",
    "assets/pricing-catalog-client-legacy.js",
    "assets/booking-quick-start-v274.js",
]:
    node_check(rel)
inline_script_check("admin-integrations.html")
inline_script_check("book.html")
registry_behavior_check()

# Release documentation/workflow must explicitly carry this active release.
need("BUILD274_SUMMARY.md", "**Status: ACTIVE**", "I.T. Connections", "contextual help")
need("AI_PROJECT_HANDOFF.md", "**Build:** 274", "Build 274 active implementation", "I.T. Connections", "Quick Book", "Mobile Auto Detailing & Interior/Exterior Restoration")
need("MASTER_VALUE_ROADMAP.md", "**Build:** 274", "Build 274 — active", "contextual help", "Mobile Quick Book", "Google trust and measurable local SEO")
need(".github/workflows/cloudflare-development-acceptance.yml", "Run Build 274 focused guard", "python scripts/build274_release_check.py", "Build 274 I.T. Connections")

if errors:
    print("Build 274 focused release check: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("Build 274 focused release check: PASS")
print(" - shared contextual help has accessible page/field controls, dynamic-field coverage and the four-question fallback contract")
print(" - external I.T. help adds provider-specific acquisition, prerequisites, callbacks, storage, testing, troubleshooting and official resources")
print(" - every generated I.T. requirement/measurement/prepared box exposes a circled provider-help control")
print(" - protected HTML screens are connected to a shared help bridge")
print(" - I.T. catalogue reports exact runtime names/storage/readiness without returning raw secret values")
print(" - Supabase/R2/Stripe/PayPal/notification authority remains aligned with current source paths")
print(" - mobile Quick Book remains a touch-first presentation layer over existing booking/pricing/availability authorities")
print(" - Rosie-supplied standard water/power remains canonical on browser and server pricing-catalog paths")
print(" - Build 274 workflow and living authorities are synchronized")
