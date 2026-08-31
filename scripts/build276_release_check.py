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


# Build 276 closes the false-red race discovered during Build 275 promotion.
# Finding the exact deployment is not sufficient: the matching Pages deployment
# must reach a successful terminal stage before Development HTTP smoke begins.
need(
    ".github/workflows/cloudflare-development-acceptance.yml",
    "fetch-depth: 0",
    "Run Build 276 focused guard",
    "python scripts/build276_release_check.py",
    "Confirm exact dev SHA reached successful Cloudflare Pages deployment",
    'ready="false"',
    "for attempt in $(seq 1 24)",
    'case "$matched_status" in',
    "success)",
    "failure|failed|canceled|cancelled)",
    "was found but did not become successful",
    "Record Production promotion boundary",
    "git merge-base origin/main origin/dev",
    "Development moved during acceptance",
    "never force-move main to dev",
    "through Build 276",
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
print("- exact-SHA Cloudflare acceptance waits for deployment success")
print("- stale Build 274 dev gate ownership is removed")
print("- current dev uses a cumulative Development Source Gate")
print("- Production promotion boundary is explicit and non-mutating")
