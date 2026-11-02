#!/usr/bin/env bash
set -euo pipefail

node --check functions/api/gifts/webhook.js
node --check functions/api/gifts/catalog.js
node --check functions/api/gifts/checkout.js
node --check functions/api/gifts/receipt.js
node --check assets/gift-draft-recovery-v741.js
node scripts/build741_gift_catalog_checkout_recovery_test.mjs
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
node --check functions/api/admin/gift_delivery_followup.js
node --check assets/admin-gift-delivery-followup-v689.js
node --check functions/api/_lib/rosevear-integration-v1.js
node --check functions/api/integration/v1/health.js
node --check functions/api/integration/v1/capabilities.js
node scripts/build689_delivery_followup_test.mjs
node scripts/build689_integration_v1_test.mjs
node --check functions/api/admin/gift_delivery_closure_recurrence.js
node --check functions/api/admin/integration_v1_owner_readiness.js
node --check assets/admin-gift-closure-recurrence-v690.js
node --check assets/admin-integration-v1-owner-readiness-v690.js
node scripts/build690_gift_recurrence_test.mjs
node scripts/build690_integration_owner_readiness_test.mjs
node --check functions/api/admin/gift_delivery_reopened_exception.js
node --check assets/admin-gift-reopened-exception-v691.js
node --check functions/api/admin/integration_v1_ql245_witness_handoff.js
node --check assets/admin-integration-v1-ql245-handoff-v691.js
node scripts/build691_gift_reopened_exception_test.mjs
node scripts/build691_ql245_unsigned_handoff_test.mjs
node --check functions/api/admin/gift_delivery_discrepancy_watch.js
node --check assets/admin-gift-discrepancy-watch-v692.js
node --check functions/api/_lib/rosevear-integration-ql246.js
node --check functions/api/admin/integration_v1_original_receipt_intake.js
node --check assets/admin-integration-v1-original-intake-v692.js
node scripts/build692_discrepancy_watch_test.mjs
node scripts/build692_ql246_source_intake_test.mjs
node --check functions/api/admin/gift_fifth_recurrence_closure_watch.js
node --check assets/admin-gift-fifth-recurrence-v693.js
node --check functions/api/admin/integration_v1_ql246_signature_readiness.js
node --check assets/admin-integration-v1-ql246-pinned-v693.js
node scripts/build693_fifth_recurrence_test.mjs
node scripts/build693_ql246_pinned_signature_test.mjs
node --check functions/api/admin/gift_sixth_witness_hold_aging.js
node --check functions/api/_lib/rosevear-integration-ql248.js
node --check functions/api/admin/integration_v1_ql248_proof_commit_readiness.js
node --check assets/admin-gift-sixth-aging-v694.js
node --check assets/admin-integration-v1-ql248-two-sha-v694.js
node scripts/build694_sixth_aging_test.mjs
node scripts/build694_ql248_two_sha_test.mjs
node --check functions/api/admin/gift_owner_hold_triage_queue.js
node --check assets/admin-gift-owner-hold-queue-v695.js
node --check scripts/ql249_rosie_local_git_proof_review.mjs
node scripts/build695_owner_hold_queue_test.mjs
node scripts/build695_ql249_local_git_review_test.mjs
node --check functions/api/admin/gift_owner_hold_escalation_runbook.js
node --check assets/admin-gift-hold-escalation-v696.js
node --check functions/api/_lib/rosevear-integration-ql249-github.js
node --check functions/api/admin/integration_v1_ql249_github_origin_intake.js
node --check assets/admin-integration-v1-ql249-origin-v696.js
node scripts/build696_gift_hold_escalation_test.mjs
node scripts/build696_ql249_github_origin_test.mjs
node --check functions/api/admin/gift_hold_escalation_outcome_audit.js
node --check assets/admin-gift-hold-outcome-audit-v697.js
node --check functions/api/admin/integration_v1_ql250_custody_reconciliation.js
node --check assets/admin-integration-v1-ql250-custody-v697.js
node scripts/build697_gift_hold_outcome_audit_test.mjs
node scripts/build697_ql250_custody_reconciliation_test.mjs
node --check functions/api/admin/gift_hold_recurrence_followup.js
node --check assets/admin-gift-hold-recurrence-followup-v698.js
node --check scripts/ql252_rosie_authentic_proof_preflight.mjs
node scripts/build698_gift_hold_recurrence_followup_test.mjs
node scripts/build698_ql252_authentic_proof_preflight_test.mjs
node --check assets/admin-gift-hold-snapshot-compare-v699.js
node --check assets/admin-gift-hold-snapshot-ui-v699.js
node --check functions/api/admin/integration_v1_ql253_public_ci_continuity.js
node --check assets/admin-integration-v1-ql253-public-v699.js
node scripts/build699_gift_hold_snapshot_comparison_test.mjs
node scripts/build699_ql253_public_ci_continuity_test.mjs
node --check assets/admin-gift-hold-provenance-v700.js
node --check assets/admin-gift-hold-provenance-ui-v700.js
node --check functions/api/admin/integration_v1_ql254_original_proof_watch.js
node --check assets/admin-integration-v1-ql254-public-v700.js
node scripts/build700_gift_hold_provenance_test.mjs
node scripts/build700_ql254_original_proof_watch_test.mjs
node --check functions/api/admin/integration_v1_ql256_config_inventory.js
node --check assets/admin-integration-v1-ql256-config-v701.js
node --check scripts/ql256_rosie_signer_custody.mjs
node --check assets/admin-gift-hold-witness-aging-v701.js
node --check assets/admin-gift-hold-witness-aging-ui-v701.js
node scripts/build701_ql256_signer_custody_test.mjs
node scripts/build701_ql256_config_inventory_test.mjs
node scripts/build701_gift_witness_aging_test.mjs
