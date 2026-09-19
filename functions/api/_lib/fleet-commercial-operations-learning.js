const DEFAULT_CAPACITY_AUTHORITIES = Object.freeze({
  availability: "/api/availability",
  booking_collision_revalidation: "/api/checkout"
});

export function buildFleetCommercialOperationsLearning(input = {}) {
  const leads = arrayOfObjects(input.fleet_leads);
  const accounts = arrayOfObjects(input.fleet_accounts);
  const vehicles = arrayOfObjects(input.fleet_vehicles);
  const groups = arrayOfObjects(input.request_groups);
  const jobs = arrayOfObjects(input.request_jobs);
  const history = arrayOfObjects(input.service_history);
  const requiredDomains = uniqueStrings(input.required_rulebook_domains);
  const approvedDomains = uniqueStrings(input.approved_rulebook_domains);
  const unresolvedDomains = uniqueStrings(
    input.unresolved_rulebook_domains?.length
      ? input.unresolved_rulebook_domains
      : requiredDomains.filter((domain) => !approvedDomains.includes(domain))
  );
  const rulebookStatus = clean(input.rulebook_status) || (unresolvedDomains.length ? "awaiting_business_approval" : "rules_ready");

  const demand = buildDemandEvidence(leads);
  const operations = buildOperationsEvidence({ accounts, vehicles, groups, jobs, history });
  const commercialRules = buildRuleEvidence({
    rulebookStatus,
    requiredDomains,
    approvedDomains,
    unresolvedDomains,
    operationalAuthority: objectOrEmpty(input.operational_authority)
  });

  const evidenceStatus = overallEvidenceStatus({ demand, operations, commercialRules });

  return Object.freeze({
    build: 430,
    mode: "fleet_commercial_operations_learning",
    evidence_status: evidenceStatus,
    inquiry_demand: Object.freeze(demand),
    commercial_rules: Object.freeze(commercialRules),
    operations: Object.freeze(operations),
    capacity: Object.freeze({
      status: "unavailable",
      availability_authority: DEFAULT_CAPACITY_AUTHORITIES.availability,
      collision_revalidation_authority: DEFAULT_CAPACITY_AUTHORITIES.booking_collision_revalidation,
      current_live_capacity_inferred: false,
      booking_slot_reserved: false,
      explanation: "Fleet inquiry or request volume does not prove live capacity. Current availability must be checked through the authoritative booking endpoints."
    }),
    owner_review: Object.freeze(buildOwnerReview({ demand, commercialRules, operations })),
    boundaries: Object.freeze({
      read_only_learning: true,
      customer_identity_exposed: false,
      signed_commercial_business_inferred: false,
      inquiry_conversion_inferred: false,
      pricing_terms_inferred: false,
      fleet_discount_inferred: false,
      quote_acceptance_inferred: false,
      invoice_creation_allowed: false,
      booking_creation_allowed: false,
      service_area_expansion_allowed: false,
      credit_terms_allowed: false,
      payment_provider_mutation_allowed: false,
      accounting_posting_allowed: false,
      customer_outreach_allowed: false,
      role_mutation_allowed: false,
      schema_authority: false,
      permanent_polling_allowed: false
    })
  });
}

function buildDemandEvidence(rows) {
  const statusCounts = countBy(rows, (row) => normalize(row.status) || "unknown");
  const cadenceCounts = countBy(rows, (row) => clean(row.preferred_cadence) || "unspecified");
  const serviceAreaCounts = countBy(rows, (row) => clean(row.service_area) || "unspecified");
  const vehiclesRequested = rows.reduce((sum, row) => sum + finiteWhole(row.vehicle_count), 0);
  return {
    status: rows.length ? "observed" : "unavailable",
    inquiry_count: rows.length,
    status_counts: statusCounts,
    vehicles_requested: vehiclesRequested,
    preferred_cadence_counts: cadenceCounts,
    service_area_counts: serviceAreaCounts,
    converted_inquiry_count: statusCounts.converted || 0,
    quoted_inquiry_count: statusCounts.quoted || 0,
    signed_business_claim: false,
    demand_equals_capacity: false
  };
}

