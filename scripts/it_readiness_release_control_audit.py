#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    target = ROOT / path
    if not target.exists():
        raise SystemExit(f"FAIL: required file is missing: {path}")
    return target.read_text(encoding="utf-8")


def require(source: str, needle: str, label: str) -> None:
    if needle not in source:
        raise SystemExit(f"FAIL: {label}: missing {needle!r}")
    print(f"PASS: {label}")


def forbid(source: str, needle: str, label: str) -> None:
    if needle in source:
        raise SystemExit(f"FAIL: {label}: forbidden {needle!r}")
    print(f"PASS: {label}")


api = text("functions/api/admin/system_gate.js")
page = text("app/it/index.html")
client = text("apps/it/it-app.js")

require(api, "build: 353", "System Gate reports the current readiness build")
require(api, 'requireActionAccess(auth.actor, "it.runtime.view")', "readiness gate requires explicit I.T. runtime permission")
require(api, "runtime_commit_sha: runtimeInfo.commit_sha", "release control returns exact runtime commit identity when available")
require(api, "github_ci_status_fetched_by_runtime: false", "runtime does not pretend to own GitHub CI state")
require(api, "GitHub exact-SHA checks remain the release authority", "GitHub exact-SHA checks remain authoritative")
require(api, "traffic_light:", "readiness gate exposes GREEN/AMBER/RED state")
require(api, "diagnostics,", "readiness gate returns categorized diagnostics")
require(api, 'production_business_data_mutation: "closed"', "Production business-data mutation is closed")
require(api, 'database_schema_mutation: "closed"', "schema mutation is closed")
require(api, 'r2_mutation: "closed"', "R2 mutation is closed")
require(api, 'payment_provider_mutation: "closed"', "payment-provider mutation is closed")
require(api, 'deployment_mutation: "closed"', "deployment mutation is closed")
require(api, "secret_values_exposed: false", "secret values are never exposed")
require(api, "supabase_service_configured:", "configuration presence is reported without secret values")
require(api, "private_daip_r2_binding_configured:", "private DAIP R2 binding presence is reported")
require(api, "stripe_mode:", "Stripe mode is reported without returning its credential")
require(api, "corrective_action:", "diagnostics provide corrective actions")
require(api, "System Gate is read-only", "POST remains fail-closed")

require(page, "I.T. Readiness & Release Control", "I.T. shell exposes release control as the first-class workspace")
require(page, "Opening I.T. runs no readiness test", "opening I.T. starts no diagnostic automatically")
require(page, "Run read-only readiness gate", "readiness proof requires explicit operator initiation")
require(page, "GitHub exact-SHA gates", "I.T. shell links to the external exact-SHA authority")
require(page, "Secret values are never returned to the browser", "I.T. shell states the secret boundary")
require(page, "Production business-data mutation", "I.T. shell states the Production mutation boundary")
require(page, "data-build=\"353\"", "I.T. shell carries the current build marker")
forbid(page, "setInterval(", "I.T. shell has no polling interval")

require(client, "/api/admin/system_gate", "client uses the canonical System Gate endpoint")
require(client, "github_ci_authority", "client renders the exact-SHA CI authority statement")
require(client, "production_business_data_mutation", "client renders the Production mutation state")
require(client, "corrective_action", "client renders diagnostic correction guidance")
require(client, "No polling or automatic mutation was performed.", "client states bounded execution")
forbid(client, "setInterval(", "I.T. client has no polling interval")

for forbidden in ["SUPABASE_SERVICE_ROLE_KEY}", "STRIPE_SECRET_KEY}", "PAYPAL_CLIENT_SECRET}"]:
    forbid(page, forbidden, "browser page contains no server secret interpolation")
    forbid(client, forbidden, "browser client contains no server secret interpolation")

print("PASS: Build 353 I.T. readiness and release-control authority is bounded, diagnostic, exact-SHA aware, and non-mutating.")
