#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []


def text(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


smoke = text("scripts/development_http_smoke.sh")
workflow = text(".github/workflows/cloudflare-development-acceptance.yml")
dev_gate = text(".github/workflows/development-source-gate.yml")
summary = text("BUILD281_SUMMARY.md")
routes = text("_routes.json")

for token in [
    "Cache-Control: no-cache",
    "SMOKE_RETRY_MODE",
    "SMOKE_SCOPE",
    '[[ "$SMOKE_SCOPE" == "full" ]]',
    '[[ "$code" == "404" || "$code" =~ ^5 ]]',
    "Staff App Launcher",
    "self-contained mobile operating water and power",
    'data-build278="local-seo-depth"',
    "tillsonburg-auto-detailing/",
    "2026-08-31",
]:
    if token not in smoke:
        errors.append(f"Development smoke helper missing {token}")

for token in [
    "Run Build 281 focused guard",
    "Exact deployment HTTP smoke checks",
    "Development alias convergence smoke checks",
    "steps.deployment.outputs.deployment_url",
    "matched_uses_functions",
    'deployments/${matched_id}',
    'uses_functions=true',
    'SMOKE_SCOPE=static bash scripts/development_http_smoke.sh "$EXACT_DEV_URL" "Exact Development deployment"',
    'for alias_attempt in $(seq 1 12)',
    'SMOKE_RETRY_MODE=1 SMOKE_SCOPE=full bash scripts/development_http_smoke.sh "$CF_DEV_URL" "Development alias attempt ${alias_attempt}/12"',
    "sleep 5",
    "Production remains closed",
]:
    if token not in workflow:
        errors.append(f"Development acceptance missing Build 281 contract: {token}")

if '"/api/*"' not in routes:
    errors.append("Pages _routes.json no longer declares /api/* Functions routing")

if "Run current Build 281 focused guard" not in dev_gate:
    errors.append("Development Source Gate does not retain Build 281")

for token in [
    "exact deployment",
    "static artifact",
    "uses_functions",
    "branch alias",
    "dynamic/API",
    "bounded retry",
    "Production",
]:
    if token.lower() not in summary.lower():
        errors.append(f"Build 281 summary missing {token}")

if errors:
    print("Build 281 focused release check: FAIL")
    for error in errors:
        print(f" - {error}")
    raise SystemExit(1)

print("Build 281 focused release check: PASS")
print(" - exact Cloudflare deployment proves successful SHA + static artifact identity")
print(" - Cloudflare deployment metadata must report uses_functions=true for this /api/* Pages Functions project")
print(" - full dynamic/API smoke is reserved for the mutable dev alias and rejects missing 404 API routes")
print(" - dev alias convergence uses bounded retry; intermediate propagation misses are warnings")
print(" - Production remains closed and non-mutating")
