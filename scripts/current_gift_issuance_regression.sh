#!/usr/bin/env bash
set -euo pipefail

node --check functions/api/gifts/webhook.js
node --check functions/api/admin/gift_issuance_recovery_review.js
node --check assets/admin-gift-issuance-recovery-v674.js
node --check functions/api/admin/gift_issuance_recovery_decisions.js
node --check assets/admin-gift-issuance-decisions-v675.js
node --check functions/api/admin/gift_independent_recovery_review.js
node --check assets/admin-gift-independent-review-v676.js
node --check functions/api/admin/gift_review_followup.js
node --check assets/admin-gift-review-followup-v677.js
node scripts/build673_gift_delivery_idempotency_test.mjs
node scripts/build674_gift_issuance_atomicity_test.mjs
node scripts/build675_gift_recovery_decision_test.mjs
node scripts/build676_gift_independent_review_test.mjs
node scripts/build677_gift_review_followup_test.mjs
node --check functions/api/admin/gift_recheck_closeout.js
node --check assets/admin-gift-recheck-closeout-v678.js
node scripts/build678_gift_recheck_closeout_test.mjs
node --check functions/api/admin/gift_closeout_audit.js
node --check assets/admin-gift-closeout-audit-v679.js
node scripts/build679_gift_closeout_audit_test.mjs
