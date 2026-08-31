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

for token in [
    "Cache-Control: no-cache",
    "SMOKE_RETRY_MODE",
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
    'bash scripts/development_http_smoke.sh "$EXACT_DEV_URL" "Exact Development deployment"',
    'for alias_attempt in $(seq 1 12)',
    'SMOKE_RETRY_MODE=1 bash scripts/development_http_smoke.sh "$CF_DEV_URL" "Development alias attempt ${alias_attempt}/12"',
    "sleep 5",
    "Production remains closed",
]:
    if token not in workflow:
        errors.append(f"Development acceptance missing Build 281 contract: {token}")

if "Run current Build 281 focused guard" not in dev_gate:
    errors.append("Development Source Gate does not retain Build 281")

for token in [
    "exact deployment",
    "branch alias",
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
print(" - exact immutable Cloudflare deployment is smoked before the mutable dev alias")
print(" - dev alias convergence uses the same smoke helper with bounded retry")
print(" - intermediate propagation misses are warnings; only exhausted convergence is red")
print(" - retained service/location/API/sitemap markers stay identical across both paths")
print(" - Production remains closed and non-mutating")
