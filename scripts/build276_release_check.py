#!/usr/bin/env python3
from pathlib import Path
import re
import sys

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


def trigger_block(body):
    return body.split("permissions:", 1)[0]


# Build 276 closed the false-red readiness race. Build 308 may delegate the
# mechanics to a canonical helper, but the exact-SHA success wait and the
# non-mutating Production boundary remain mandatory.
need(
    ".github/workflows/cloudflare-development-acceptance.yml",
    "fetch-depth: 0",
    "Run Build 276 focused guard",
    "python scripts/build276_release_check.py",
    "Confirm exact dev SHA reached successful Cloudflare Pages deployment via canonical helper",
    "bash scripts/cloudflare_pages_development.sh accept",
    "Record acceptance boundary",
)
need(
    "scripts/cloudflare_pages_development.sh",
    "wait_for_exact_success 24 10",
    'case "$EXACT_STATUS" in',
    "failure|failed|canceled|cancelled",
    "record_production_boundary",
    "git merge-base origin/main origin/dev",
    "Development moved during acceptance",
    "never force-move main to dev",
    "Cloudflare Development exact-SHA acceptance: PASS",
)

# Historical build gates stay historical. They must not continue presenting
# stale build numbers as the current source gate on dev.
build274 = text(".github/workflows/build274-source-gate.yml")
if re.search(r"^\s*-\s*dev\s*$", trigger_block(build274), flags=re.M):
    errors.append("Build 274 source gate still triggers on dev")
need(
    ".github/workflows/build274-source-gate.yml",
    "build274-full-closure-queue",
    "Historical feature gate only; current dev uses Development Source Gate.",
)

# dev has one clearly named cumulative source authority.
dev_gate = text(".github/workflows/development-source-gate.yml")
if not re.search(r"^\s*-\s*dev\s*$", trigger_block(dev_gate), flags=re.M):
    errors.append("Development Source Gate does not trigger on dev")
need(
    ".github/workflows/development-source-gate.yml",
    "name: Development Source Gate",
    "Validate current Development source",
    "Run retained Build 275 focused guard",
    "Run current Build 276 focused guard",
    "python scripts/build276_release_check.py",
    "Run cumulative Rosie release guard",
    "git diff --check HEAD^",
    "Cloudflare Development acceptance remains separate",
)

# Build 276 feature work gets a source-only gate before exact-SHA dev promotion.
need(
    ".github/workflows/build276-source-gate.yml",
    "name: Build 276 Source Gate",
    "build276-release-reliability",
    "Validate Build 276 source",
    "python scripts/build276_release_check.py",
    "python scripts/build275_release_check.py",
    "python scripts/release_check.py",
    "No Cloudflare resource or Production branch is mutated",
)

# Release record must retain the strict dev-first / Production-closed boundary.
need(
    "BUILD276_SUMMARY.md",
    "# Rosie Dazzlers Build 276 — Reliability & Release Mechanics",
    "Build 275 is the accepted Development baseline",
    "Cloudflare readiness race",
    "Development Source Gate",
    "Production promotion boundary",
    "Production/main remains closed",
    "Builds 277–280",
)

if errors:
    print("Build 276 focused release checks FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 276 focused release checks passed.")
print("- exact-SHA Cloudflare acceptance still waits for deployment success")
print("- Build 308 may delegate that mechanism to the canonical Development helper")
print("- current dev uses a cumulative Development Source Gate")
print("- Production promotion boundary remains explicit and non-mutating")
