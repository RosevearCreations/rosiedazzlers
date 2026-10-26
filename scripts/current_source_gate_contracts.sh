#!/usr/bin/env bash
# Stable source-gate entry point. Retain all original assertions and fail closed.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build632_source_gate_dedup_test.mjs
node scripts/build339-vehicle-form-ux-gate.mjs
python3 scripts/build404_error_recovery_weak_connection_reliability_check.py
node scripts/build648_admin_operator_test.mjs
node scripts/build662_post_service_mobile_copy_test.mjs
node scripts/build663_rebooking_seasonal_copy_test.mjs
node scripts/build664_service_completion_faq_test.mjs
node scripts/build665_feedback_recovery_copy_test.mjs
node scripts/build666_warranty_claim_copy_test.mjs
node scripts/build667_cancellation_reschedule_refund_copy_test.mjs
node scripts/build668_gift_voucher_store_credit_copy_test.mjs
