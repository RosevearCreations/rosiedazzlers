// Build 439/449 — read-only owner-decision convergence + commercial decision closure packet.
const MAINTENANCE_DECISIONS = Object.freeze([
  ["eligibility","Eligibility","Which customer/vehicle types qualify, and is prior Rosie service or a minimum condition required?"],
  ["cadence","Cadence","Which service intervals are allowed, can seasonality change them, and what reschedule policy applies?"],
  ["price","Pricing","What pricing model, amount/discount and price-lock policy are approved?"],
  ["inclusions","Included services","Which service and add-on codes are included, and what condition limits apply?"],
  ["exclusions","Excluded services","Which services, add-ons or vehicle conditions are excluded?"],
  ["cancellation","Cancellation","What notice, late-cancel, missed-visit, pause and termination rules are approved?"],
  ["priority","Capacity & priority","Is priority booking allowed, are guaranteed slots prohibited, and how is capacity protected?"]
]);

const FLEET_DECISIONS = Object.freeze([
  ["fleet_minimums","Fleet minimums","What minimum vehicle count, service frequency or account spend qualifies?"],
  ["service_tiers","Service tiers","Which commercial service tiers are approved and what does each include?"],
  ["travel_limits","Travel limits","What included/max travel radius and travel-fee model are approved?"],
  ["volume_pricing","Volume pricing / discount","What volume pricing model or discount bands are approved?"],
  ["invoicing","Invoicing / credit terms","What billing model, payment terms, deposit policy and statement cycle are approved?"],
  ["cancellation","Fleet cancellation","What notice, late-cancel, missed-visit and reschedule rules are approved?"]
]);

const MAINTENANCE_REQUIRED_FIELDS = Object.freeze({
  eligibility:["eligible_customer_types","eligible_vehicle_types","required_prior_service","minimum_vehicle_condition"],
  cadence:["allowed_intervals","seasonal_adjustment_allowed","reschedule_policy"],
  price:["pricing_model","amount_cents or discount_percent","price_lock_policy"],
  inclusions:["service_codes","included_add_on_codes","condition_limits"],
  exclusions:["excluded_service_codes","excluded_add_on_codes","condition_exclusions"],
  cancellation:["notice_hours","late_cancel_fee_cents","missed_visit_policy","pause_policy","termination_policy"],
  priority:["priority_booking_allowed","guaranteed_slot_allowed","capacity_reservation_policy"]
});

const FLEET_REQUIRED_FIELDS = Object.freeze({
  fleet_minimums:["minimum_vehicles","minimum_service_frequency","minimum_account_spend_cents"],
  service_tiers:["tiers"],
  travel_limits:["included_radius_km","maximum_radius_km","travel_fee_model","travel_fee_cents"],
  volume_pricing:["pricing_model","bands","discount_percent"],
  invoicing:["billing_model","payment_terms_days","deposit_policy","statement_cycle"],
  cancellation:["notice_hours","late_cancel_fee_cents","missed_visit_policy","reschedule_policy"]
});

