#!/usr/bin/env bash
set -euo pipefail
# Retained current source authority: independent device witness, signed Master ACK,
# exact source custody and non-authorizing consent-safe scoped review.
node scripts/build850_custody_receiver_test.mjs
node scripts/build851_original_device_receiver_test.mjs
