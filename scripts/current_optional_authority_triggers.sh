#!/usr/bin/env bash
# Stable, fail-closed entry point for optional authority workflow trigger regression.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build633_optional_authority_triggers_test.mjs
node scripts/build634_optional_authority_cohort_b_test.mjs
