#!/usr/bin/env bash
set -euo pipefail

node --check functions/api/gifts/webhook.js
node --check functions/api/admin/gift_issuance_recovery_review.js
node --check assets/admin-gift-issuance-recovery-v674.js
node scripts/build673_gift_delivery_idempotency_test.mjs
node scripts/build674_gift_issuance_atomicity_test.mjs
