const MAINTENANCE_DOMAINS = Object.freeze([
  "eligibility",
  "cadence",
  "price",
  "inclusions",
  "exclusions",
  "cancellation",
  "priority"
]);

const FLEET_DOMAINS = Object.freeze([
  "fleet_minimums",
  "service_tiers",
  "travel_limits",
  "volume_pricing",
  "invoicing",
  "cancellation"
]);

const LOCKED_ACTIONS = Object.freeze([
  "automatic_outreach",
  "automatic_enrollment",
  "automatic_booking",
  "automatic_discount_application",
  "automatic_invoice_creation",
  "automatic_recurring_billing",
  "automatic_renewal",
  "provider_mutation"
]);

export function buildMaintenanceFleetCommercialAcceptance(input = {}) {
  const maintenance = evaluateMaintenanceTerms(input.maintenance_rulebook);
  const fleet = evaluateFleetTerms(input.fleet_rulebook);
  const capacity = evaluateCapacityAuthority(input.capacity_contract);
  const quoteEvidence = evaluateFleetQuoteEvidence(input.fleet_quotes);

  const sourceReasons = [];
  if (!maintenance.source_contract_safe) sourceReasons.push(...maintenance.source_reasons);
  if (!fleet.source_contract_safe) sourceReasons.push(...fleet.source_reasons);
  if (!capacity.source_contract_safe) sourceReasons.push(...capacity.source_reasons);

  const sourceStatus = sourceReasons.length ? "review" : "ready";
  const ownerActions = [
    ...maintenance.owner_actions.map((reason) => `maintenance: ${reason}`),
    ...fleet.owner_actions.map((reason) => `fleet: ${reason}`)
  ];

  let businessReadinessStatus = "ready";
  if (sourceStatus !== "ready") businessReadinessStatus = "review";
  else if (ownerActions.length) businessReadinessStatus = "owner_action";

  return {
    build: 410,
    mode: "maintenance_fleet_commercial_acceptance",
    source_acceptance: {
      status: sourceStatus,
      reasons: unique(sourceReasons),
      safe_to_promote_source: sourceStatus === "ready"
    },
    business_readiness: {
      status: businessReadinessStatus,
      owner_actions: unique(ownerActions),
      source_release_green_is_not_business_approval: true
    },
    maintenance,
    fleet,
    capacity,
    fleet_quote_evidence: quoteEvidence,
    boundaries: {
      read_only_acceptance: true,
      schema_authority: false,
      source_release_green_may_coexist_with_owner_action: true,
      commercial_terms_may_be_inferred: false,
      pricing_may_be_inferred: false,
      customer_commitment_may_be_inferred: false,
      capacity_may_be_inferred: false,
      automatic_outreach_allowed: false,
      automatic_enrollment_allowed: false,
      automatic_booking_allowed: false,
      automatic_discount_application_allowed: false,
      automatic_invoice_creation_allowed: false,
      automatic_recurring_billing_allowed: false,
      automatic_renewal_allowed: false,
      provider_mutation_allowed: false,
      locked_actions: [...LOCKED_ACTIONS]
    }
  };
}