export function buildMaintenanceFleetOwnerApprovalConvergence(input={}) {
  const activation=objectOrEmpty(input.commercial_activation);
  const fleetLearning=objectOrEmpty(input.fleet_learning);
  const maintenance=objectOrEmpty(activation.maintenance);
  const fleet=objectOrEmpty(activation.fleet);
  const fleetRules=objectOrEmpty(fleetLearning.commercial_rules);
  const demand=objectOrEmpty(fleetLearning.inquiry_demand);
  const operations=objectOrEmpty(fleetLearning.operations);
  const capacity=objectOrEmpty(fleetLearning.capacity);

  const maintenanceStatus=clean(maintenance.rulebook_status)||"unavailable";
  const fleetStatus=clean(fleet.rulebook_status)||clean(fleetRules.source_status)||"unavailable";
  const maintenanceMetrics=safeMaintenanceMetrics(maintenance.metrics);
  const fleetMetrics=safeFleetMetrics(fleet.metrics,demand,operations);

  const maintenanceDecisions=MAINTENANCE_DECISIONS.map(([id,label,question])=>decision({
    id,group:"maintenance",label,question,source_status:maintenanceStatus,
    source_authority:"config/maintenance-plan-business-rulebook.json",
    evidence:maintenanceEvidence(id,maintenanceMetrics)
  }));
  const fleetDecisions=FLEET_DECISIONS.map(([id,label,question])=>decision({
    id,group:"fleet",label,question,source_status:fleetStatus,
    source_authority:"config/fleet-business-rulebook.json",
    evidence:fleetEvidence(id,fleetMetrics)
  }));

  const all=[...maintenanceDecisions,...fleetDecisions];
  const ownerAction=all.filter(x=>x.status==="owner_action").length;
  const sourceApproved=all.filter(x=>x.status==="source_approved").length;
  const closureCandidate=all.length>0&&sourceApproved===all.length;

  return {
    build:439,
    current_build:449,
    retained_authority:"maintenance_fleet_owner_approval_convergence",
    authority:"fleet_maintenance_commercial_decision_closure",
    mode:"maintenance_fleet_owner_approval_convergence",
    generated_at:clean(input.generated_at)||new Date().toISOString(),
    status: ownerAction ? "owner_action" : sourceApproved===all.length ? "source_approved" : "unavailable",
    summary:{
      decision_count:all.length,
      owner_action_count:ownerAction,
      source_approved_count:sourceApproved,
      maintenance_interest_total:maintenanceMetrics.total,
      maintenance_interested:maintenanceMetrics.interested,
      fleet_inquiry_total:fleetMetrics.inquiry_total,
      fleet_vehicles_requested:fleetMetrics.vehicles_requested,
      fleet_completed_work_evidence:fleetMetrics.completed_work_evidence,
      closure_candidate:closureCandidate,
      closure_status:closureCandidate?"owner_review_candidate":"owner_action"
    },
    decision_closure:{
      status:closureCandidate?"owner_review_candidate":"owner_action",
      closure_candidate:closureCandidate,
      decision_count:all.length,
      source_approved_count:sourceApproved,
      owner_action_count:ownerAction,
      canonical_sources:[
        "config/maintenance-plan-business-rulebook.json",
        "config/fleet-business-rulebook.json"
      ],
      explicit_owner_approval_required:true,
      owner_review_required:true,
      automatic_approval_performed:false,
      approval_timestamp_inferred:false
    },
    maintenance:{
      source_status:maintenanceStatus,
      decisions:maintenanceDecisions,
      operational_evidence:maintenanceMetrics
    },
    fleet:{
      source_status:fleetStatus,
      decisions:fleetDecisions,
      operational_evidence:fleetMetrics
    },
    capacity:{
      status:clean(capacity.status)||"unavailable",
      owner_action:true,
      current_live_capacity_inferred:false,
      availability_authority:clean(capacity.availability_authority)||"/api/availability",
      collision_revalidation_authority:clean(capacity.collision_revalidation_authority)||"/api/checkout",
      question:"What commercial capacity commitments, if any, are permitted? Never promise guaranteed capacity from aggregate demand evidence.",
      explanation:clean(capacity.explanation)||"Live capacity must be revalidated through the booking authorities.",
      commercial_policy_source:"config/maintenance-plan-business-rulebook.json#decisions.priority",
      required_fields:[...(MAINTENANCE_REQUIRED_FIELDS.priority||[])],
      closure_status:maintenanceStatus==="rules_ready"?"source_approved":"owner_action",
      live_capacity_is_separate_from_commercial_policy:true
    },
    owner_next_step:ownerAction
      ? "Review each unresolved decision, choose the real business terms, then make a separately reviewed source change to the canonical rulebook. This screen does not approve terms."
      : "Canonical source reports all decision domains approved. Operational activation still remains separately authorized.",
    boundaries:{
      read_only:true,
      owner_decision_mutation_available:false,
      commercial_decision_write_performed:false,
      rulebook_write_performed:false,
      automatic_approval_performed:false,
      approval_timestamp_inferred:false,
      automatic_discount_allowed:false,
      quote_acceptance_allowed:false,
      booking_creation_allowed:false,
      invoice_creation_allowed:false,
      recurring_billing_allowed:false,
      customer_outreach_allowed:false,
      provider_mutation_allowed:false,
      accounting_mutation_allowed:false,
      capacity_inferred:false,
      permanent_polling:false,
      customer_identity_exposed:false
    }
  };
}

