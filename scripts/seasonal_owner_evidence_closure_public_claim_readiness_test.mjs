#!/usr/bin/env node
import assert from "node:assert/strict";
import {buildSeasonalOwnerPublicClaimReadiness as build} from "../functions/api/_lib/seasonal-owner-evidence-closure-public-claim-readiness.js";
const now="2026-10-10T12:00:00Z";
const common={
  capability_evidence_current:true,classification:"temperature_limited_outdoor",
  evidence_source_type:"product",evidence_source:"dated-tds",
  minimum_working_temperature_c:5,exact_temperature_claim_supported:true,
  public_claim_activation_decision:"approve_public_claim_activation",
  public_claim_activation_reference:"owner-decision-101",
  public_claim_activation_reviewed_at:"2026-10-09T12:00:00Z",
  public_claim_activation_wording_confirmed:true,
  proposed_public_claim_wording:"Outdoor wash only when the product limits and current conditions are verified."
};
const inputs=[
  {package_code:"wash",...common},
  {package_code:"winter_wash",...common,proposed_public_claim_wording:"Available all winter"},
  {package_code:"no_limit",...common,minimum_working_temperature_c:null},
  {package_code:"old_owner",...common,public_claim_activation_reviewed_at:"2026-08-01T00:00:00Z"},
  {package_code:"hold",...common,public_claim_activation_decision:"hold_public_claim_activation"},
  {package_code:"widen",...common,public_claim_outcome_minimum_working_temperature_c:0},
  {package_code:"dup",...common},
  {package_code:"dup",...common},
  {add_on_code:"ceramic",...common,classification:"controlled_environment_required",
    indoor_capable_workflow_supported:false}
];
const integrity=inputs.filter((x,i)=>i!==7).map(x=>({
  entity_type:x.add_on_code?"add_on":"package",code:x.package_code||x.add_on_code,
  evidence_integrity_current:true,integrity_state:"integrity_current"
}));
integrity.push({entity_type:"service",code:"missing_source",evidence_integrity_current:true});
const report={economics:{seasonal_public_claim_evidence_integrity_review:{rows:integrity}}};
const economics={seasonal_operability_evidence:{rows:inputs}};
const result=build({report,economics,generated_at:now});
const find=(code)=>result.rows.find(x=>x.code===code);
assert.equal(result.build,546);
assert.equal(result.row_count,9);
assert.equal(find("wash").state,"publication_decision_ready_for_manual_review");
assert.equal(find("hold").state,"retain_hold_confirmed_for_manual_review");
assert.equal(find("winter_wash").missing.includes("unsupported_broad_winter_wording"),true);
assert.equal(find("no_limit").missing.includes("source_owned_working_temperature_limit"),true);
assert.equal(find("old_owner").missing.includes("dated_attributable_owner_decision"),true);
assert.equal(find("widen").missing.includes("prior_claim_threshold_widens_source_owned_limit"),true);
assert.equal(find("dup").missing.includes("duplicate_owning_service_evidence"),true);
assert.equal(find("ceramic").missing.includes("controlled_environment_workflow_evidence"),true);
assert.equal(find("missing_source").state,"evidence_unavailable");
assert.equal(result.decision_ready_count,1);
assert.equal(result.retained_hold_count,1);
assert.equal(result.review_required_count,7);
assert.equal(result.automatic_publication_allowed,false);
assert.equal(result.canonical_hold_mutation_allowed,false);
assert.equal(result.storage_mutation_allowed,false);
const empty=build({generated_at:now});
assert.equal(empty.status,"unavailable");
assert.equal(empty.decision_ready_count,0);
const noIntegrity=build({economics:{seasonal_operability_evidence:{rows:[inputs[0]]}},generated_at:now});
assert.equal(noIntegrity.decision_ready_count,0);
assert.equal(noIntegrity.rows[0].missing.includes("build536_outcome_integrity_or_current_source_review"),true);
const stale=build({report,economics,generated_at:"2026-12-01T00:00:00Z"});
assert.equal(stale.decision_ready_count,0);
console.log("BUILD 546 SEASONAL OWNER EVIDENCE CLOSURE & CLAIM READINESS TEST: PASS");