export function evaluateMaintenanceTerms(rulebook = {}) {
  const source = objectOrEmpty(rulebook);
  const decisions = objectOrEmpty(source.decisions);
  const activation = objectOrEmpty(source.activation);
  const sourceReasons = [];
  const ownerActions = [];

  if (source.business_approval_required !== true) {
    sourceReasons.push("Maintenance rulebook must explicitly require business approval.");
  }

  const missingDomains = MAINTENANCE_DOMAINS.filter((domain) => !isPlainObject(decisions[domain]));
  if (missingDomains.length) {
    sourceReasons.push(`Maintenance rulebook is missing decision domains: ${missingDomains.join(", ")}.`);
  }

  const unapprovedDomains = MAINTENANCE_DOMAINS.filter(
    (domain) => !isPlainObject(decisions[domain]) || decisions[domain].approved !== true
  );

  if (unapprovedDomains.length) {
    ownerActions.push(`Approve maintenance commercial domains: ${unapprovedDomains.join(", ")}.`);
  }

  const unresolvedFields = [];
  if ((decisions.price || {}).approved === true) {
    const price = objectOrEmpty(decisions.price);
    if (!clean(price.pricing_model)) unresolvedFields.push("price.pricing_model");
    if (finiteNonNegative(price.amount_cents) === null && finitePercent(price.discount_percent) === null) {
      unresolvedFields.push("price.amount_cents_or_discount_percent");
    }
  }
  if ((decisions.cadence || {}).approved === true && !nonEmptyArray(decisions.cadence?.allowed_intervals)) {
    unresolvedFields.push("cadence.allowed_intervals");
  }
  if ((decisions.inclusions || {}).approved === true && !nonEmptyArray(decisions.inclusions?.service_codes)) {
    unresolvedFields.push("inclusions.service_codes");
  }
  if (unresolvedFields.length) {
    sourceReasons.push(`Approved maintenance decisions remain incomplete: ${unresolvedFields.join(", ")}.`);
  }

  const dangerousActivation = [
    ["plan_enabled", activation.plan_enabled],
    ["pilot_enrollment_allowed", activation.pilot_enrollment_allowed],
    ["automatic_enrollment_allowed", activation.automatic_enrollment_allowed],
    ["recurring_billing_allowed", activation.recurring_billing_allowed],
    ["automatic_renewal_allowed", activation.automatic_renewal_allowed]
  ].filter(([, value]) => value === true);

  if (unapprovedDomains.length && dangerousActivation.length) {
    sourceReasons.push(
      `Maintenance activation cannot be enabled while commercial domains are unapproved: ${dangerousActivation.map(([key]) => key).join(", ")}.`
    );
  }

  const termsReady = (
    source.business_approval_required === true &&
    missingDomains.length === 0 &&
    unapprovedDomains.length === 0 &&
    unresolvedFields.length === 0
  );

  return {
    status: termsReady ? "commercial_terms_approved" : "owner_action",
    source_contract_safe: sourceReasons.length === 0,
    source_reasons: unique(sourceReasons),
    commercial_terms_ready: termsReady,
    required_domains: [...MAINTENANCE_DOMAINS],
    unapproved_domains: unapprovedDomains,
    owner_actions: unique(ownerActions),
    activation: {
      plan_enabled: activation.plan_enabled === true,
      pilot_enrollment_allowed: activation.pilot_enrollment_allowed === true,
      automatic_enrollment_allowed: activation.automatic_enrollment_allowed === true,
      recurring_billing_allowed: activation.recurring_billing_allowed === true,
      automatic_renewal_allowed: activation.automatic_renewal_allowed === true
    },
    explicit_staff_activation_required: true,
    customer_vehicle_identity_required: true,
    automatic_enrollment_allowed: false,
    automatic_renewal_allowed: false,
    recurring_billing_allowed: false
  };
}

export function evaluateFleetTerms(rulebook = {}) {
  const source = objectOrEmpty(rulebook);
  const decisions = objectOrEmpty(source.decisions);
  const operational = objectOrEmpty(source.operational_authority);
  const sourceReasons = [];
  const ownerActions = [];

  if (source.business_approval_required !== true) {
    sourceReasons.push("Fleet rulebook must explicitly require business approval.");
  }

  const missingDomains = FLEET_DOMAINS.filter((domain) => !isPlainObject(decisions[domain]));
  if (missingDomains.length) {
    sourceReasons.push(`Fleet rulebook is missing decision domains: ${missingDomains.join(", ")}.`);
  }

  const unapprovedDomains = FLEET_DOMAINS.filter(
    (domain) => !isPlainObject(decisions[domain]) || decisions[domain].approved !== true
  );
  if (unapprovedDomains.length) {
    ownerActions.push(`Approve fleet commercial domains: ${unapprovedDomains.join(", ")}.`);
  }

  const unresolvedFields = [];
  const minimums = objectOrEmpty(decisions.fleet_minimums);
  if (minimums.approved === true && finitePositiveWhole(minimums.minimum_vehicles) === null) {
    unresolvedFields.push("fleet_minimums.minimum_vehicles");
  }
  const tiers = objectOrEmpty(decisions.service_tiers);
  if (tiers.approved === true && !nonEmptyArray(tiers.tiers)) unresolvedFields.push("service_tiers.tiers");
  const travel = objectOrEmpty(decisions.travel_limits);
  if (travel.approved === true && finiteNonNegative(travel.maximum_radius_km) === null) {
    unresolvedFields.push("travel_limits.maximum_radius_km");
  }
  const pricing = objectOrEmpty(decisions.volume_pricing);
  if (pricing.approved === true && !clean(pricing.pricing_model)) {
    unresolvedFields.push("volume_pricing.pricing_model");
  }
  const invoicing = objectOrEmpty(decisions.invoicing);
  if (invoicing.approved === true && !clean(invoicing.billing_model)) {
    unresolvedFields.push("invoicing.billing_model");
  }
  if (unresolvedFields.length) {
    sourceReasons.push(`Approved fleet decisions remain incomplete: ${unresolvedFields.join(", ")}.`);
  }

  const forbiddenOperationalFlags = [
    "fleet_account_activation_allowed",
    "automatic_discount_application_allowed",
    "invoice_creation_allowed",
    "booking_creation_allowed",
    "recurring_billing_allowed",
    "provider_mutation_allowed"
  ].filter((key) => operational[key] === true);

  if (unapprovedDomains.length && forbiddenOperationalFlags.length) {
    sourceReasons.push(
      `Fleet operational authority cannot be enabled while commercial domains are unapproved: ${forbiddenOperationalFlags.join(", ")}.`
    );
  }

  const termsReady = (
    source.business_approval_required === true &&
    missingDomains.length === 0 &&
    unapprovedDomains.length === 0 &&
    unresolvedFields.length === 0
  );

  return {
    status: termsReady ? "commercial_terms_approved" : "owner_action",
    source_contract_safe: sourceReasons.length === 0,
    source_reasons: unique(sourceReasons),
    commercial_terms_ready: termsReady,
    required_domains: [...FLEET_DOMAINS],
    unapproved_domains: unapprovedDomains,
    owner_actions: unique(ownerActions),
    explicit_quote_acceptance_required: true,
    quote_acceptance_does_not_create_booking: true,
    po_reference_is_metadata_only: true,
    invoice_group_reference_is_metadata_only: true,
    automatic_discount_application_allowed: false,
    automatic_invoice_creation_allowed: false,
    booking_creation_allowed: false,
    recurring_billing_allowed: false
  };
}

