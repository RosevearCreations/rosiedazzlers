import assert from "node:assert/strict";
import {buildBookingFunnelQuotePricingLearning} from "../functions/api/_lib/booking-funnel-quote-pricing-learning.js";

const result=buildBookingFunnelQuotePricingLearning({
  source_status:{booking_rebooking_funnel:{available:true},quote_pipeline_list:{available:true}},
  funnel:{window:{days:90},booking_funnel:{funnel_start_sessions:100,checkout_started_sessions:42,checkout_completed_sessions:35,start_to_checkout_completion_pct:35,checkout_completion_pct:83.3,abandoned_after_checkout_start:7,stages:[
    {key:"step_1",label:"Date + vehicle",drop_from_previous:null},
    {key:"step_2",label:"Package",drop_from_previous:30,drop_from_previous_pct:30},
    {key:"step_3",label:"Add-ons",drop_from_previous:12,drop_from_previous_pct:17.1},
    {key:"step_5",label:"Deposit / payment",drop_from_previous:7,drop_from_previous_pct:13.5},
    {key:"checkout_started",label:"Checkout started",drop_from_previous:3,drop_from_previous_pct:6.7}
  ]},coverage:{analytics_possibly_truncated:false}},
  quote_rows:[
    {customer_name:"Private A",id:"q1",status:"accepted",quoted_amount_cents:22900,accepted_amount_cents:22900,sent_at:"x",accepted_at:"x"},
    {customer_name:"Private B",id:"q2",status:"declined",quoted_amount_cents:26900,sent_at:"x",declined_at:"x"},
    {customer_name:"Private C",id:"q3",status:"accepted",quoted_amount_cents:31900,accepted_amount_cents:29900,sent_at:"x",accepted_at:"x"},
    {customer_name:"Private D",id:"q4",status:"declined",quoted_amount_cents:36900,sent_at:"x",declined_at:"x"},
    {customer_name:"Private E",id:"q5",status:"sent",quoted_amount_cents:41900,sent_at:"x"},
    {customer_name:"Private F",id:"q6",status:"accepted",quoted_amount_cents:41900,accepted_amount_cents:43900,sent_at:"x",accepted_at:"x"},
    {customer_name:"Private G",id:"q7",status:"declined",quoted_amount_cents:45900,sent_at:"x",declined_at:"x"},
    {customer_name:"Private H",id:"q8",status:"accepted",quoted_amount_cents:65000,accepted_amount_cents:65000,sent_at:"x",accepted_at:"x"}
  ]
});

assert.equal(result.release_enrichment_build,461);
assert.equal(result.experiment_readiness.build,461);
assert.equal(result.experiment_readiness.authority,"booking_quote_experiment_readiness");
assert.equal(result.experiment_readiness.hypotheses.length,3);
assert.equal(result.experiment_readiness.owner_review_ready_count,3);
assert.equal(result.experiment_readiness.state,"owner_review_ready");

const byKey=Object.fromEntries(result.experiment_readiness.hypotheses.map(r=>[r.key,r]));
assert.equal(byKey.booking_stage_clarity.readiness,"owner_review_ready");
assert.match(byKey.booking_stage_clarity.measurement_plan.allowed_change,/no price, discount, availability or booking-rule change/i);
assert.equal(byKey.quote_band_clarity.readiness,"owner_review_ready");
assert.match(byKey.quote_band_clarity.evidence_basis,/\$250–\$399/);
assert.equal(byKey.accepted_work_scope_clarity.readiness,"owner_review_ready");
assert.match(byKey.accepted_work_scope_clarity.evidence_basis,/accepted quote row/);

for(const row of result.experiment_readiness.hypotheses){
  assert.equal(row.owner_decision_required,true);
  assert.equal(row.automatic_activation_allowed,false);
  assert.equal(row.automatic_winner_selection_allowed,false);
  assert.equal(row.business_mutation_allowed,false);
}
for(const [key,value] of Object.entries(result.experiment_readiness.boundaries)){
  if(key.endsWith("_allowed")) assert.equal(value,false,key);
}
assert.equal(result.experiment_readiness.boundaries.existing_workbench_only,true);
assert.equal(result.experiment_readiness.boundaries.owner_decision_required,true);
assert.equal(result.experiment_readiness.boundaries.manual_activation_only,true);

const sparse=buildBookingFunnelQuotePricingLearning({
  source_status:{booking_rebooking_funnel:{available:true},quote_pipeline_list:{available:true}},
  funnel:{window:{days:30},booking_funnel:{funnel_start_sessions:4,stages:[{key:"step_2",label:"Package",drop_from_previous:1,drop_from_previous_pct:25}]},coverage:{}},
  quote_rows:[{status:"sent",quoted_amount_cents:26900,sent_at:"x"}]
});
assert.equal(sparse.experiment_readiness.hypotheses.find(r=>r.key==="booking_stage_clarity").readiness,"needs_more_evidence");
assert.equal(sparse.experiment_readiness.hypotheses.find(r=>r.key==="quote_band_clarity").readiness,"needs_more_evidence");
assert.equal(sparse.experiment_readiness.hypotheses.find(r=>r.key==="accepted_work_scope_clarity").readiness,"unavailable");

const serialized=JSON.stringify(result);
for(const forbidden of ["Private A","\"customer_name\"","\"customer_id\"","\"booking_id\"","\"session_id\"","\"q1\""]) assert.equal(serialized.includes(forbidden),false,forbidden);
assert.equal(result.boundaries.automatic_price_change_allowed,false);
assert.equal(result.boundaries.automatic_discount_allowed,false);
assert.equal(result.boundaries.automatic_outreach_allowed,false);
assert.equal(result.boundaries.automatic_booking_creation_allowed,false);

console.log("BUILD 461 BOOKING & QUOTE EXPERIMENT READINESS TEST: PASS");
