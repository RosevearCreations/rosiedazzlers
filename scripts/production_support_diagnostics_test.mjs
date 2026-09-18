import assert from "node:assert/strict";
import {
  buildProductionSupportDiagnostics,
  supportPacketIsSafe
} from "../functions/api/_lib/production-support-diagnostics.js";

const sha = "a".repeat(40);
const readiness = {
  decision: "external_evidence_review_required",
  counts: {
    runtime_proven: 4,
    source_ready: 2,
    provider_dependent: 2,
    owner_action: 1,
    unavailable: 1
  },
  items: [
    {
      id: "runtime_identity",
      name: "Cloudflare runtime identity",
      classification: "runtime_proven",
      required_for_runtime: true,
      evidence: { commit_sha: sha, branch: "main", host: "rosiedazzlers.ca", injected_secret: "DO_NOT_COPY" }
    },
    {
      id: "stripe_provider_outcome",
      name: "Stripe verified provider outcome",
      classification: "provider_dependent",
      required_for_runtime: false,
      action: "Retain Stripe HOLD until controlled provider evidence exists."
    },
    {
      id: "backup_export_proof",
      name: "Backup / export recovery proof",
      classification: "owner_action",
      required_for_runtime: false,
      action: "Observe approved export/backup evidence."
    },
    {
      id: "r2_runtime",
      name: "R2 media runtime",
      classification: "unavailable",
      required_for_runtime: true,
      action: "Restore the approved R2 runtime binding."
    }
  ]
};

const diagnostics = {
  overall: "degraded",
  duration_ms: 123,
  checks: [
    {
      name: "Pages deployment",
      status: "ok",
      failure_family: null,
      evidence: { branch: "main", host: "rosiedazzlers.ca" }
    },
    {
      name: "Build identity",
      status: "ok",
      failure_family: null,
      evidence: { commit_sha: sha }
    },
    {
      name: "Payment configuration",
      status: "degraded",
      failure_family: "configuration",
      remediation: "Review provider configuration presence without exposing secrets.",
      evidence: { secret_value: "DO_NOT_COPY" }
    }
  ]
};

const snapshot = buildProductionSupportDiagnostics({
  readiness,
  diagnostics,
  generated_at: "2026-09-18T13:00:00.000Z"
});

assert.equal(snapshot.overall, "critical");
assert.equal(snapshot.alert_counts.critical, 1);
assert.equal(snapshot.alert_counts.warning, 1);
assert.equal(snapshot.alert_counts.hold, 1);
assert.equal(snapshot.alert_counts.action, 1);
assert.equal(snapshot.release_identity.commit_sha, sha);
assert.equal(snapshot.release_identity.branch, "main");
assert.equal(snapshot.release_identity.host, "rosiedazzlers.ca");
assert.equal(snapshot.boundaries.read_only, true);
assert.equal(snapshot.boundaries.manual_refresh_only, true);
assert.equal(snapshot.boundaries.permanent_polling, false);
assert.equal(snapshot.boundaries.business_mutation_allowed, false);
assert.equal(snapshot.boundaries.provider_mutation_allowed, false);
assert.equal(supportPacketIsSafe(snapshot.support_packet), true);

const packetText = JSON.stringify(snapshot.support_packet);
assert.equal(packetText.includes("DO_NOT_COPY"), false);
assert.equal(packetText.includes('"secret_value":'), false);
assert.equal(packetText.includes('"injected_secret":'), false);

const sourceFailure = buildProductionSupportDiagnostics({
  readiness: {},
  diagnostics: {},
  source_errors: [{ source: "production_diagnostics" }]
});
assert.equal(sourceFailure.alert_counts.critical, 1);
assert.equal(sourceFailure.support_packet.safety.support_safe, true);

console.log("PRODUCTION OBSERVABILITY / ALERTING / SUPPORT DIAGNOSTICS: PASS");
console.log(" - retained readiness and runtime diagnostics converge without a third competing authority");
console.log(" - runtime blockers, warnings, provider HOLDs and owner actions are severity-ranked");
console.log(" - support packet is whitelisted and excludes arbitrary evidence/customer/secret fields");
console.log(" - manual refresh only; no provider/business mutation or permanent polling");
