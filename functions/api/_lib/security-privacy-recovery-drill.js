export function buildSecurityPrivacyRecoveryDrill(input = {}) {
  const security = objectOrEmpty(input.security);
  const sessions = objectOrEmpty(input.sessions);
  const privacy = objectOrEmpty(input.privacy);
  const recovery = objectOrEmpty(input.recovery);

  const securityState = classifySecurity(security);
  const sessionState = classifySessions(sessions);
  const privacyState = classifyPrivacy(privacy);
  const recoveryState = classifyRecovery(recovery);

  const blocked = [securityState, privacyState].some((item) => item.state === "blocked");
  const ownerAction = [sessionState, recoveryState].some((item) => item.state === "owner_action");
  const unavailable = [securityState, sessionState, privacyState, recoveryState].some((item) => item.state === "unavailable");

  const overall = blocked
    ? "blocked"
    : ownerAction
      ? "owner_action"
      : unavailable
        ? "partial"
        : "ready";

  return Object.freeze({
    build: 424,
    mode: "security_privacy_recovery_drill",
    overall,
    security: Object.freeze(securityState),
    sessions: Object.freeze(sessionState),
    privacy: Object.freeze(privacyState),
    recovery: Object.freeze(recoveryState),
    truth_boundary: Object.freeze({
      secret_values_returned: false,
      customer_records_returned: false,
      consent_inferred: false,
      recovery_source_readiness_is_real_restore_evidence: false,
      source_green_is_secret_rotation_evidence: false,
      source_green_is_production_recovery_evidence: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      manual_refresh_only: true,
      schema_authority: false,
      secret_rotation_allowed: false,
      production_restore_allowed: false,
      destructive_storage_action_allowed: false,
      consent_mutation_allowed: false,
      staff_role_mutation_allowed: false,
      provider_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function classifySecurity(security) {
  if (security.available !== true) {
    return { state: "unavailable", risk_rows: null, rls_disabled: null, browser_grants: null };
  }
  const riskRows = finiteNonNegative(security.risk_rows) ?? 0;
  const rlsDisabled = finiteNonNegative(security.rls_disabled) ?? 0;
  const browserGrants = finiteNonNegative(security.browser_grants) ?? 0;
  const state = riskRows > 0 || rlsDisabled > 0 || browserGrants > 0 ? "blocked" : "ready";
  return { state, risk_rows: riskRows, rls_disabled: rlsDisabled, browser_grants: browserGrants };
}

function classifySessions(sessions) {
  if (sessions.available !== true) {
    return { state: "unavailable", staff_secret_configured: null, customer_secret_configured: null, legacy_admin_fallback_enabled: null };
  }
  const staffSecret = sessions.staff_secret_configured === true;
  const customerSecret = sessions.customer_secret_configured === true;
  const legacyFallback = sessions.legacy_admin_fallback_enabled === true;
  const cookiePolicyVerified = sessions.cookie_policy_verified === true;
  const rotationPolicyVerified = sessions.rotation_policy_verified === true;
  const state = staffSecret && customerSecret && !legacyFallback && cookiePolicyVerified && rotationPolicyVerified
    ? "ready"
    : "owner_action";
  return {
    state,
    staff_secret_configured: staffSecret,
    customer_secret_configured: customerSecret,
    legacy_admin_fallback_enabled: legacyFallback,
    cookie_policy_verified: cookiePolicyVerified,
    rotation_policy_verified: rotationPolicyVerified
  };
}

function classifyPrivacy(privacy) {
  if (privacy.available !== true) {
    return { state: "unavailable", current_explicit_consent_required: null, inferred_consent_allowed: null, definitive_delivery_requires_provider_evidence: null };
  }
  const consent = privacy.current_explicit_consent_required === true;
  const noInference = privacy.inferred_consent_allowed === false;
  const delivery = privacy.definitive_delivery_requires_provider_evidence === true;
  return {
    state: consent && noInference && delivery ? "ready" : "blocked",
    current_explicit_consent_required: consent,
    inferred_consent_allowed: privacy.inferred_consent_allowed === true,
    definitive_delivery_requires_provider_evidence: delivery
  };
}

function classifyRecovery(recovery) {
  if (recovery.source_authority_available !== true) {
    return { state: "unavailable", source_authority_available: false, observed_drill: false, production_mutation_performed: false };
  }
  const observed = recovery.observed_drill === true;
  const productionMutation = recovery.production_mutation_performed === true;
  const explicitAuthorization = recovery.explicit_authorization_required === true;
  const state = productionMutation
    ? "blocked"
    : observed && explicitAuthorization
      ? "ready"
      : "owner_action";
  return {
    state,
    source_authority_available: true,
    observed_drill: observed,
    production_mutation_performed: productionMutation,
    explicit_authorization_required: explicitAuthorization,
    reaccept_exact_production_sha_required: recovery.reaccept_exact_production_sha_required === true
  };
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function finiteNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
