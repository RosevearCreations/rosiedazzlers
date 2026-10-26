#!/usr/bin/env bash
# Stable source-gate entry point for current customer booking regressions.
# Retained numbered test fixtures are historical contracts; the workflow
# calls this release-number-neutral wrapper without dropping any assertions.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build627_customer_wizard_usability_test.mjs
node scripts/build628_booking_context_help_test.mjs
node scripts/build629_package_comparison_test.mjs
node scripts/build630_booking_draft_safe_return_test.mjs
node scripts/build631_final_review_validation_test.mjs
node scripts/build647_public_layout_test.mjs

# Build 649 live-catalog discovery and booking state preservation.
node scripts/build649_booking_discovery_test.mjs

# Build 650 selection-readiness and contextual help regression.
node scripts/build650_booking_readiness_test.mjs

# Build 651 gift selection links, checkout tab activation and accessibility.
node scripts/build651_gift_choice_test.mjs

# Build 652 gallery comparison controls, filtering and public publication boundaries.
node scripts/build652_gallery_browse_test.mjs

# Build 653 maintenance-interest form, readiness and accessible confirmation.
node scripts/build653_maintenance_interest_test.mjs

# Build 654 contact email-draft preparation and FAQ search usability.
node scripts/build654_contact_faq_test.mjs

# Build 655 mobile water/power public copy consistency and owner policy boundary.
node scripts/build655_mobile_setup_copy_test.mjs

# Build 656 managed policy drift guard, protected read-only owner review.
node scripts/build656_mobile_setup_policy_review_test.mjs
node scripts/build657_town_mobile_setup_reconciliation_test.mjs
node scripts/build658_service_addon_mobile_setup_review_test.mjs
node scripts/build659_service_area_mobile_setup_reconciliation_test.mjs
node scripts/build660_appointment_preparation_mobile_setup_test.mjs
node scripts/build661_quote_deposit_mobile_copy_test.mjs
node scripts/build662_post_service_mobile_copy_test.mjs
node scripts/build663_rebooking_seasonal_copy_test.mjs
node scripts/build664_service_completion_faq_test.mjs
node scripts/build665_feedback_recovery_copy_test.mjs