export function evaluateCapacityAuthority(contract = {}) {
  const source = objectOrEmpty(contract);
  const sourceReasons = [];
  if (source.read_only !== true) sourceReasons.push("Capacity authority must remain read-only.");
  if (source.availability_authority !== "/api/availability") {
    sourceReasons.push("Capacity must remain subordinate to /api/availability.");
  }
  if (source.collision_revalidation_authority !== "/api/checkout") {
    sourceReasons.push("Final capacity collision authority must remain /api/checkout.");
  }
  if (source.never_opens_closed_slots !== true) {
    sourceReasons.push("Capacity intelligence must never open a closed slot.");
  }
  if (source.background_polling !== false) {
    sourceReasons.push("Capacity acceptance must not require permanent background polling.");
  }

  return {
    status: sourceReasons.length ? "review" : "source_ready",
    source_contract_safe: sourceReasons.length === 0,
    source_reasons: unique(sourceReasons),
    availability_authority: source.availability_authority || null,
    collision_revalidation_authority: source.collision_revalidation_authority || null,
    live_slot_availability_inferred: false,
    capacity_reservation_inferred: false,
    live_capacity_requires_date_slot_revalidation: true
  };
}

export function evaluateFleetQuoteEvidence(rows = []) {
  const list = Array.isArray(rows) ? rows.filter(isPlainObject) : [];
  let draft = 0;
  let sent = 0;
  let accepted = 0;
  let explicitAcceptedValueCents = 0;
  const review = [];

  for (const row of list) {
    const status = clean(row.status).toLowerCase();
    const quoted = finitePositiveWhole(row.quoted_amount_cents);
    const acceptedAmount = finitePositiveWhole(row.accepted_amount_cents);
    if (status === "draft") draft += 1;
    if (status === "sent" || row.sent_at) sent += 1;

    const explicitAcceptance = (
      status === "accepted" &&
      Boolean(row.accepted_at) &&
      quoted !== null &&
      acceptedAmount !== null
    );

    if (explicitAcceptance) {
      accepted += 1;
      explicitAcceptedValueCents += acceptedAmount;
    } else if (status === "accepted") {
      review.push(`Quote ${clean(row.id) || "unknown"} is marked accepted without complete timestamp/amount evidence.`);
    }
  }

  return {
    total_quotes: list.length,
    draft_quotes: draft,
    sent_quotes: sent,
    explicitly_accepted_quotes: accepted,
    explicitly_accepted_value_cents: explicitAcceptedValueCents,
    review_reasons: unique(review),
    customer_commitment_inferred: false,
    draft_is_customer_commitment: false,
    sent_is_customer_commitment: false,
    accepted_status_requires_timestamp_and_recorded_amounts: true
  };
}

export function maintenanceCommercialDomains() {
  return [...MAINTENANCE_DOMAINS];
}

export function fleetCommercialDomains() {
  return [...FLEET_DOMAINS];
}

function objectOrEmpty(value) {
  return isPlainObject(value) ? value : {};
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clean(value) {
  return String(value ?? "").trim();
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function finiteNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function finitePositiveWhole(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function finitePercent(value) {
  const number = finiteNonNegative(value);
  return number !== null && number <= 100 ? number : null;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}
