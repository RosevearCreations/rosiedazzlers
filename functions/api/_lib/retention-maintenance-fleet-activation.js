const MAINTENANCE_AVAILABLE_ACTIONS = Object.freeze([
  "review_interest_queue",
  "record_manual_customer_contact",
  "review_vehicle_history_candidates",
  "prepare_customer_booking_conversation"
]);

const FLEET_AVAILABLE_ACTIONS = Object.freeze([
  "review_fleet_assessment",
  "update_lead_status_and_internal_note",
  "prepare_draft_quote_handoff",
  "review_vehicle_roster_and_service_history"
]);

const LOCKED_COMMERCIAL_ACTIONS = Object.freeze([
  "automatic_enrollment",
  "automatic_outreach",
  "automatic_discount_application",
  "fleet_account_activation",
  "invoice_creation",
  "booking_creation",
  "recurring_billing",
  "automatic_renewal",
  "provider_mutation"
]);

export function buildCommercialActivationState(input = {}) {
  const maintenance = normalizeMaintenanceMetrics(input.maintenance_metrics);
  const fleet = normalizeFleetMetrics(input.fleet_metrics);
  const maintenanceStatus = cleanStatus(input.maintenance_rulebook_status);
  const fleetStatus = cleanStatus(input.fleet_rulebook_status);

  return {
    build: 392,
    mode: "operator_assisted_commercial_activation",
    customer_paths: {
      maintenance: "maintenance_interest_waitlist",
      fleet: "fleet_assessment_inquiry"
    },
    maintenance: {
      rulebook_status: maintenanceStatus,
      commercial_terms_ready: maintenanceStatus === "rules_ready",
      available_actions: [...MAINTENANCE_AVAILABLE_ACTIONS],
      next_operator_action: nextMaintenanceAction(maintenance),
      metrics: maintenance,
      locked_actions: [...LOCKED_COMMERCIAL_ACTIONS]
    },
    fleet: {
      rulebook_status: fleetStatus,
      commercial_terms_ready: fleetStatus === "rules_ready",
      available_actions: [...FLEET_AVAILABLE_ACTIONS],
      next_operator_action: nextFleetAction(fleet),
      metrics: fleet,
      locked_actions: [...LOCKED_COMMERCIAL_ACTIONS]
    },
    boundaries: {
      read_only_activation_overview: true,
      existing_booking_flow_remains_authoritative: true,
      existing_quote_flow_remains_authoritative: true,
      automatic_outreach_allowed: false,
      automatic_discount_application_allowed: false,
      recurring_billing_allowed: false,
      provider_mutation_allowed: false,
      commercial_terms_may_be_inferred: false
    }
  };
}

export function maintenanceActivationMetrics(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const count = (status) => list.filter((row) => cleanStatus(row?.status) === status).length;
  return {
    total: list.length,
    new: count("new"),
    contacted: count("contacted"),
    interested: count("interested"),
    closed: count("closed"),
    unsubscribed: count("unsubscribed")
  };
}

export function fleetActivationMetrics(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const count = (status) => list.filter((row) => cleanStatus(row?.status) === status).length;
  return {
    total: list.length,
    new: count("new"),
    reviewing: count("reviewing"),
    contacted: count("contacted"),
    quoted: count("quoted"),
    converted: count("converted"),
    closed: count("closed"),
    vehicles_requested: list.reduce((sum, row) => sum + finiteWhole(row?.vehicle_count), 0)
  };
}

function nextMaintenanceAction(metrics) {
  if (metrics.new > 0) return "review_new_maintenance_interest";
  if (metrics.interested > 0) return "prepare_manual_booking_conversation";
  if (metrics.contacted > 0) return "review_contacted_interest";
  return "monitor_maintenance_interest_queue";
}

function nextFleetAction(metrics) {
  if (metrics.new > 0) return "review_new_fleet_assessment";
  if (metrics.reviewing > 0 || metrics.contacted > 0) return "continue_fleet_assessment";
  if (metrics.quoted > 0) return "monitor_draft_quote_decisions";
  return "monitor_fleet_pipeline";
}

function normalizeMaintenanceMetrics(value) {
  const source = value && typeof value === "object" ? value : {};
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
  const source = value && typeof value === "object" ? value : {};
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

function cleanStatus(value) {
  return String(value || "awaiting_business_approval").trim().toLowerCase().slice(0, 80);
}

function finiteWhole(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
