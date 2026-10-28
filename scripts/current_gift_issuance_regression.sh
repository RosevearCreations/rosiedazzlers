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
node --check functions/api/admin/gift_audit_alerts.js
node --check assets/admin-gift-audit-alerts-v680.js
node scripts/build680_gift_audit_alerts_test.mjs
node --check functions/api/admin/gift_hold_continuity.js
node --check assets/admin-gift-hold-continuity-v681.js
node scripts/build681_gift_hold_continuity_test.mjs
node --check functions/api/admin/gift_hold_followup.js
node --check assets/admin-gift-hold-followup-v682.js
node scripts/build682_gift_hold_followup_test.mjs
node --check functions/api/admin/gift_hold_renewal.js
node --check assets/admin-gift-hold-renewal-v683.js
node scripts/build683_gift_hold_renewal_test.mjs
node --check functions/api/admin/gift_verified_release.js
node --check assets/admin-gift-verified-release-v684.js
node scripts/build684_gift_verified_release_test.mjs
node --check functions/api/admin/gift_manual_delivery_handoff.js
node --check assets/admin-gift-manual-handoff-v685.js
node scripts/build685_gift_manual_handoff_test.mjs
node --check functions/api/admin/gift_operator_authorization.js
node --check assets/admin-gift-operator-authorization-v686.js
node scripts/build686_gift_operator_authorization_test.mjs
node --check functions/api/admin/gift_one_time_dispatch.js
node --check assets/admin-gift-one-time-dispatch-v687.js
node scripts/build687_one_time_dispatch_test.mjs
node --check functions/api/admin/gift_delivery_outcome_review.js
node --check assets/admin-gift-delivery-outcome-v688.js
node scripts/build688_delivery_outcome_test.mjs
