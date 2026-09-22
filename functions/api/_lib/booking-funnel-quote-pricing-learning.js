// Build 451/461/471 — read-only booking funnel, quote/pricing learning, readiness and controlled-experiment framework.
export const BUILD451_QUOTE_VALUE_BANDS = Object.freeze([
  { key:"under_250", label:"Under $250", min_cents:0, max_cents:24999 },
  { key:"250_399", label:"$250–$399", min_cents:25000, max_cents:39999 },
  { key:"400_599", label:"$400–$599", min_cents:40000, max_cents:59999 },
  { key:"600_plus", label:"$600+", min_cents:60000, max_cents:null }
]);
export function buildBookingFunnelQuotePricingLearning({funnel={},quote_rows=[],source_status={},generated_at=null}={}){
  const booking=summarizeBooking(funnel), quotes=summarizeQuotes(quote_rows), learning_signals=deriveSignals(booking,quotes), experiment_readiness=buildExperimentReadiness(booking,quotes), controlled_experiment_framework=buildBookingQuoteControlledExperimentFramework(experiment_readiness);
  const values=Object.values(source_status||{}), total=values.length, available=values.filter(x=>x?.available===true).length, restricted=values.filter(x=>x?.restricted===true).length;
  const evidence_status=total&&available===total?(booking.evidence_possibly_truncated||quotes.possibly_truncated?"partial":"observed"):available?"partial":restricted?"restricted":"unavailable";
  return {
    build:451, authority:"booking_funnel_quote_pricing_learning", generated_at:generated_at||new Date().toISOString(),
    evidence_status, booking, quotes, learning_signals, experiment_readiness, controlled_experiment_framework, source_status, release_enrichment_build:461, controlled_experiment_framework_build:471, controlled_experiment_framework_authority:"booking_quote_controlled_experiment_framework",
    truth_boundary:{stage_drop_proves_price_friction:false,quote_decline_proves_price_sensitivity:false,accepted_value_delta_proves_discounting:false,accepted_quote_is_completed_work:false,unresolved_quote_proves_customer_rejection:false,causal_pricing_claimed:false,experiment_result_claimed:false,experiment_winner_claimed:false,owner_approval_inferred:false},
    boundaries:{read_only_learning:true,manual_refresh_only:true,first_party_aggregate_only:true,anonymous_session_to_customer_join:false,customer_identity_exposed:false,raw_quote_identifier_exposed:false,automatic_price_change_allowed:false,automatic_discount_allowed:false,automatic_outreach_allowed:false,automatic_quote_acceptance_allowed:false,automatic_booking_creation_allowed:false,payment_or_provider_mutation_allowed:false,schema_mutation_allowed:false,permanent_polling_allowed:false}
  };
}
function summarizeBooking(funnel){
  const data=obj(funnel), booking=obj(data.booking_funnel), coverage=obj(data.coverage);
  const stages=Array.isArray(booking.stages)?booking.stages.map(r=>({key:clean(r?.key),label:clean(r?.label||r?.key),drop_from_previous:nullableWhole(r?.drop_from_previous),drop_from_previous_pct:num(r?.drop_from_previous_pct)})):[];
  const drops=stages.filter(r=>Number(r.drop_from_previous||0)>0);
  const largest=drops.slice().sort((a,b)=>Number(b.drop_from_previous)-Number(a.drop_from_previous))[0]||null;
  const adjacentKeys=new Set(["step_2","step_3","step_5","checkout_started"]);
  const adjacent=drops.filter(r=>adjacentKeys.has(r.key)).sort((a,b)=>Number(b.drop_from_previous)-Number(a.drop_from_previous))[0]||null;
  return {state:whole(booking.funnel_start_sessions)>0?(coverage.analytics_possibly_truncated?"partial":"observed"):"unavailable",window_days:num(data?.window?.days),funnel_start_sessions:whole(booking.funnel_start_sessions),checkout_started_sessions:whole(booking.checkout_started_sessions),checkout_completed_sessions:whole(booking.checkout_completed_sessions),start_to_checkout_completion_pct:num(booking.start_to_checkout_completion_pct),checkout_completion_pct:num(booking.checkout_completion_pct),abandoned_after_checkout_start:whole(booking.abandoned_after_checkout_start),largest_observed_stage_drop:drop(largest),largest_price_adjacent_stage_drop:drop(adjacent),evidence_possibly_truncated:coverage.analytics_possibly_truncated===true,identity_join:false,price_cause_inferred:false};
}
function summarizeQuotes(rows){
  const safe=Array.isArray(rows)?rows.filter(r=>r&&typeof r==="object"):[];
  const bands=BUILD451_QUOTE_VALUE_BANDS.map(b=>({...b,rows_observed:0,sent_quotes:0,accepted_quotes:0,declined_quotes:0,unresolved_quotes:0,quoted_value_cents_aggregate:0}));
  let sent=0,accepted=0,declined=0,quotedValue=0,acceptedValue=0,comparable=0,compQuoted=0,compAccepted=0,below=0,equal=0,above=0;
  for(const row of safe){
    const quoted=nonneg(row.quoted_amount_cents), acceptedAmount=nonneg(row.accepted_amount_cents);
    const isAccepted=Boolean(row.accepted_at)||norm(row.status)==="accepted", isDeclined=Boolean(row.declined_at)||norm(row.status)==="declined";
    const isSent=Boolean(row.sent_at)||isAccepted||isDeclined||norm(row.status)==="sent", isUnresolved=!isAccepted&&!isDeclined;
    sent+=isSent?1:0; accepted+=isAccepted?1:0; declined+=isDeclined?1:0; quotedValue+=quoted; acceptedValue+=acceptedAmount;
    const band=bands.find(b=>quoted>=b.min_cents&&(b.max_cents==null||quoted<=b.max_cents));
    if(band){band.rows_observed++;band.sent_quotes+=isSent?1:0;band.accepted_quotes+=isAccepted?1:0;band.declined_quotes+=isDeclined?1:0;band.unresolved_quotes+=isUnresolved?1:0;band.quoted_value_cents_aggregate+=quoted;}
    if(isAccepted&&quoted>0&&acceptedAmount>0){comparable++;compQuoted+=quoted;compAccepted+=acceptedAmount;if(acceptedAmount<quoted)below++;else if(acceptedAmount>quoted)above++;else equal++;}
  }
  for(const band of bands){band.accepted_of_sent_pct=pct(band.accepted_quotes,band.sent_quotes);band.declined_of_sent_pct=pct(band.declined_quotes,band.sent_quotes);band.review_cohort_sufficient=band.sent_quotes>=3;}
  const delta=compAccepted-compQuoted;
  return {state:safe.length?(safe.length>=250?"partial":"observed"):"unavailable",rows_observed:safe.length,row_limit:250,possibly_truncated:safe.length>=250,sent_quotes:sent,accepted_quotes:accepted,declined_quotes:declined,unresolved_quotes:Math.max(safe.length-accepted-declined,0),accepted_of_sent_pct:pct(accepted,sent),declined_of_sent_pct:pct(declined,sent),quoted_value_cents_aggregate:quotedValue,accepted_value_cents_aggregate:acceptedValue,value_bands:bands,accepted_value_delta:{comparable_accepted_quotes:comparable,accepted_below_quoted_count:below,accepted_equal_quoted_count:equal,accepted_above_quoted_count:above,quoted_value_cents_comparable:compQuoted,accepted_value_cents_comparable:compAccepted,net_delta_cents:delta,net_delta_pct:compQuoted>0?round1(delta/compQuoted*100):null,reason_known:false},customer_identity_exposed:false,raw_quote_identifier_exposed:false,price_sensitivity_inferred:false,pricing_change_authorized:false};
}
function deriveSignals(booking,quotes){
  const out=[], a=booking.largest_price_adjacent_stage_drop;
  out.push(signal("booking_price_adjacent_stage",booking.state,a?"Largest observed price-adjacent booking-stage drop: "+a.stage+" ("+a.sessions_lost+" session(s)).":booking.state==="unavailable"?"Booking-funnel evidence is unavailable.":"No positive price-adjacent booking-stage drop is established.",a?"Review the owning package/add-on/deposit step for clarity and usability. The stage location does not prove price caused the drop.":"Keep observing the existing booking funnel; do not invent a pricing-friction conclusion."));
  if(quotes.state==="unavailable"){out.push(signal("quote_pipeline","unavailable","Quote-pipeline evidence is unavailable.","Restore retained quote evidence before drawing a conversion or pricing-learning conclusion."));return out;}
  out.push(signal("quote_resolution",quotes.state,quotes.accepted_quotes+" accepted, "+quotes.declined_quotes+" declined and "+quotes.unresolved_quotes+" unresolved quote row(s) are observed.","Review unresolved and declined quotes in the owning workflow. Status counts do not establish the customer's reason or authorize outreach."));
  const review=quotes.value_bands.filter(r=>r.review_cohort_sufficient).sort((a,b)=>Number(b.declined_of_sent_pct||0)-Number(a.declined_of_sent_pct||0));
  out.push(review.length?signal("quote_value_band",quotes.state,review[0].label+" has the highest observed declined-of-sent percentage among quote bands with at least 3 sent rows: "+fmt(review[0].declined_of_sent_pct)+".","Treat this as a cohort review prompt only. Quote value, service mix, condition, timing and customer intent are not causally separated."):signal("quote_value_band","partial","No quote-value band has at least 3 sent rows in the bounded snapshot.","Do not infer a price-band conversion pattern from very small cohorts."));
  const d=quotes.accepted_value_delta;
  out.push(d.comparable_accepted_quotes>0?signal("accepted_value_delta",quotes.state,d.comparable_accepted_quotes+" accepted quote row(s) have comparable quoted and accepted values; "+d.accepted_below_quoted_count+" finished below quoted, "+d.accepted_equal_quoted_count+" matched, and "+d.accepted_above_quoted_count+" finished above quoted.","Review aggregate accepted-value deltas only. The source does not establish whether any difference was a discount, scope change, correction or other cause."):signal("accepted_value_delta","unavailable","No accepted quote row has both a positive quoted and accepted value in the bounded snapshot.","Do not infer discounting, scope change or accepted-work pricing from missing comparable values."));
  return out;
}
function buildExperimentReadiness(booking,quotes){
  const plans=[bookingStagePlan(booking),quoteBandPlan(quotes),acceptedWorkPlan(quotes)];
  const ready=plans.filter(r=>r.readiness==="owner_review_ready").length, supported=plans.filter(r=>r.readiness!=="unavailable").length;
  return {
    build:461,
    authority:"booking_quote_experiment_readiness",
    state:ready===plans.length?"owner_review_ready":supported?"partial":"needs_evidence",
    owner_review_ready_count:ready,
    hypothesis_count:plans.length,
    hypotheses:plans,
    boundaries:{
      existing_workbench_only:true,
      owner_decision_required:true,
      manual_activation_only:true,
      automatic_experiment_activation_allowed:false,
      automatic_winner_selection_allowed:false,
      pricing_mutation_allowed:false,
      discount_mutation_allowed:false,
      booking_rule_mutation_allowed:false,
      outreach_allowed:false,
      customer_identity_join_allowed:false,
      provider_mutation_allowed:false,
      schema_mutation_allowed:false,
      permanent_polling_allowed:false
    }
  };
}
export function buildBookingQuoteControlledExperimentFramework(experimentReadiness={}){
  const readiness=obj(experimentReadiness), hypotheses=Array.isArray(readiness.hypotheses)?readiness.hypotheses:[];
  const definitions=hypotheses.map(plan=>{
    const sourceReadiness=clean(plan?.readiness)||"unavailable";
    const frameworkState=sourceReadiness==="owner_review_ready"?"owner_approval_required":sourceReadiness==="unavailable"?"unavailable":"needs_more_evidence";
    const measurement=obj(plan?.measurement_plan);
    return {
      key:clean(plan?.key)||"unknown",
      area:clean(plan?.area)||"unknown",
      framework_state:frameworkState,
      evidence_eligibility:{
        source_readiness:sourceReadiness,
        eligible_for_owner_approval:sourceReadiness==="owner_review_ready",
        minimum_evidence:clean(measurement.minimum_evidence)||null,
        evidence_basis:clean(plan?.evidence_basis)||null,
        hypothesis:clean(plan?.hypothesis)||null
      },
      success_measure:{
        primary_metric:clean(measurement.primary_metric)||null,
        baseline_rule:clean(measurement.baseline)||null,
        success_threshold:null,
        target_direction:null,
        winner_rule:null,
        threshold_owner_defined:true,
        winner_rule_owner_defined:true
      },
      experiment_bounds:{
        allowed_change:clean(measurement.allowed_change)||null,
        duration_days:null,
        allocation_rule:null,
        comparison_window_rule:"Use like-for-like bounded windows from the retained aggregate source only.",
        duration_owner_defined:true,
        allocation_owner_defined:true
      },
      stop_conditions:[
        "retained_evidence_unavailable_restricted_or_materially_truncated",
        "minimum_evidence_no_longer_met",
        "like_for_like_window_breaks",
        "price_discount_booking_rule_or_outreach_change_required",
        "owner_withdraws_approval",
        "material_confounder_breaks_comparability"
      ],
      owner_approval:{
        required:true,
        status:"not_recorded",
        approved:false,
        approved_by:null,
        approved_at:null
      },
      activation:{
        mode:"manual_only",
        authorized:false,
        started:false,
        duration_days:null,
        allocation_rule:null
      },
      results:{status:"not_started",winner:null,success:null},
      automatic_activation_allowed:false,
      automatic_winner_selection_allowed:false,
      business_mutation_allowed:false
    };
  });
  const approvalRequired=definitions.filter(r=>r.framework_state==="owner_approval_required").length;
  const needsEvidence=definitions.filter(r=>r.framework_state==="needs_more_evidence").length;
  const unavailable=definitions.filter(r=>r.framework_state==="unavailable").length;
  return {
    build:471,
    authority:"booking_quote_controlled_experiment_framework",
    state:approvalRequired?"owner_approval_required":needsEvidence?"needs_evidence":"unavailable",
    definition_count:definitions.length,
    owner_approval_required_count:approvalRequired,
    needs_more_evidence_count:needsEvidence,
    unavailable_count:unavailable,
    definitions,
    truth_boundary:{
      experiment_result_claimed:false,
      experiment_winner_claimed:false,
      price_causation_claimed:false,
      customer_motive_inferred:false,
      discount_need_inferred:false,
      owner_approval_inferred:false
    },
    boundaries:{
      existing_workbench_only:true,
      owner_approval_required:true,
      manual_activation_only:true,
      automatic_experiment_activation_allowed:false,
      automatic_winner_selection_allowed:false,
      pricing_mutation_allowed:false,
      discount_mutation_allowed:false,
      booking_rule_mutation_allowed:false,
      availability_mutation_allowed:false,
      outreach_allowed:false,
      quote_acceptance_allowed:false,
      booking_creation_allowed:false,
      customer_identity_join_allowed:false,
      provider_mutation_allowed:false,
      schema_mutation_allowed:false,
      storage_mutation_allowed:false,
      permanent_polling_allowed:false
    }
  };
}

