// Build 307 — evidence-scoped readiness normalization for Build 306 observations.
// This layer never turns configuration presence into fabricated provider/database transaction acceptance.
export const SYSTEM_HEALTH_READINESS_STATES_BUILD307 = Object.freeze(["GREEN", "AMBER", "RED"]);

export function buildSystemHealthReadiness(observationReport) {
  const order = Array.isArray(observationReport?.family_order) ? [...observationReport.family_order] : [];
  const observations = observationReport?.families && typeof observationReport.families === "object"
    ? observationReport.families
    : {};
  const diagnostics = {};
  for (const name of order) diagnostics[name] = diagnoseFamily(name, observations[name]);

  const counts = { GREEN: 0, AMBER: 0, RED: 0 };
  for (const diagnostic of Object.values(diagnostics)) {
    if (Object.prototype.hasOwnProperty.call(counts, diagnostic.state)) counts[diagnostic.state] += 1;
  }
  const overall = counts.RED > 0 ? "RED" : counts.AMBER > 0 ? "AMBER" : "GREEN";

  return {
    build: 307,
    contract: "rosie_it_readiness_diagnostics_v1",
    observation_build: observationReport?.build || 306,
    observation_contract: observationReport?.contract || "rosie_it_health_families_v1",
    requested_family: observationReport?.requested_family || null,
    families: observations,
    family_order: order,
    diagnostics,
    summary: {
      overall_state: overall,
      counts,
      configuration_is_not_transaction_acceptance: true
    },
    generated_at: new Date().toISOString(),
    semantics: "evidence_scoped_readiness_configuration_is_not_transaction_acceptance"
  };
}

function diagnoseFamily(name, observation) {
  if (!observation || observation.observed === false || observation.error) {
    return diagnostic({
      family: name,
      state: "RED",
      evidenceClass: "observation_failed",
      transactionAcceptance: "unknown",
      code: `${String(name || "health").toUpperCase()}_OBSERVATION_FAILED`,
      summary: familyFailureSummary(name, observation?.error),
      required: true,
      title: "Restore this diagnostic path before relying on its readiness result.",
      steps: [
        "Refresh only this diagnostic family once.",
        "If it remains red, open the Startup Command Center and verify the named runtime/configuration authority for this family.",
        "Do not treat another family's success as proof that this failed family is healthy."
      ]
    });
  }

  switch (name) {
    case "deployment": return diagnoseDeployment(observation);
    case "api": return diagnoseApi(observation);
    case "d1": return diagnoseDatabase(observation);
    case "storage": return diagnoseStorage(observation);
    case "authentication": return diagnoseAuthentication(observation);
    case "providers": return diagnoseProviders(observation);
    default:
      return diagnostic({
        family: name,
        state: "AMBER",
        evidenceClass: "unclassified_observation",
        transactionAcceptance: "not_tested",
        code: "UNCLASSIFIED_OBSERVATION",
        summary: "An observation was returned, but Build 307 has no readiness rule for this family.",
        required: false,
        title: "Review this observation manually.",
        steps: ["Confirm whether this family is required before using it as a release decision."]
      });
  }
}

function diagnoseDeployment(observation) {
  const identity = !!(clean(observation.commit_sha) || clean(observation.deployment_id));
  return diagnostic({
    family: "deployment",
    state: identity ? "GREEN" : "AMBER",
    evidenceClass: identity ? "runtime_proven" : "runtime_partial",
    transactionAcceptance: "not_applicable",
    code: identity ? "DEPLOYMENT_IDENTITY_OBSERVED" : "DEPLOYMENT_IDENTITY_PARTIAL",
    summary: identity
      ? "This request exposed deployment identity from the running Pages environment."
      : "The dashboard is running, but exact deployment identity metadata was not exposed to this request.",
    required: !identity,
    title: identity ? "No corrective action required for this observation." : "Verify exact deployment identity in the release acceptance lane.",
    steps: identity ? [] : [
      "Use the exact-SHA Cloudflare Development acceptance evidence for the current dev head.",
      "Confirm the deployment has Functions attached and the mutable Development alias has converged."
    ]
  });
}

function diagnoseApi(observation) {
  return diagnostic({
    family: "api",
    state: "GREEN",
    evidenceClass: "runtime_proven",
    transactionAcceptance: "not_applicable",
    code: "API_RUNTIME_PROVEN",
    summary: "Reaching this protected endpoint proves the Pages Functions request path executed for this check.",
    required: false,
    title: "No corrective action required for this observation.",
    steps: []
  });
}

