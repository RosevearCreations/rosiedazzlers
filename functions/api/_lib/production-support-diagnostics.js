const ALERT_ORDER = Object.freeze({
  critical: 0,
  warning: 1,
  hold: 2,
  action: 3,
  info: 4
});

export function buildProductionSupportDiagnostics({
  readiness = {},
  diagnostics = {},
  source_errors = [],
  generated_at = null
} = {}) {
  const readinessItems = Array.isArray(readiness?.items) ? readiness.items : [];
  const diagnosticChecks = Array.isArray(diagnostics?.checks) ? diagnostics.checks : [];
  const alerts = [];

  for (const item of readinessItems) {
    const classification = clean(item?.classification);
    const required = item?.required_for_runtime === true;
    const severity = readinessSeverity(classification, required);
    if (!severity) continue;
    alerts.push({
      id: `readiness:${clean(item?.id) || slug(item?.name) || "unknown"}`,
      source: "go_live_readiness",
      severity,
      family: readinessFamily(item),
      state: classification || "unavailable",
      label: clean(item?.name) || clean(item?.id) || "Readiness evidence",
      corrective_action: clean(item?.action) || defaultReadinessAction(classification, required)
    });
  }

  for (const check of diagnosticChecks) {
    const status = clean(check?.status);
    if (status !== "failed" && status !== "degraded") continue;
    alerts.push({
      id: `diagnostic:${slug(check?.name) || "unknown"}`,
      source: "production_diagnostics",
      severity: status === "failed" ? "critical" : "warning",
      family: clean(check?.failure_family) || "runtime",
      state: status,
      label: clean(check?.name) || "Runtime diagnostic",
      corrective_action: clean(check?.remediation) || "Review the bounded diagnostic evidence and correct the dependency before retrying."
    });
  }

  for (const entry of Array.isArray(source_errors) ? source_errors : []) {
    alerts.push({
      id: `source:${clean(entry?.source) || "unknown"}`,
      source: clean(entry?.source) || "support_diagnostics",
      severity: "critical",
      family: "runtime",
      state: "unavailable",
      label: `${clean(entry?.source) || "Diagnostic source"} unavailable`,
      corrective_action: clean(entry?.action) || "Restore the read-only diagnostic source and refresh manually."
    });
  }

  const dedupedAlerts = dedupeAlerts(alerts).sort(compareAlerts);
  const counts = {
    critical: dedupedAlerts.filter((item) => item.severity === "critical").length,
    warning: dedupedAlerts.filter((item) => item.severity === "warning").length,
    hold: dedupedAlerts.filter((item) => item.severity === "hold").length,
    action: dedupedAlerts.filter((item) => item.severity === "action").length,
    info: dedupedAlerts.filter((item) => item.severity === "info").length
  };

  const releaseIdentity = releaseIdentityFrom(readinessItems, diagnosticChecks);
  const overall = counts.critical > 0
    ? "critical"
    : counts.warning > 0
      ? "warning"
      : counts.hold > 0 || counts.action > 0
        ? "hold"
        : "clear";

  const supportPacket = {
    schema: "rosie-production-support-v1",
    generated_at: generated_at || new Date().toISOString(),
    overall,
    release: releaseIdentity,
    readiness: {
      decision: clean(readiness?.decision) || "unavailable",
      counts: safeCountMap(readiness?.counts)
    },
    diagnostics: {
      overall: clean(diagnostics?.overall) || "unavailable",
      duration_ms: finiteNumber(diagnostics?.duration_ms)
    },
    alert_counts: counts,
    alerts: dedupedAlerts.map((item) => ({
      id: item.id,
      source: item.source,
      severity: item.severity,
      family: item.family,
      state: item.state,
      label: item.label,
      corrective_action: item.corrective_action
    })),
    safety: {
      support_safe: true,
      secret_values_included: false,
      customer_records_included: false,
      message_contents_included: false,
      provider_credentials_included: false,
      business_mutation_performed: false,
      provider_mutation_performed: false
    }
  };

  return {
    overall,
    alert_counts: counts,
    alerts: dedupedAlerts,
    release_identity: releaseIdentity,
    support_packet: supportPacket,
    boundaries: {
      read_only: true,
      manual_refresh_only: true,
      permanent_polling: false,
      business_mutation_allowed: false,
      provider_mutation_allowed: false,
      diagnostic_test_transaction_allowed: false,
      support_packet_whitelisted: true
    }
  };
}

