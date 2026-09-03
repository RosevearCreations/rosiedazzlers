#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
BASE_URL="${BASE_URL%/}"

# Build 308 changes release tooling, not application runtime. Prove that the
# accepted Development application still passes the established full read-only
# HTTP/API boundary after the tooling consolidation.
SMOKE_RETRY_MODE=1 SMOKE_SCOPE=full bash scripts/development_http_smoke.sh "$BASE_URL" "Build 308 Development runtime"

echo "Build 308 Development runtime smoke: PASS at ${BASE_URL}"
