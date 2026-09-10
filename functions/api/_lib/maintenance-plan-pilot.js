const REQUIRED_DECISION_DOMAINS = Object.freeze([
  "eligibility",
  "cadence",
  "price",
  "inclusions",
  "exclusions",
  "cancellation",
  "priority"
]);

export function evaluateMaintenancePlanPilot(input = {}) {
  const rulebook = objectOrEmpty(input.rulebook);
  const activation = objectOrEmpty(rulebook.activation);
  const decisions = objectOrEmpty(rulebook.decisions);
  const customer = objectOrEmpty(input.customer);
  const vehicle = objectOrEmpty(input.vehicle);
  const activationRequested = input.activation_requested === true;

  const customerId = cleanIdentity(customer.id ?? customer.customer_id);
  const vehicleId = cleanIdentity(vehicle.id ?? vehicle.vehicle_id);
  const vehicleCustomerId = cleanIdentity(vehicle.customer_id ?? vehicle.client_id);
  const vehicleBelongsToCustomer = Boolean(
    customerId && vehicleId && (!vehicleCustomerId || vehicleCustomerId === customerId)
  );

  const unapprovedDomains = REQUIRED_DECISION_DOMAINS.filter(
    (domain) => objectOrEmpty(decisions[domain]).approved !== true
  );

  const pending = [];
  if (rulebook.business_approval_required !== true) {
    pending.push("Canonical rulebook approval authority is missing.");
  }
  for (const domain of unapprovedDomains) {
    pending.push(`Business approval required: ${humanize(domain)}.`);
  }
  if (!customerId) pending.push("Canonical customer identity is required.");
  if (!vehicleId) pending.push("Canonical vehicle identity is required.");
  if (customerId && vehicleId && !vehicleBelongsToCustomer) {
    pending.push("Vehicle must belong to the canonical customer before pilot activation.");
  }
  if (!activationRequested) {
    pending.push("Explicit staff activation intent is required; automatic enrolment is not allowed.");
  }
  if (activation.pilot_enrollment_allowed !== true) {
    pending.push("Pilot enrolment remains disabled by the canonical rulebook.");
  }
  if (activation.plan_enabled !== true) {
    pending.push("The maintenance plan remains disabled by the canonical rulebook.");
  }

  const readyForPilotActivation = Boolean(
    rulebook.business_approval_required === true &&
    unapprovedDomains.length === 0 &&
    customerId &&
    vehicleId &&
    vehicleBelongsToCustomer &&
    activationRequested &&
    activation.pilot_enrollment_allowed === true &&
    activation.plan_enabled === true
  );

  return {
    build: 371,
    mode: readyForPilotActivation ? "approved_for_pilot_activation" : "prepared_fail_closed",
    can_activate: readyForPilotActivation,
    vehicle_specific: true,
    customer_id: customerId,
    vehicle_id: vehicleId,
    activation_requested: activationRequested,
    vehicle_belongs_to_customer: vehicleBelongsToCustomer,
    unapproved_domains: unapprovedDomains,
    pending,
    automatic_enrollment_allowed: false,
    recurring_billing_allowed: false,
    automatic_renewal_allowed: false,
    guaranteed_priority_allowed: false,
    mutation_authority: false,
    provider_mutation_authority: false
  };
}

export function maintenancePlanPilotRequiredDomains() {
  return [...REQUIRED_DECISION_DOMAINS];
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanIdentity(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function humanize(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
