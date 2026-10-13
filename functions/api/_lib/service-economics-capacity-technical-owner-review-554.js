// Build 554 — bounded owner review; no pricing, provider, booking, or HOLD mutation.
export const DOMAINS_554=Object.freeze(["explicit_allocation","seasonal_operability","observed_capacity","technical_reliability"]);
const OUTCOMES=Object.freeze({retain_hold:"retain_hold",retain_controls:"retain_current_controls",manual_follow_up:"bounded_manual_follow_up"});
const iso=s=>{const n=Date.parse(String(s||""));return Number.isFinite(n)?new Date(n).toISOString():null};
const string=x=>typeof x==="string"?x.trim():"";
const own=x=>x&&typeof x==="object"&&!Array.isArray(x)?x:{};
export function build554ServiceEconomicsCapacityTechnicalOwnerReview({integrity_review={},owner_review_records={},generated_at=null}={}){
 const now=iso(generated_at)||new Date().toISOString(), source=own(integrity_review), records=own(owner_review_records);
 const incoming=Array.isArray(records.rows)?records.rows:[], prior=Array.isArray(source.rows)?source.rows:[];
 const sourceExact=source.service_economics_seasonal_capacity_reliability_integrity_build===544&&
  source.service_economics_seasonal_capacity_reliability_integrity_authority==="service_economics_seasonal_capacity_reliability_evidence_integrity_review"&&
  source.source_recognized===true&&source.status==="service_economics_integrity_current"&&
  prior.length===4&&new Set(prior.map(r=>r.domain)).size===4&&
  DOMAINS_554.every(domain=>prior.some(r=>r.domain===domain&&r.integrity_state==="service_economics_domain_integrity_current"));
 const exactRows=incoming.length===4&&new Set(incoming.map(r=>r?.domain)).size===4&&DOMAINS_554.every(d=>incoming.some(r=>r?.domain===d));
 const rows=DOMAINS_554.map(domain=>{
  const original=prior.find(r=>r.domain===domain)||{}, recorded=incoming.find(r=>r?.domain===domain)||{};
  const reviewed=iso(recorded.reviewed_at), age=reviewed?Date.parse(now)-Date.parse(reviewed):NaN;
  const matching=Object.hasOwn(OUTCOMES,recorded.decision)&&OUTCOMES[recorded.decision]===original.retained_outcome;
  const reference=string(recorded.owner_reference), evidence=string(recorded.evidence_reference);
  const role=string(recorded.owner_role), reviewer=string(recorded.reviewer_reference);
  const ageValid=Number.isFinite(age)&&age>=-60000&&age<=30*86400000;
  const gaps=[];
  if(!sourceExact||original.integrity_state!=="service_economics_domain_integrity_current")gaps.push("retained_same_domain_integrity_review_required");
  if(!exactRows)gaps.push("complete_unique_four_domain_owner_record_required");
  if(!matching)gaps.push("explicit_decision_must_retain_source_outcome");
  if(!reference||!evidence||!role||!reviewer||!ageValid)gaps.push("dated_attributable_source_owned_evidence_required");
  if(recorded.independent_domain_reviewed!==true||recorded.cross_domain_substitution_rejected!==true)gaps.push("separate_domain_and_no_substitution_confirmation_required");
  if(domain==="technical_reliability"&&(recorded.first_party_only!==true||recorded.provider_billing_inferred===true))gaps.push("first_party_technical_only_not_provider_billing");
  if(domain==="seasonal_operability"&&recorded.winter_availability_inferred===true)gaps.push("no_unverified_winter_capability_claim");
  if(domain==="observed_capacity"&&recorded.future_capacity_committed===true)gaps.push("observed_capacity_not_future_commitment");
  if(domain==="explicit_allocation"&&recorded.price_change_authorized===true)gaps.push("allocation_not_price_authority");
  return Object.freeze({domain,retained_outcome:original.retained_outcome||null,owner_review_state:gaps.length?"owner_review_hold":"retained_controls_owner_reviewed",
   owner_reference:reference||null,evidence_reference:evidence||null,owner_role:role||null,reviewed_at:reviewed,
   gaps:Object.freeze(gaps),canonical_hold_changed:false,automatic_action_performed:false});
 });
 return Object.freeze({build:554,authority:"service_economics_capacity_technical_reliability_owner_review",
  retained_integrity_build:544,generated_at:now,source_exact:sourceExact,domain_count:rows.length,
  review_required_count:rows.filter(r=>r.gaps.length).length,status:rows.every(r=>!r.gaps.length)?"reviewed_controls_retained":"owner_review_hold",
  rows:Object.freeze(rows),truth_boundary:Object.freeze({price_or_discount_changed:false,booking_or_availability_changed:false,
   winter_public_claim_published:false,provider_billing_or_cpu_quota_inferred:false,future_staff_capacity_inferred:false,
   canonical_holds_closed:false,finance_or_recovery_action:false,db_or_storage_mutated:false,automatic_social_posting:false})});
}
