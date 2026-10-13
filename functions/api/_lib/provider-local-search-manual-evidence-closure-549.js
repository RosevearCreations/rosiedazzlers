// Build 549 — source-owned, read-only provider delivery and local search manual review.
const s=v=>String(v??"").trim();
const list=v=>Array.isArray(v)?v:[];
export function build549ProviderManualEvidenceReview({freshness={},integrity={},manual={}}={}){
 const p=freshness.provider_evidence||{},l=freshness.local_search_evidence||{};
 const pr=list(p.rows),lr=list(l.rows),op=manual.manual_hold_outcome||{};
 const pi=integrity.provider_source_identity||{},li=integrity.local_search_identity||{},oi=integrity.operator_review_identity||{};
 const pCurrent=pr.length===Number(p.required_count||4)&&pr.every(x=>x.freshness_state==="provider_evidence_current"&&x.source_available===true&&x.provider_identity_present===true&&x.current_attributable_outcome_present===true);
 const lCurrent=lr.length===Number(l.required_count||2)&&lr.every(x=>x.freshness_state==="local_search_evidence_current"&&x.identity_match===true&&x.equal_length_window===true&&x.distinct_window===true&&x.correct_provider_property_location_window_source===true);
 const traceCurrent=pi.identity_complete===true&&pi.trace_match===true&&li.identity_complete===true&&li.trace_match===true&&Boolean(s(manual.evidence_continuity?.expected_evidence_trace_key));
 const operatorCurrent=integrity.status==="closure_integrity_current"&&oi.current===true&&op.valid===true&&op.trace_match===true&&Boolean(s(op.reviewed_at))&&Boolean(s(op.reviewer_role))&&Boolean(s(op.outcome_reference));
 const gaps=[];
 if(!pCurrent)gaps.push("provider_payment_refund_message_delivery_source_evidence_required");
 if(!lCurrent)gaps.push("search_console_gbp_property_location_window_mismatch_or_stale");
 if(!traceCurrent)gaps.push("retained_evidence_trace_identity_review_required");
 if(!operatorCurrent)gaps.push("explicit_current_operator_review_required");
 return Object.freeze({
  build:549,authority:"provider_delivery_local_search_manual_evidence_closure",
  status:gaps.length?"manual_closure_review_required":"source_review_ready_not_canonical_hold_change",
  gaps:Object.freeze(gaps),
  provider:Object.freeze({required:Number(p.required_count||4),current:pr.filter(x=>x.freshness_state==="provider_evidence_current").length,
   rows:Object.freeze(pr.map(x=>Object.freeze({kind:s(x.id),label:s(x.label),source:s(x.source),observed_at:s(x.evidence_at)||null,state:x.freshness_state==="provider_evidence_current"?"current_source_owned":"manual_source_verification_required"})))}),
  local_search:Object.freeze({required:Number(l.required_count||2),current:lr.filter(x=>x.freshness_state==="local_search_evidence_current").length,
   rows:Object.freeze(lr.map(x=>Object.freeze({provider:s(x.provider),identity_kind:s(x.identity_kind),source_identity:s(x.current_identity)||null,
   window_start:s(x.current_period_start)||null,window_end:s(x.current_period_end)||null,observed_at:s(x.current_observed_at)||null,
   state:x.freshness_state==="local_search_evidence_current"?"current_matched_source_window":"manual_source_verification_required"})))}),
  operator:Object.freeze({recorded:op.present===true,current:operatorCurrent,decision:operatorCurrent?s(op.outcome):null}),
  first_party_attribution_is_descriptive_only:true,provider_payment_refund_delivery_mutation:false,
  search_console_gbp_mutation:false,customer_message_sent:false,booking_causation_inferred:false,
  canonical_hold_mutated:false,read_only:true
 });
}
