// Build 551 — source-owned maintenance/fleet commercial pilot owner decision.
// Never activates subscriptions, billing, customers, capacity, pricing or provider actions.
const str=v=>String(v??"").trim();
const iso=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
const count=v=>Number.isInteger(Number(v))&&Number(v)>0?Number(v):null;
const nonnegative=v=>v!==""&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
export function build551MaintenanceFleetCommercialDecision({integrity={},freshness={},owner_decision={},pilot_outcome={},source_available=false,generated_at=null}={}){
 const gaps=[],review=str(owner_decision?.decision).toLowerCase();
 const decisionValid=["hold","proceed_to_separate_pilot_authorization"].includes(review);
 const bound=count(owner_decision.participant_limit),days=count(owner_decision.duration_days);
 const cost=nonnegative(owner_decision.estimated_cost_cad);
 const revenue=nonnegative(owner_decision.estimated_revenue_cad);
 const margin=cost!==null&&revenue!==null?Math.round((revenue-cost)*100)/100:null;
 const retained=integrity?.status==="maintenance_fleet_continuation_integrity_current"&&
   freshness?.execution_evidence_freshness?.evidence_current===true;
 const outcome=integrity?.owner_outcome_identity||{};
 const stop=integrity?.pilot_execution_identity?.stop_condition_triggered===true;
 if(!source_available)gaps.push("source_owned_pilot_evidence_unavailable");
 if(!retained)gaps.push("retained_pilot_execution_freshness_integrity_required");
 if(stop)gaps.push("triggered_stop_condition_retain_hold");
 if(!decisionValid)gaps.push("explicit_owner_hold_or_proceed_decision_required");
 if(!str(owner_decision?.owner_role)||!iso(owner_decision?.reviewed_at)||!str(owner_decision?.decision_reference))
   gaps.push("dated_attributable_owner_decision_required");
 if(!bound||!days)gaps.push("explicit_participant_duration_bounds_required");
 if(cost===null||revenue===null)gaps.push("source_owned_cost_and_revenue_estimates_required");
 for(const f of ["travel_evidence_reference","capacity_evidence_reference","invoicing_evidence_reference","stop_conditions_reference"])
   if(!str(owner_decision?.[f]))gaps.push(f+"_required");
 if(str(owner_decision?.pilot_trace)!==str(integrity?.pilot_execution_identity?.current_evidence_trace_key)||!str(owner_decision?.pilot_trace))
   gaps.push("decision_trace_matches_current_pilot_required");
 const status=gaps.length?"retain_commercial_pilot_hold":review==="hold"?"explicit_owner_hold_recorded":"bounded_commercial_review_ready_not_activated";
 return Object.freeze({build:551,authority:"maintenance_fleet_pilot_commercial_decision",
   status,decision:decisionValid?review:"not_recorded",participant_limit:bound,duration_days:days,
   cost_estimate_cad:cost,revenue_estimate_cad:revenue,estimated_margin_cad:margin,
   historical_integrity_current:retained,owner_outcome:str(outcome.outcome)||"not_recorded",
   gaps:Object.freeze(gaps),decision_reference:str(owner_decision?.decision_reference)||null,
   decision_record_supplied:Boolean(Object.keys(owner_decision||{}).length),
   pilot_outcome_source_supplied:Boolean(Object.keys(pilot_outcome||{}).length),
   authorization:"separate_operator_approval_required",
   no_auto_enrollment:true,no_capacity_reservation:true,no_price_change:true,
   no_recurring_billing:true,no_invoice_mutation:true,no_booking_mutation:true,
   no_customer_outreach:true,no_automatic_hold_change:true,
   generated_at:iso(generated_at)||new Date().toISOString()});
}
