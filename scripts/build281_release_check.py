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
helper = text("scripts/cloudflare_pages_development.sh")
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

# Build 308 centralizes the exact-deployment mechanics. Retain Build 281's
# evidence semantics in the helper instead of requiring duplicated inline YAML.
for token in [
    "Run Build 281 focused guard",
    "bash scripts/cloudflare_pages_development.sh accept",
    "Production promotion",
]:
    if token not in workflow:
        errors.append(f"Development acceptance missing retained Build 281 contract: {token}")

for token in [
    "wait_for_exact_success 24 10",
    "EXACT_USES_FUNCTIONS",
    '[[ "$EXACT_USES_FUNCTIONS" == "true" ]]',
    "smoke_exact",
    "smoke_alias",
    'for attempt in $(seq 1 12)',
    "SMOKE_RETRY_MODE=1 SMOKE_SCOPE=full",
    "sleep 5",
    "record_production_boundary",
    "Production remains closed",
]:
    if token not in helper:
        errors.append(f"Canonical Development helper missing Build 281 contract: {token}")

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
print(" - exact Cloudflare deployment still proves successful SHA + static artifact identity")
print(" - Cloudflare deployment metadata must still report uses_functions=true")
print(" - full dynamic/API smoke remains reserved for the mutable dev alias")
print(" - dev alias convergence still uses bounded retry")
print(" - Build 308 may centralize those mechanics without weakening Production isolation")
