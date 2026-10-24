#!/usr/bin/env bash
# Stable source-gate entry point for current customer booking regressions.
# Retained numbered test fixtures are historical contracts; the workflow
# calls this release-number-neutral wrapper without dropping any assertions.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build627_customer_wizard_usability_test.mjs
node scripts/build628_booking_context_help_test.mjs
node scripts/build629_package_comparison_test.mjs
node scripts/build630_booking_draft_safe_return_test.mjs