function buildRuleEvidence({ rulebookStatus, requiredDomains, approvedDomains, unresolvedDomains, operationalAuthority }) {
  const ownerAction = unresolvedDomains.length > 0 || rulebookStatus !== "rules_ready";
  return {
    status: ownerAction ? "owner_action" : "rules_ready",
    source_status: rulebookStatus,
    required_domains: requiredDomains,
    approved_domains: approvedDomains,
    unresolved_domains: unresolvedDomains,
    approved_domain_count: approvedDomains.length,
    unresolved_domain_count: unresolvedDomains.length,
    commercial_terms_complete: !ownerAction,
    operational_authority: {
      fleet_account_activation_allowed: operationalAuthority.fleet_account_activation_allowed === true,
      automatic_discount_application_allowed: operationalAuthority.automatic_discount_application_allowed === true,
      invoice_creation_allowed: operationalAuthority.invoice_creation_allowed === true,
      booking_creation_allowed: operationalAuthority.booking_creation_allowed === true,
      recurring_billing_allowed: operationalAuthority.recurring_billing_allowed === true,
      provider_mutation_allowed: operationalAuthority.provider_mutation_allowed === true,
      database_mutation_allowed: operationalAuthority.database_mutation_allowed === true
    }
  };
}

function buildOperationsEvidence({ accounts, vehicles, groups, jobs, history }) {
  const groupStatuses = countBy(groups, (row) => normalize(row.status) || "unknown");
  const jobStatuses = countBy(jobs, (row) => normalize(row.status) || "unknown");
  const accountStatuses = countBy(accounts, (row) => normalize(row.contract_status) || "unspecified");
  const activeVehicles = vehicles.filter((row) => row.active !== false).length;
  const linkedBookingJobs = jobs.filter((row) => clean(row.booking_id)).length;
  const completedRequestJobs = jobs.filter((row) => normalize(row.status) === "completed").length;
  const serviceMix = aggregateServiceMix(jobs, history);

  const any = accounts.length || vehicles.length || groups.length || jobs.length || history.length;
  return {
    status: any ? "observed" : "unavailable",
    fleet_account_count: accounts.length,
    account_status_counts: accountStatuses,
    active_vehicle_count: activeVehicles,
    request_group_count: groups.length,
    request_group_status_counts: groupStatuses,
    request_job_count: jobs.length,
    request_job_status_counts: jobStatuses,
    jobs_linked_to_booking: linkedBookingJobs,
    completed_request_jobs: completedRequestJobs,
    service_history_count: history.length,
    completed_work_evidence_count: Math.max(completedRequestJobs, history.length),
    service_mix: serviceMix,
    recurring_commitment_inferred: false,
    completed_work_implies_contract: false
  };
}

function aggregateServiceMix(jobs, history) {
  const counts = new Map();
  for (const row of jobs) addService(counts, row.service_request);
  for (const row of history) addService(counts, row.service_summary);
  return [...counts.entries()]
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count || a.service.localeCompare(b.service))
    .slice(0, 12);
}

function addService(counts, value) {
  const label = clean(value);
  if (!label) return;
  counts.set(label, (counts.get(label) || 0) + 1);
}

function buildOwnerReview({ demand, commercialRules, operations }) {
  const items = [];
  if (demand.inquiry_count) {
    items.push(`${demand.inquiry_count} fleet/commercial inquiry record(s) are available for aggregate demand review; inquiry volume is not signed business.`);
  } else {
    items.push("No fleet/commercial inquiry evidence is currently available.");
  }
  if (commercialRules.unresolved_domain_count) {
    items.push(`${commercialRules.unresolved_domain_count} fleet commercial rulebook domain(s) still require owner approval before terms may be treated as approved.`);
  } else {
    items.push("All required fleet rulebook domains are source-approved; real capacity and booking authority still require live validation.");
  }
  if (operations.completed_work_evidence_count) {
    items.push(`${operations.completed_work_evidence_count} completed-work evidence record(s) are available across request jobs/service history; this does not itself prove a recurring commercial contract.`);
  }
  items.push("Current fleet capacity remains unavailable from this learning layer; /api/availability and /api/checkout remain authoritative.");
  return items;
}

function overallEvidenceStatus({ demand, operations, commercialRules }) {
  if (demand.status === "unavailable" && operations.status === "unavailable") return "unavailable";
  if (commercialRules.status === "owner_action") return "owner_action";
  if (demand.status === "unavailable" || operations.status === "unavailable") return "partial";
  return "ready";
}

function countBy(rows, getter) {
  const out = {};
  for (const row of rows) {
    const key = String(getter(row) || "unknown");
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function uniqueStrings(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(clean).filter(Boolean))];
}

function finiteWhole(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function arrayOfObjects(value) {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === "object" && !Array.isArray(row)) : [];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalize(value) {
  return clean(value).toLowerCase();
}

function clean(value) {
  return String(value ?? "").trim();
}
