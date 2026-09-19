import assert from "node:assert/strict";
import { buildReliabilitySecurityCostReassessment } from "../functions/api/_lib/reliability-security-cost-reassessment.js";

const generated="2026-09-19T17:00:00.000Z";
const stable=buildReliabilitySecurityCostReassessment({
  generated_at:generated,
  reliability:{
    diagnostics:{state:"stable",duration_ms:400,failed_checks:0,degraded_checks:0},
    traffic:{state:"stable",events_24h:10,events_7d:70,recent_to_prior_ratio:1}
  },
  security:{
    security:{state:"ready",risk_rows:0,rls_disabled:0,browser_grants:0},
    sessions:{state:"ready",staff_secret_configured:true,customer_secret_configured:true,legacy_admin_fallback_enabled:false},
    privacy:{state:"ready",current_explicit_consent_required:true,inferred_consent_allowed:false,definitive_delivery_requires_provider_evidence:true},
    recovery:{state:"owner_action",source_authority_available:true,observed_drill:false,production_mutation_performed:false}
  },
  readiness:{
    items:[
      {id:"runtime_identity",name:"Runtime identity",classification:"runtime_proven",detail:"exact",evidence:{}},
      {id:"stripe_provider_outcome",name:"Stripe outcome",classification:"provider_dependent",detail:"hold",evidence:{}},
      {id:"backup_export_proof",name:"Backup proof",classification:"owner_action",detail:"review",evidence:{}},
      {id:"paypal_old",name:"Old PayPal evidence",classification:"runtime_proven",detail:"old",evidence:{latest_accepted_at:"2026-07-01T00:00:00.000Z"}}
    ]
  },
  source_status:{
    reliability_performance_cost_capacity:{available:true},
    security_privacy_recovery_drill:{available:true},
    go_live_readiness:{available:true}
  }
});
assert.equal(stable.boundaries.read_only,true);
assert.equal(stable.boundaries.permanent_polling,false);
assert.equal(stable.truth_boundary.cloudflare_billing_or_cpu_usage_measured,false);
assert.ok(stable.counts.green_retained_controls>=5);
assert.ok(stable.counts.owner_action>=2);
assert.ok(stable.counts.provider_dependency>=1);
assert.ok(stable.counts.stale_evidence>=1);
assert.ok(stable.buckets.unavailable_evidence.some(x=>x.id==="cost:cloudflare-provider-metrics"));
assert.equal(stable.overall,"partial");

const pressure=buildReliabilitySecurityCostReassessment({
  generated_at:generated,
  reliability:{diagnostics:{state:"pressure",duration_ms:3500,failed_checks:1,degraded_checks:0},traffic:{state:"watch",events_24h:90,events_7d:150,recent_to_prior_ratio:9}},
  security:{security:{state:"blocked",risk_rows:2,rls_disabled:1,browser_grants:0},sessions:{state:"ready"},privacy:{state:"ready"},recovery:{state:"owner_action"}},
  readiness:{items:[]},
  source_status:{reliability_performance_cost_capacity:{available:true},security_privacy_recovery_drill:{available:true},go_live_readiness:{available:false,error_class:"timeout"}}
});
assert.equal(pressure.overall,"attention");
assert.ok(pressure.counts.operational_pressure>=3);
assert.ok(pressure.buckets.unavailable_evidence.some(x=>x.id==="source:go-live-readiness"));

console.log("BUILD 434 RELIABILITY / SECURITY / COST REASSESSMENT TEST: PASS");
