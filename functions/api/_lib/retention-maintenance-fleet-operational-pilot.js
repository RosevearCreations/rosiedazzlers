const LOCKED_ACTIONS = Object.freeze([
  "automatic_customer_selection",
  "automatic_outreach",
  "automatic_enrollment",
  "automatic_booking",
  "automatic_discount_application",
  "automatic_invoice_creation",
  "automatic_recurring_billing",
  "automatic_renewal",
  "provider_mutation"
]);

export function buildRetentionMaintenanceFleetOperationalPilot(input = {}) {
  const activation = objectOrEmpty(input.commercial_activation);
  const boundaries = objectOrEmpty(activation.boundaries);
  const maintenance = objectOrEmpty(activation.maintenance);
  const fleet = objectOrEmpty(activation.fleet);
  const maintenanceMetrics = normalizeMaintenanceMetrics(maintenance.metrics);
  const fleetMetrics = normalizeFleetMetrics(fleet.metrics);

  const sourceReasons = [];
  if (boundaries.read_only_activation_overview !== true) {
    sourceReasons.push("Commercial activation authority must remain read-only.");
  }
  if (boundaries.existing_booking_flow_remains_authoritative !== true) {
    sourceReasons.push("Existing booking flow must remain authoritative.");
  }
  if (boundaries.existing_quote_flow_remains_authoritative !== true) {
    sourceReasons.push("Existing fleet quote flow must remain authoritative.");
  }
  if (boundaries.automatic_outreach_allowed !== false) {
    sourceReasons.push("Automatic outreach must remain disabled.");
  }
  if (boundaries.automatic_discount_application_allowed !== false) {
    sourceReasons.push("Automatic discount application must remain disabled.");
  }
  if (boundaries.recurring_billing_allowed !== false) {
    sourceReasons.push("Recurring billing must remain disabled.");
  }
  if (boundaries.provider_mutation_allowed !== false) {
    sourceReasons.push("Provider mutation must remain disabled.");
  }
  if (boundaries.commercial_terms_may_be_inferred !== false) {
    sourceReasons.push("Commercial terms must never be inferred.");
  }

  const sourceStatus = sourceReasons.length ? "review" : "ready";
  const maintenanceTermsReady = maintenance.commercial_terms_ready === true;
  const fleetTermsReady = fleet.commercial_terms_ready === true;

  const ownerActions = [];
  if (!maintenanceTermsReady) {
    ownerActions.push("Approve the canonical maintenance-plan commercial rulebook before selecting a maintenance pilot participant.");
  }
  if (!fleetTermsReady) {
    ownerActions.push("Approve the canonical fleet commercial rulebook before selecting a fleet pilot account.");
  }

  let pilotStatus = "ready_for_bounded_operator_pilot";
  if (sourceStatus !== "ready") pilotStatus = "review";
  else if (ownerActions.length) pilotStatus = "owner_action";

  return Object.freeze({
    build: 421,
    mode: "retention_maintenance_fleet_operational_pilot",
    source_acceptance: Object.freeze({
      status: sourceStatus,
      safe_to_promote_source: sourceStatus === "ready",
      reasons: Object.freeze(unique(sourceReasons))
    }),
    pilot_readiness: Object.freeze({
      status: pilotStatus,
      source_release_green_is_not_pilot_approval: true,
      owner_actions: Object.freeze(unique(ownerActions)),
      participant_selection_is_manual: true,
      customer_commitment_inferred: false,
      fleet_commitment_inferred: false
    }),
    maintenance: Object.freeze({
      status: sourceStatus !== "ready"
        ? "review"
        : (maintenanceTermsReady ? "prepared_for_manual_selection" : "owner_action"),
      commercial_terms_ready: maintenanceTermsReady,
      metrics: Object.freeze(maintenanceMetrics),
      suggested_operator_action: maintenance.next_operator_action || "review_maintenance_interest_queue",
      pilot_participant_may_be_inferred: false
    }),
    fleet: Object.freeze({
      status: sourceStatus !== "ready"
        ? "review"
        : (fleetTermsReady ? "prepared_for_manual_selection" : "owner_action"),
      commercial_terms_ready: fleetTermsReady,
      metrics: Object.freeze(fleetMetrics),
      suggested_operator_action: fleet.next_operator_action || "review_fleet_pipeline",
      accepted_quote_may_be_inferred: false
    }),
    capacity: Object.freeze({
      availability_authority: "/api/availability",
      collision_revalidation_authority: "/api/checkout",
      current_date_slot_must_be_revalidated: true,
      live_capacity_may_be_inferred: false,
      reservation_may_be_inferred: false
    }),
    boundaries: Object.freeze({
      read_only_pilot_overview: true,
      schema_authority: false,
      automatic_customer_selection_allowed: false,
      automatic_outreach_allowed: false,
      automatic_enrollment_allowed: false,
      automatic_booking_allowed: false,
      automatic_discount_application_allowed: false,
      automatic_invoice_creation_allowed: false,
      automatic_recurring_billing_allowed: false,
      automatic_renewal_allowed: false,
      provider_mutation_allowed: false,
      pricing_may_be_inferred: false,
      cadence_may_be_inferred: false,
      invoicing_terms_may_be_inferred: false,
      source_release_green_may_coexist_with_pilot_hold: true,
      locked_actions: Object.freeze([...LOCKED_ACTIONS])
    })
  });
}

function normalizeMaintenanceMetrics(value) {
  const source = objectOrEmpty(value);
  return {
    total: finiteWhole(source.total),
    new: finiteWhole(source.new),
    contacted: finiteWhole(source.contacted),
    interested: finiteWhole(source.interested),
    closed: finiteWhole(source.closed),
    unsubscribed: finiteWhole(source.unsubscribed)
  };
}

function normalizeFleetMetrics(value) {
  const source = objectOrEmpty(value);
  return {
    total: finiteWhole(source.total),
    new: finiteWhole(source.new),
    reviewing: finiteWhole(source.reviewing),
    contacted: finiteWhole(source.contacted),
    quoted: finiteWhole(source.quoted),
    converted: finiteWhole(source.converted),
    closed: finiteWhole(source.closed),
    vehicles_requested: finiteWhole(source.vehicles_requested)
  };
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function finiteWhole(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}
