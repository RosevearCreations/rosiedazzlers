#!/usr/bin/env bash
# Stable source-gate entry point. Retain all original assertions and fail closed.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build632_source_gate_dedup_test.mjs
node scripts/build339-vehicle-form-ux-gate.mjs
python3 scripts/build404_error_recovery_weak_connection_reliability_check.py
node scripts/build648_admin_operator_test.mjs