function decision({id,group,label,question,source_status,source_authority,evidence}) {
  const approved=source_status==="rules_ready";
  const requiredFields=group==="maintenance"
    ? (MAINTENANCE_REQUIRED_FIELDS[id]||[])
    : (FLEET_REQUIRED_FIELDS[id]||[]);
  return {
    id,group,label,question,source_authority,source_status,
    status:approved ? "source_approved" : "owner_action",
    closure_status:approved ? "source_approved" : "owner_action",
    closed_by_source:approved,
    explicit_owner_decision_required:!approved,
    owner_decision_path:`${source_authority}#decisions.${id}`,
    required_fields:[...requiredFields],
    blocking_reason:approved?null:"Canonical source does not yet report this commercial decision set as fully approved.",
    evidence,
    approval_action_available:false,
    automatic_approval_performed:false
  };
}

function maintenanceEvidence(id,m) {
  if(id==="cadence") return {interest_total:m.total,interested:m.interested,contacted:m.contacted,meaning:"Interest volume may inform cadence; it does not approve cadence."};
  if(id==="price") return {interest_total:m.total,interested:m.interested,meaning:"Interest is demand evidence only; no price or discount is inferred."};
  if(id==="priority") return {interest_total:m.total,meaning:"Demand does not prove spare capacity or guaranteed slots."};
  return {interest_total:m.total,interested:m.interested,meaning:"Operational interest is context only; owner approval remains explicit."};
}

function fleetEvidence(id,m) {
  const common={inquiry_total:m.inquiry_total,vehicles_requested:m.vehicles_requested,completed_work_evidence:m.completed_work_evidence};
  if(id==="travel_limits") return {...common,service_area_counts:m.service_area_counts,meaning:"Observed requested areas inform review; they do not expand the service area."};
  if(id==="volume_pricing") return {...common,meaning:"Vehicle/inquiry volume does not approve a discount."};
  if(id==="invoicing") return {...common,account_count:m.account_count,meaning:"Observed accounts/work do not approve invoice or credit terms."};
  return {...common,meaning:"Observed commercial activity is context only; it is not an approved recurring contract."};
}

function safeMaintenanceMetrics(value){
  const s=objectOrEmpty(value);
  return {total:whole(s.total),new:whole(s.new),contacted:whole(s.contacted),interested:whole(s.interested),closed:whole(s.closed),unsubscribed:whole(s.unsubscribed)};
}
function safeFleetMetrics(value,demand,operations){
  const s=objectOrEmpty(value);
  return {
    inquiry_total:whole(demand.inquiry_count??s.total),
    vehicles_requested:whole(demand.vehicles_requested??s.vehicles_requested),
    quoted:whole(s.quoted),
    converted:whole(s.converted),
    completed_work_evidence:whole(operations.completed_work_evidence_count),
    account_count:whole(operations.fleet_account_count),
    service_area_counts:safeCountMap(demand.service_area_counts)
  };
}
function safeCountMap(value){
  const s=objectOrEmpty(value),out={};
  for(const [k,v] of Object.entries(s).slice(0,20)) out[clean(k).slice(0,80)||"unspecified"]=whole(v);
  return out;
}
function whole(value){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.floor(n):0;}
function objectOrEmpty(value){return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
function clean(value){return String(value??"").trim();}