export function supportPacketIsSafe(packet = {}) {
  const safety = packet?.safety || {};
  return safety.support_safe === true
    && safety.secret_values_included === false
    && safety.customer_records_included === false
    && safety.message_contents_included === false
    && safety.provider_credentials_included === false
    && safety.business_mutation_performed === false
    && safety.provider_mutation_performed === false;
}

function readinessSeverity(classification, required) {
  if (classification === "unavailable") return required ? "critical" : "warning";
  if (classification === "provider_dependent") return "hold";
  if (classification === "owner_action") return "action";
  return null;
}

function readinessFamily(item) {
  const id = clean(item?.id);
  if (id.includes("runtime") || id.includes("release")) return "deploy";
  if (id.includes("stripe") || id.includes("paypal") || id.includes("communication")) return "provider";
  if (id.includes("backup") || id.includes("responsive") || id.includes("search")) return "operator";
  return "readiness";
}

function defaultReadinessAction(classification, required) {
  if (classification === "provider_dependent") return "Retain the HOLD until independently observed provider evidence exists.";
  if (classification === "owner_action") return "Complete the explicit operator review and record observed evidence.";
  if (classification === "unavailable" && required) return "Restore the required runtime evidence before release acceptance.";
  return "Review the unavailable evidence before relying on this capability.";
}

function releaseIdentityFrom(items, checks) {
  const runtime = items.find((item) => clean(item?.id) === "runtime_identity");
  const runtimeEvidence = objectOrEmpty(runtime?.evidence);
  const buildCheck = checks.find((check) => clean(check?.name).toLowerCase() === "build identity");
  const deployCheck = checks.find((check) => clean(check?.name).toLowerCase() === "pages deployment");
  const buildEvidence = objectOrEmpty(buildCheck?.evidence);
  const deployEvidence = objectOrEmpty(deployCheck?.evidence);

  return {
    commit_sha: safeSha(runtimeEvidence.commit_sha) || safeSha(buildEvidence.commit_sha),
    branch: safeLabel(runtimeEvidence.branch) || safeLabel(deployEvidence.branch),
    host: safeHost(runtimeEvidence.host) || safeHost(deployEvidence.host),
    exact_runtime_identity: Boolean(
      safeSha(runtimeEvidence.commit_sha) || safeSha(buildEvidence.commit_sha)
    )
  };
}

function safeCountMap(value) {
  const source = objectOrEmpty(value);
  const out = {};
  for (const key of ["runtime_proven", "source_ready", "provider_dependent", "owner_action", "unavailable"]) {
    out[key] = Math.max(0, Math.trunc(Number(source[key]) || 0));
  }
  return out;
}

function dedupeAlerts(alerts) {
  const map = new Map();
  for (const alert of alerts) {
    if (!map.has(alert.id)) map.set(alert.id, alert);
  }
  return [...map.values()];
}

function compareAlerts(a, b) {
  const rank = (value) => ALERT_ORDER[value] ?? 99;
  return rank(a.severity) - rank(b.severity) || a.label.localeCompare(b.label);
}

function safeSha(value) {
  const text = clean(value);
  return /^[0-9a-f]{40}$/i.test(text) ? text : null;
}

function safeHost(value) {
  const text = clean(value).toLowerCase();
  return /^[a-z0-9.-]+(?::\d+)?$/.test(text) ? text : null;
}

function safeLabel(value) {
  const text = clean(value);
  return /^[a-zA-Z0-9._/-]{1,100}$/.test(text) ? text : null;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function slug(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function clean(value) {
  return String(value ?? "").trim();
}
