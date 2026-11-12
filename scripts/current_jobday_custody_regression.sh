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
