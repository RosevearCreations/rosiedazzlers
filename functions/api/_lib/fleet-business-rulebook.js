const REQUIRED_DOMAINS = [
  "fleet_minimums",
  "service_tiers",
  "travel_limits",
  "volume_pricing",
  "invoicing",
  "cancellation"
];

const OPERATIONAL_AUTHORITY = Object.freeze({
  fleet_account_activation_allowed: false,
  automatic_discount_application_allowed: false,
  invoice_creation_allowed: false,
  booking_creation_allowed: false,
  recurring_billing_allowed: false,
  provider_mutation_allowed: false,
  database_mutation_allowed: false
});

export function requiredFleetBusinessDomains() {
  return [...REQUIRED_DOMAINS];
}

export function evaluateFleetBusinessRulebook(rulebook = {}) {
  const source = rulebook && typeof rulebook === "object" ? rulebook : {};
  const decisions = source.decisions && typeof source.decisions === "object" ? source.decisions : {};
  const blockers = [];

  if (source.business_approval_required !== true) {
    blockers.push("business_approval_requirement_missing");
  }

  for (const domain of REQUIRED_DOMAINS) {
    const decision = decisions[domain];
    if (!decision || typeof decision !== "object") {
      blockers.push(`${domain}:missing`);
      continue;
    }
    if (decision.approved !== true) {
      blockers.push(`${domain}:not_approved`);
    }
  }

  const rulesReady = blockers.length === 0;
  return {
    ok: true,
    status: rulesReady ? "rules_ready" : "awaiting_business_approval",
    rules_ready: rulesReady,
    required_domains: [...REQUIRED_DOMAINS],
    blockers,
    operational_authority: { ...OPERATIONAL_AUTHORITY },
    next_boundary: "build_373_fleet_account_operations"
  };
}

export function fleetOperationalAuthority() {
  return { ...OPERATIONAL_AUTHORITY };
}