function bookingStagePlan(booking){
  const drop=booking?.largest_price_adjacent_stage_drop, starts=whole(booking?.funnel_start_sessions), has=Boolean(drop)&&booking?.state!=="unavailable";
  const ready=has&&starts>=10;
  const stage=drop?.stage||"price-adjacent booking stage";
  return experimentPlan({
    key:"booking_stage_clarity",
    area:"booking_stage",
    readiness:has?(ready?"owner_review_ready":"needs_more_evidence"):"unavailable",
    hypothesis:has?("Clarifying the "+stage+" step may reduce the observed transition loss without changing price or booking rules."):"A booking-stage clarity hypothesis is not supported until a positive price-adjacent stage drop is observed.",
    evidence_basis:has?(stage+" shows "+whole(drop.sessions_lost)+" observed lost session(s) in the retained anonymous funnel; price causation is not established."):"No positive price-adjacent booking-stage drop is established in the retained bounded snapshot.",
    primary_metric:"Existing anonymous stage continuation / drop counts for the same transition.",
    minimum_evidence:"Use like-for-like bounded windows with at least 10 booking starts in each comparison window before owner review.",
    allowed_change:"Owner-approved copy, explanation or layout clarity only; no price, discount, availability or booking-rule change."
  });
}
function quoteBandPlan(quotes){
  const rows=Array.isArray(quotes?.value_bands)?quotes.value_bands.filter(r=>r?.review_cohort_sufficient):[];
  const band=rows.slice().sort((a,b)=>Number(b?.declined_of_sent_pct||0)-Number(a?.declined_of_sent_pct||0))[0]||null;
  const has=Boolean(band);
  return experimentPlan({
    key:"quote_band_clarity",
    area:"quote_band",
    readiness:has?"owner_review_ready":"needs_more_evidence",
    hypothesis:has?("Clarifying quote presentation for the "+band.label+" cohort may improve resolution without changing the quoted price."):"A quote-band clarity hypothesis needs a retained band with at least three sent quotes.",
    evidence_basis:has?(band.label+" has "+whole(band.sent_quotes)+" sent, "+whole(band.accepted_quotes)+" accepted, "+whole(band.declined_quotes)+" declined and "+whole(band.unresolved_quotes)+" unresolved row(s); customer motive and price sensitivity are not established."):"No quote-value band meets the retained minimum review-cohort threshold.",
    primary_metric:"Accepted / declined / unresolved mix within the same retained broad quote-value band.",
    minimum_evidence:"Retain at least three sent quotes per reviewed band and compare like-for-like bounded windows; treat small samples as directional only.",
    allowed_change:"Owner-approved quote wording or presentation clarity only; no price, discount, automatic follow-up or outreach."
  });
}
function acceptedWorkPlan(quotes){
  const d=quotes?.accepted_value_delta||{}, n=whole(d.comparable_accepted_quotes), has=n>0, ready=n>=3;
  return experimentPlan({
    key:"accepted_work_scope_clarity",
    area:"accepted_work",
    readiness:has?(ready?"owner_review_ready":"needs_more_evidence"):"unavailable",
    hypothesis:has?"Making quoted-versus-accepted scope/value clearer at acceptance may reduce future aggregate value mismatches; current differences do not establish why they occurred.":"An accepted-work clarity hypothesis is unavailable until accepted quote rows have positive quoted and accepted values.",
    evidence_basis:has?(n+" accepted quote row(s) are comparable: "+whole(d.accepted_below_quoted_count)+" below quoted, "+whole(d.accepted_equal_quoted_count)+" equal and "+whole(d.accepted_above_quoted_count)+" above; accepted quote is not proof of completed work."):"No accepted quote row has both positive quoted and accepted values in the bounded snapshot.",
    primary_metric:"Counts of accepted rows below / equal to / above quoted value, using the retained aggregate source only.",
    minimum_evidence:"Use at least three comparable accepted rows before owner review; do not infer discounting, scope change, correction or completed work.",
    allowed_change:"Owner-approved scope/value explanation clarity only; no automatic price, discount, quote acceptance, booking or completion mutation."
  });
}
function experimentPlan({key,area,readiness,hypothesis,evidence_basis,primary_metric,minimum_evidence,allowed_change}){
  return {
    key,area,readiness,hypothesis,evidence_basis,
    measurement_plan:{
      mode:"bounded_owner_review",
      primary_metric,
      baseline:"Use the existing retained aggregate source and a matching bounded comparison window.",
      minimum_evidence,
      allowed_change,
      decision_rule:"Owner defines the test change and review threshold before activation; this release does not select a winner or apply a business change.",
      confounders:"Record material service-mix, condition, seasonality, traffic-source or capacity differences where known; do not convert correlation into causation."
    },
    owner_decision_required:true,
    automatic_activation_allowed:false,
    automatic_winner_selection_allowed:false,
    business_mutation_allowed:false
  };
}
function signal(area,evidence_state,finding,bounded_owner_review){return{area,evidence_state:evidence_state||"unavailable",finding,bounded_owner_review,causal_price_sensitivity_claimed:false,pricing_change_authorized:false,automatic_action_authorized:false};}
function drop(r){return r?{key:r.key,stage:r.label,sessions_lost:whole(r.drop_from_previous),drop_pct:num(r.drop_from_previous_pct)}:null;}
function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}} function clean(v){return String(v??"").trim()} function norm(v){return clean(v).toLowerCase()} function whole(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.floor(n):0} function nullableWhole(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.floor(n)):null} function nonneg(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.round(n):0} function num(v){const n=Number(v);return Number.isFinite(n)?n:null} function pct(a,b){return b>0?round1(a/b*100):null} function round1(v){return Math.round(Number(v)*10)/10} function fmt(v){return v==null?"unavailable":Number(v).toFixed(1)+"%"}
