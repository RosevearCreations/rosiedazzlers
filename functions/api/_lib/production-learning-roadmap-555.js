// Build 555 — source-owned production learning. No inferred approvals or HOLD closures.
const RELEASES=Object.freeze([546,547,548,549,550,551,552,553,554]);
const choice=new Set(["retain_hold","retain_controls","bounded_manual_follow_up"]);
const clean=x=>typeof x==="string"?x.trim():"";
const date=x=>{const n=Date.parse(clean(x));return Number.isFinite(n)?new Date(n).toISOString():null};
const obj=x=>x&&typeof x==="object"&&!Array.isArray(x)?x:{};
export function build555ProductionLearning({owner_review={},release_records={},generated_at=null}={}){
 const now=date(generated_at)||new Date().toISOString(),records=Array.isArray(release_records?.rows)?release_records.rows:[];
 const exactRecords=records.length===9&&new Set(records.map(x=>x?.build)).size===9&&RELEASES.every(b=>records.some(x=>x?.build===b));
 const owner554=owner_review?.build===554&&owner_review?.authority==="service_economics_capacity_technical_reliability_owner_review"&&owner_review?.domain_count===4&&Array.isArray(owner_review?.rows)&&owner_review.rows.length===4;
 const rows=RELEASES.map(build=>{
  const r=obj(records.find(x=>x?.build===build)),gaps=[];
  const observed=date(r.observed_at),age=observed?Date.parse(now)-Date.parse(observed):NaN;
  if(!exactRecords)gaps.push("complete_unique_nine_release_source_records_required");
  if(!clean(r.owner_reference)||!clean(r.evidence_reference)||!observed||!Number.isFinite(age)||age< -60000||age>90*86400000)gaps.push("dated_attributable_current_evidence_required");
  if(!choice.has(r.decision)||r.owner_reviewed!==true)gaps.push("explicit_owner_decision_and_review_required");
  if(build===554&&(!owner554||owner_review.status!=="reviewed_controls_retained"||r.decision!=="retain_controls"))gaps.push("current_four_domain_554_owner_review_required");
  if(r.automatic_hold_closure===true||r.cross_domain_substitution===true||r.automatic_business_action===true)gaps.push("unsafe_inferred_business_authority_rejected");
  return Object.freeze({build,decision:choice.has(r.decision)?r.decision:null,owner_reference:clean(r.owner_reference)||null,evidence_reference:clean(r.evidence_reference)||null,observed_at:observed,
   status:gaps.length?"source_review_hold":"owner_decision_recorded",gaps:Object.freeze(gaps),hold_closed_automatically:false,customer_or_provider_action:false});
 });
 return Object.freeze({build:555,authority:"production_learning_546_554_governed_renewal",generated_at:now,retained_build554_authority:owner554,
  rows:Object.freeze(rows),review_required_count:rows.filter(x=>x.gaps.length).length,
  status:rows.every(x=>!x.gaps.length)?"owner_review_records_reconciled":"production_learning_hold",
  roadmap_next:Object.freeze(["556 — Evidence Intake and Owner HOLD Resolution","557 — DAIP Measured Worker Delivery & Quota Baseline","558 — Real Media Artifact and Consent Acceptance","559 — Authorized Channel Delivery Integration","560 — Production Learning and Next-Cycle Roadmap"]),
  truth_boundary:Object.freeze({provider_cost_inferred:false,price_or_discount_changed:false,canonical_hold_auto_closed:false,
   public_winter_claim_inferred:false,booking_or_availability_changed:false,source_green_assumed_business_green:false,
   db_or_r2_modified:false,video_render_or_social_post_performed:false})});
}
