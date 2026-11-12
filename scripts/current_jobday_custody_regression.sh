#!/usr/bin/env bash
set -euo pipefail
# Retained current source authority: independent device witness, signed Master ACK,
# exact source custody and non-authorizing consent-safe scoped review.
node scripts/build850_custody_receiver_test.mjs
node scripts/build851_original_device_receiver_test.mjs
node --check functions/api/_lib/jobday-continuity-852.js
node --check functions/api/admin/jobday_continuity_852.js
node scripts/build852_recall_continuity_test.mjs
node --check functions/api/_lib/jobday-replay-853.js
node --check functions/api/admin/jobday_replay_853.js
node scripts/build853_replay_escalation_test.mjs
node --check functions/api/_lib/jobday-atomic-854.js
node --check functions/api/admin/jobday_atomicity_854.js
node scripts/build854_atomicity_sla_test.mjs
node --check functions/api/_lib/jobday-transaction-855.js
node --check functions/api/admin/jobday_transaction_855.js
node scripts/build855_transaction_replay_test.mjs
node --check functions/api/_lib/jobday-delivery-856.js
node --check functions/api/admin/jobday_delivery_856.js
node scripts/build856_delivery_conflict_export_test.mjs
node --check functions/api/_lib/jobday-custody-857.js
node --check functions/api/admin/jobday_custody_857.js
node scripts/build857_custody_aging_readback_test.mjs
node --check functions/api/_lib/jobday-recovery-858.js
node --check functions/api/admin/jobday_recovery_858.js
node scripts/build858_fresh_handoff_export_test.mjs
node --check functions/api/_lib/jobday-return-859.js
node --check functions/api/admin/jobday_return_859.js
node scripts/build859_return_owner_continuity_test.mjs
node --check functions/api/_lib/jobday-intake-860.js
node --check functions/api/admin/jobday_intake_860.js
node scripts/build860_intake_custodian_exception_test.mjs

node --check functions/api/_lib/jobday-exception-861.js
node --check functions/api/admin/jobday_exception_861.js
node scripts/build861_intake_discrepancy_hold_test.mjs

node --check functions/api/_lib/jobday-witness-862.js
node --check functions/api/admin/jobday_witness_862.js
node scripts/build862_resolution_witness_sla_hold_test.mjs

node --check functions/api/_lib/jobday-postwitness-863.js
node --check functions/api/admin/jobday_postwitness_863.js
node scripts/build863_postwitness_critical_sla_readback_test.mjs

node --check functions/api/_lib/jobday-continuity-864.js
node --check functions/api/admin/jobday_continuity_864.js
node scripts/build864_critical_recovery_drift_continuity_test.mjs

node --check functions/api/_lib/jobday-readback-865.js
node --check functions/api/admin/jobday_readback_865.js
node scripts/build865_owner_snapshot_freshness_escalation_test.mjs

node --check functions/api/_lib/jobday-rotation-866.js
node --check functions/api/admin/jobday_rotation_866.js
node scripts/build866_owner_rotation_receipt_exception_test.mjs

node --check functions/api/_lib/jobday-retention-867.js
node --check functions/api/admin/jobday_retention_867.js
node scripts/build867_owner_renewal_route_retention_test.mjs
