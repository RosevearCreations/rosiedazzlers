import assert from "node:assert/strict";
import {build554ServiceEconomicsCapacityTechnicalOwnerReview as owner,DOMAINS_554} from "../functions/api/_lib/service-economics-capacity-technical-owner-review-554.js";
import {build554DaipManualDeliveryPacket as media} from "../assets/daip-operator-delivery-review-554.js";
const outcomes=["retain_current_controls","retain_hold","bounded_manual_follow_up","retain_current_controls"];
const integrity={service_economics_seasonal_capacity_reliability_integrity_build:544,
 service_economics_seasonal_capacity_reliability_integrity_authority:"service_economics_seasonal_capacity_reliability_evidence_integrity_review",
 source_recognized:true,status:"service_economics_integrity_current",
 rows:DOMAINS_554.map((domain,i)=>({domain,integrity_state:"service_economics_domain_integrity_current",retained_outcome:outcomes[i]}))};
const decisions=["retain_controls","retain_hold","manual_follow_up","retain_controls"];
const inputs={rows:DOMAINS_554.map((domain,i)=>({domain,decision:decisions[i],owner_reference:"owner-"+i,
 evidence_reference:"evidence-"+i,owner_role:"manager",reviewer_reference:"reviewer-"+i,
 reviewed_at:"2026-10-13T14:00:00Z",independent_domain_reviewed:true,cross_domain_substitution_rejected:true,
 ...(domain==="technical_reliability"?{first_party_only:true}:{})}))};
const run=(a=integrity,b=inputs)=>owner({integrity_review:a,owner_review_records:b,generated_at:"2026-10-13T15:00:00Z"});
assert.equal(run().status,"reviewed_controls_retained");
assert.equal(run().review_required_count,0);
assert.equal(run().truth_boundary.provider_billing_or_cpu_quota_inferred,false);
assert.equal(run({}).status,"owner_review_hold");
const duplicate=structuredClone(inputs);duplicate.rows[1].domain=duplicate.rows[0].domain;assert.equal(run(integrity,duplicate).status,"owner_review_hold");
const swapped=structuredClone(inputs);swapped.rows[1].decision="retain_controls";assert.equal(run(integrity,swapped).status,"owner_review_hold");
const stale=structuredClone(inputs);stale.rows[0].reviewed_at="2026-01-01T00:00:00Z";assert.equal(run(integrity,stale).status,"owner_review_hold");
const provider=structuredClone(inputs);provider.rows[3].provider_billing_inferred=true;assert.equal(run(integrity,provider).status,"owner_review_hold");
const winter=structuredClone(inputs);winter.rows[1].winter_availability_inferred=true;assert.equal(run(integrity,winter).status,"owner_review_hold");
const draft={build:553,source_private:true,public_social_posts_created:false,project_id:"private-1",drafts:[{platform:"instagram",status:"draft_requires_human_review",gaps:[],title:"Example",format:"9:16"}]};
const approval={operator_approved:true,operator_reference:"ref",consent_current:true,consent_reference:"ref",
 faces_plates_addresses_inspected:true,redaction_reference:"ref",audio_rights_confirmed:true,audio_rights_reference:"ref",
 private_render_verified:true,private_output_reference:"ref",worker_budget_verified:true,worker_reference:"ref",
 platform_authorization_verified:true,platform_authorization_reference:"ref"};
const check=(d=draft,a=approval,p="instagram")=>media({private_drafts:d,project_id:"private-1",platform:p,approval:a});
assert.equal(check().status,"manual_export_candidate_only");
assert.equal(check().dispatch_ledger.dispatch_attempted,false);
assert.equal(check().dispatch_ledger.remote_post_id,null);
assert.equal(check().automatic_post_or_schedule,false);
assert.equal(check(draft,{}, "instagram").status,"private_delivery_hold");
assert.equal(check(draft,approval,"facebook").status,"private_delivery_hold");
assert.equal(check({...draft,project_id:"other"},approval).status,"private_delivery_hold");
assert.equal(check({...draft,drafts:[{...draft.drafts[0],gaps:["claims_missing"]}]},approval).status,"private_delivery_hold");
console.log("BUILD 554: OWNER-REVIEW FOUR DOMAINS + DAIP PRIVATE MANUAL DELIVERY: PASS");
