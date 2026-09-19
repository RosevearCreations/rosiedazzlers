// Build 439 — pure read-only owner-decision convergence model.
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

  return {
    build:439,
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
      fleet_completed_work_evidence:fleetMetrics.completed_work_evidence
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
      explanation:clean(capacity.explanation)||"Live capacity must be revalidated through the booking authorities."
    },
    owner_next_step:ownerAction
      ? "Review each unresolved decision, choose the real business terms, then make a separately reviewed source change to the canonical rulebook. This screen does not approve terms."
      : "Canonical source reports all decision domains approved. Operational activation still remains separately authorized.",
    boundaries:{
      read_only:true,
      owner_decision_mutation_available:false,
      rulebook_write_performed:false,
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
  return {
    id,group,label,question,source_authority,source_status,
    status:source_status==="rules_ready" ? "source_approved" : "owner_action",
    explicit_owner_decision_required:source_status!=="rules_ready",
    evidence,
    approval_action_available:false
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