function diagnoseDatabase(observation) {
  if (!observation.configured || observation.mode === "unconfigured") {
    return diagnostic({
      family: "d1",
      state: "RED",
      evidenceClass: "configuration_missing",
      transactionAcceptance: "not_tested",
      code: "DATABASE_CONFIGURATION_MISSING",
      summary: "No supported application database authority was observed for this environment.",
      required: true,
      title: "Restore the environment's database configuration, then rerun this family.",
      steps: [
        "For the current Rosie authority, verify the Supabase URL and server-side service authority are present; use D1 only when an actual DB binding is intentionally configured.",
        "Rerun the database family after configuration is restored.",
        "Keep the result AMBER until a separate read-only/live database acceptance actually proves connectivity."
      ]
    });
  }
  return diagnostic({
    family: "d1",
    state: "AMBER",
    evidenceClass: "configuration_only",
    transactionAcceptance: "not_tested",
    code: "DATABASE_CONFIGURED_NOT_TRANSACTION_TESTED",
    summary: `Database authority is configured as ${clean(observation.mode) || "unknown"}, but this check does not execute a database transaction.`,
    required: false,
    title: "No configuration repair is indicated; transaction acceptance remains separate evidence.",
    steps: ["Use an existing read-only database acceptance when live connectivity evidence is required; do not infer it from configuration presence."]
  });
}

function diagnoseStorage(observation) {
  if (!observation.configured) {
    return diagnostic({
      family: "storage",
      state: "RED",
      evidenceClass: "configuration_missing",
      transactionAcceptance: "not_tested",
      code: "R2_BINDING_MISSING",
      summary: "No supported Rosie public-assets R2 binding was observed in this environment.",
      required: true,
      title: "Restore the expected Cloudflare R2 binding, then rerun this family.",
      steps: [
        "Verify the Development Pages environment has the intended Rosie public-assets R2 binding.",
        "Do not expose bucket credentials or object contents while troubleshooting.",
        "Rerun the storage family after the binding is restored."
      ]
    });
  }
  return diagnostic({
    family: "storage",
    state: "AMBER",
    evidenceClass: "configuration_only",
    transactionAcceptance: "not_tested",
    code: "R2_BOUND_NOT_OBJECT_TESTED",
    summary: "A supported R2 binding is present, but this check does not read, write, list, or delete an object.",
    required: false,
    title: "No binding repair is indicated; object-level acceptance remains separate evidence.",
    steps: ["Use an existing read-only/private-media or public-assets acceptance when object access must be proven."]
  });
}

function diagnoseAuthentication(observation) {
  if (!observation.authenticated) {
    return diagnostic({
      family: "authentication",
      state: "RED",
      evidenceClass: "runtime_failed",
      transactionAcceptance: "not_applicable",
      code: "AUTHENTICATED_ACTOR_MISSING",
      summary: "The protected health route did not receive an authenticated staff actor.",
      required: true,
      title: "Restore staff authentication before using protected I.T. diagnostics.",
      steps: ["Sign in through the normal staff authentication path and confirm the account retains I.T. runtime view authority."]
    });
  }
  return diagnostic({
    family: "authentication",
    state: "GREEN",
    evidenceClass: "runtime_proven",
    transactionAcceptance: "not_applicable",
    code: "AUTH_RUNTIME_PROVEN",
    summary: "This protected request resolved an authenticated staff actor and passed I.T. runtime-view authorization.",
    required: false,
    title: "No corrective action required for this observation.",
    steps: []
  });
}

function diagnoseProviders(observation) {
  const integrations = Array.isArray(observation.integrations) ? observation.integrations : [];
  const configured = integrations.filter((row) => row?.configured === true).length;
  const providerItems = integrations.map((row) => ({
    key: row?.key || null,
    label: row?.label || row?.key || "Integration",
    configured: row?.configured === true,
    state: "AMBER",
    evidence_class: row?.configured === true ? "configuration_only" : "configuration_missing_or_optional",
    transaction_acceptance: "not_tested"
  }));
  return diagnostic({
    family: "providers",
    state: "AMBER",
    evidenceClass: configured > 0 ? "configuration_only" : "configuration_missing_or_optional",
    transactionAcceptance: "not_tested",
    code: configured > 0 ? "PROVIDERS_CONFIGURED_NOT_TRANSACTION_TESTED" : "PROVIDERS_NOT_CONFIGURED_OR_OPTIONAL",
    summary: configured > 0
      ? `${configured} provider integration configuration(s) are present; no provider API call, payment, webhook, message, or publishing transaction was accepted by this check.`
      : "No configured provider integration was observed. This alone does not make the core app unhealthy because provider requirements are feature-specific.",
    required: false,
    title: "Treat provider configuration and real provider acceptance as separate evidence.",
    steps: [
      "For any provider-dependent feature you intend to use, confirm the required configuration first.",
      "Run that provider's deliberate sandbox/test acceptance separately before calling transactions, webhooks, delivery, or publishing proven."
    ],
    providerItems
  });
}

function diagnostic({ family, state, evidenceClass, transactionAcceptance, code, summary, required, title, steps, providerItems = undefined }) {
  return {
    family,
    state,
    evidence_class: evidenceClass,
    transaction_acceptance: transactionAcceptance,
    code,
    summary,
    corrective_action: {
      required: required === true,
      automatic: false,
      title,
      steps: Array.isArray(steps) ? steps : [],
      href: "/admin-startup-guide.html"
    },
    ...(providerItems ? { provider_items: providerItems } : {})
  };
}

function familyFailureSummary(name, error) {
  const label = clean(name).replaceAll("_", " ") || "health";
  const detail = clean(error);
  return detail
    ? `${label} observation failed independently: ${detail}`
    : `${label} observation failed independently and returned no safe detail.`;
}

function clean(value) { return String(value || "").trim(); }
