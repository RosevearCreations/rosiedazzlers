import assert from "node:assert/strict";
import {
  buildBookingFunnelQuotePricingLearning,
  buildBookingQuoteControlledExperimentFramework
} from "../functions/api/_lib/booking-funnel-quote-pricing-learning.js";

const observed=buildBookingFunnelQuotePricingLearning({
  source_status:{booking_rebooking_funnel:{available:true},quote_pipeline_list:{available:true}},
  funnel:{window:{days:90},booking_funnel:{
    funnel_start_sessions:100,checkout_started_sessions:42,checkout_completed_sessions:35,
    stages:[
      {key:"step_1",label:"Date + vehicle",drop_from_previous:null},
      {key:"step_2",label:"Package",drop_from_previous:30,drop_from_previous_pct:30},
      {key:"step_3",label:"Add-ons",drop_from_previous:12,drop_from_previous_pct:17.1},
      {key:"checkout_started",label:"Checkout started",drop_from_previous:3,drop_from_previous_pct:6.7}
    ]
  },coverage:{analytics_possibly_truncated:false}},
  quote_rows:[
    {customer_name:"Private A",id:"q1",status:"accepted",quoted_amount_cents:26900,accepted_amount_cents:26900,sent_at:"x",accepted_at:"x"},
    {customer_name:"Private B",id:"q2",status:"declined",quoted_amount_cents:29900,sent_at:"x",declined_at:"x"},
    {customer_name:"Private C",id:"q3",status:"accepted",quoted_amount_cents:31900,accepted_amount_cents:29900,sent_at:"x",accepted_at:"x"},
    {customer_name:"Private D",id:"q4",status:"declined",quoted_amount_cents:34900,sent_at:"x",declined_at:"x"},
    {customer_name:"Private E",id:"q5",status:"accepted",quoted_amount_cents:36900,accepted_amount_cents:36900,sent_at:"x",accepted_at:"x"}
  ]
});

assert.equal(observed.controlled_experiment_framework_build,471);
const framework=observed.controlled_experiment_framework;
assert.equal(framework.build,471);
assert.equal(framework.authority,"booking_quote_controlled_experiment_framework");
assert.equal(framework.definition_count,3);
assert.ok(framework.owner_approval_required_count >= 1);
assert.equal(framework.boundaries.existing_workbench_only,true);
assert.equal(framework.boundaries.owner_approval_required,true);
assert.equal(framework.boundaries.automatic_experiment_activation_allowed,false);
assert.equal(framework.boundaries.automatic_winner_selection_allowed,false);
assert.equal(framework.boundaries.pricing_mutation_allowed,false);
assert.equal(framework.boundaries.discount_mutation_allowed,false);
assert.equal(framework.boundaries.booking_rule_mutation_allowed,false);
assert.equal(framework.boundaries.outreach_allowed,false);

for(const row of framework.definitions){
  assert.equal(row.owner_approval.required,true);
  assert.equal(row.owner_approval.status,"not_recorded");
  assert.equal(row.owner_approval.approved,false);
  assert.equal(row.owner_approval.approved_by,null);
  assert.equal(row.owner_approval.approved_at,null);
  assert.equal(row.activation.authorized,false);
  assert.equal(row.activation.started,false);
  assert.equal(row.activation.duration_days,null);
  assert.equal(row.activation.allocation_rule,null);
  assert.equal(row.success_measure.success_threshold,null);
  assert.equal(row.success_measure.target_direction,null);
  assert.equal(row.success_measure.winner_rule,null);
  assert.equal(row.results.status,"not_started");
  assert.equal(row.results.winner,null);
  assert.equal(row.results.success,null);
  assert.ok(Array.isArray(row.stop_conditions));
  assert.ok(row.stop_conditions.includes("owner_withdraws_approval"));
  assert.ok(row.stop_conditions.includes("price_discount_booking_rule_or_outreach_change_required"));
}

const direct=buildBookingQuoteControlledExperimentFramework(observed.experiment_readiness);
assert.equal(direct.definition_count,3);
assert.equal(direct.truth_boundary.experiment_result_claimed,false);
assert.equal(direct.truth_boundary.price_causation_claimed,false);

const sparse=buildBookingFunnelQuotePricingLearning({
  source_status:{booking_rebooking_funnel:{available:true},quote_pipeline_list:{available:true}},
  funnel:{window:{days:30},booking_funnel:{funnel_start_sessions:4,stages:[{key:"step_2",label:"Package",drop_from_previous:1,drop_from_previous_pct:25}]},coverage:{}},
  quote_rows:[{status:"sent",quoted_amount_cents:26900,sent_at:"x"}]
});
assert.equal(sparse.controlled_experiment_framework.owner_approval_required_count,0);
assert.ok(sparse.controlled_experiment_framework.definitions.some(r=>r.framework_state==="needs_more_evidence"||r.framework_state==="unavailable"));

const serialized=JSON.stringify(observed);
for(const forbidden of ["Private A","Private B","\"customer_name\"","\"customer_id\"","\"booking_id\"","\"session_id\"","\"q1\""]) {
  assert.equal(serialized.includes(forbidden),false,forbidden);
}

console.log("BUILD 471 BOOKING & QUOTE CONTROLLED EXPERIMENT FRAMEWORK TEST: PASS");
