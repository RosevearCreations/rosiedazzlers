import assert from "node:assert/strict";
import { buildSecurityPrivacyRecoveryDrill } from "../functions/api/_lib/security-privacy-recovery-drill.js";

const ready = buildSecurityPrivacyRecoveryDrill({
  security: { available: true, risk_rows: 0, rls_disabled: 0, browser_grants: 0 },
  sessions: {
    available: true,
    staff_secret_configured: true,
    customer_secret_configured: true,
    legacy_admin_fallback_enabled: false,
    cookie_policy_verified: true,
    rotation_policy_verified: true
  },
  privacy: {
    available: true,
    current_explicit_consent_required: true,
    inferred_consent_allowed: false,
    definitive_delivery_requires_provider_evidence: true
  },
  recovery: {
    source_authority_available: true,
    observed_drill: true,
    production_mutation_performed: false,
    explicit_authorization_required: true,
    reaccept_exact_production_sha_required: true
  }
});
assert.equal(ready.build, 424);
assert.equal(ready.overall, "ready");
assert.equal(ready.security.state, "ready");
assert.equal(ready.sessions.state, "ready");
assert.equal(ready.privacy.state, "ready");
assert.equal(ready.recovery.state, "ready");
assert.equal(ready.truth_boundary.secret_values_returned, false);
assert.equal(ready.boundaries.production_restore_allowed, false);

const sourceOnlyRecovery = buildSecurityPrivacyRecoveryDrill({
  security: { available: true, risk_rows: 0, rls_disabled: 0, browser_grants: 0 },
  sessions: {
    available: true,
    staff_secret_configured: true,
    customer_secret_configured: true,
    legacy_admin_fallback_enabled: false,
    cookie_policy_verified: true,
    rotation_policy_verified: true
  },
  privacy: {
    available: true,
    current_explicit_consent_required: true,
    inferred_consent_allowed: false,
    definitive_delivery_requires_provider_evidence: true
  },
  recovery: {
    source_authority_available: true,
    observed_drill: false,
    production_mutation_performed: false,
    explicit_authorization_required: true,
    reaccept_exact_production_sha_required: true
  }
});
assert.equal(sourceOnlyRecovery.overall, "owner_action");
assert.equal(sourceOnlyRecovery.recovery.state, "owner_action");
assert.equal(sourceOnlyRecovery.truth_boundary.recovery_source_readiness_is_real_restore_evidence, false);

const risky = buildSecurityPrivacyRecoveryDrill({
  security: { available: true, risk_rows: 2, rls_disabled: 1, browser_grants: 1 },
  sessions: { available: true },
  privacy: {
    available: true,
    current_explicit_consent_required: true,
    inferred_consent_allowed: false,
    definitive_delivery_requires_provider_evidence: true
  },
  recovery: {
    source_authority_available: true,
    observed_drill: false,
    production_mutation_performed: false,
    explicit_authorization_required: true
  }
});
assert.equal(risky.overall, "blocked");
assert.equal(risky.security.state, "blocked");

const privacyFailure = buildSecurityPrivacyRecoveryDrill({
  security: { available: true, risk_rows: 0, rls_disabled: 0, browser_grants: 0 },
  sessions: {
    available: true,
    staff_secret_configured: true,
    customer_secret_configured: true,
    legacy_admin_fallback_enabled: false,
    cookie_policy_verified: true,
    rotation_policy_verified: true
  },
  privacy: {
    available: true,
    current_explicit_consent_required: false,
    inferred_consent_allowed: true,
    definitive_delivery_requires_provider_evidence: false
  },
  recovery: {
    source_authority_available: true,
    observed_drill: false,
    production_mutation_performed: false,
    explicit_authorization_required: true
  }
});
assert.equal(privacyFailure.overall, "blocked");
assert.equal(privacyFailure.privacy.state, "blocked");

console.log("SECURITY / PRIVACY / RECOVERY DRILL TEST: PASS");
console.log(" - security, session and consent boundaries fail closed");
console.log(" - source recovery readiness never becomes fabricated restore evidence");
console.log(" - secret values, customer records and destructive actions remain outside the snapshot");
