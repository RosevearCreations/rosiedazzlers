#!/usr/bin/env bash
set -euo pipefail
# Retained current source authority: independent device witness, signed Master ACK,
# exact source custody and non-authorizing consent-safe scoped review.
node scripts/build850_custody_receiver_test.mjs
node scripts/build851_original_device_receiver_test.mjs
node --check functions/api/_lib/jobday-continuity-852.js
node --check functions/api/admin/jobday_continuity_852.js
node scripts/build852_recall_continuity_test.mjs
