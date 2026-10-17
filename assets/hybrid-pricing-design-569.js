// Build 569 design review-only recommendations. No price, route, storage or booking mutation.
export const REDESIGN_WORKSTREAM_569 = Object.freeze({
  build: 569,
  proposal: 'hybrid_quote_first',
  code_phase: 'design_only',
  owner_approved: false,
  entry_cta: 'Tell us what your vehicle needs',
  optional_direct_booking: true,
  core_steps: Object.freeze([
    'vehicle_and_general_location',
    'service_goals_and_condition',
    'recommendation_not_final_quote',
    'eligible_addons_and_education',
    'review_and_nonbinding_quote_request'
  ]),
  approval_questions: Object.freeze([
    'catalog_and_price_display_matrix',
    'quote_first_vs_direct_booking_entry',
    'addon_manual_review_and_editorial_claims',
    'payment_deposit_travel_tax_grandfathering',
    'privacy_photos_assets_and_copy',
    'launch_rollout_monitor_and_rollback'
  ]),
  impact_surfaces: Object.freeze([
    'index.html','pricing.html','services.html','book.html',
    'booking-planner.html','gift-cards.html','maintenance-plan.html',
    'data/rosie_services_pricing_and_packages.json',
    'functions/api/_lib/pricing-catalog.js',
    'functions/api/_lib/quote-booking-authority.js',
    'functions/api/admin/lead_quote_preview.js',
    'functions/api/admin/lead_conversion_create_booking.js'
  ])
});
export function evaluateHybridPricingDesign569({reviewedQuestions=[]}={}) {
  const names=Array.isArray(reviewedQuestions)?reviewedQuestions.filter(x=>typeof x==='string'):[];
  const reviewed=REDESIGN_WORKSTREAM_569.approval_questions.filter(x=>names.includes(x));
  const pending=REDESIGN_WORKSTREAM_569.approval_questions.filter(x=>!reviewed.includes(x));
  return Object.freeze({
    build:569,
    review_status:pending.length?'incomplete':'review_noted_only',
    reviewed_question_ids:Object.freeze(reviewed),
    pending_question_ids:Object.freeze(pending),
    owner_policy_approved:false,
    public_redesign_live:false,
    quote_wizard_live:false,
    live_pricing_changed:false,
    catalog_written:false,
    booking_confirmed:false,
    deposit_charged:false,
    lead_submitted:false,
    provider_activated:false,
    media_published:false,
    customer_data_mutated:false,
    requires_separate_implementation_release:true
  });
}
