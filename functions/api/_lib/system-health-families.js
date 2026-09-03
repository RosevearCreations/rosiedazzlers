// Build 306 — extraction-only I.T. System Health family observations.
// These helpers report bounded observations. Build 307 owns readiness colour/diagnosis/remediation semantics.
import { buildIntegrationStatus } from "./integration-registry.js";

export const SYSTEM_HEALTH_FAMILIES_BUILD306 = Object.freeze([
  "deployment",
  "api",
  "d1",
  "storage",
  "authentication",
  "providers"
]);

export function normalizeHealthFamily(value) {
  const family = String(value || "").trim().toLowerCase();
  return SYSTEM_HEALTH_FAMILIES_BUILD306.includes(family) ? family : null;
}

export async function observeSystemHealthFamilies({ request, env, actor, family = null }) {
  const requested = normalizeHealthFamily(family);
  const names = requested ? [requested] : [...SYSTEM_HEALTH_FAMILIES_BUILD306];
  const settled = await Promise.allSettled(names.map((name) => observeOne(name, { request, env, actor })));
  const observations = {};
  settled.forEach((result, index) => {
    const name = names[index];
    observations[name] = result.status === "fulfilled"
      ? result.value
      : { family: name, observed: false, error: safeMessage(result.reason) };
  });
  return {
    build: 306,
    contract: "rosie_it_health_families_v1",
    requested_family: requested,
    families: observations,
    family_order: names,
    generated_at: new Date().toISOString(),
    semantics: "observation_only_build307_owns_readiness_diagnosis"
  };
}

async function observeOne(name, context) {
  switch (name) {
    case "deployment": return observeDeployment(context);
    case "api": return observeApi(context);
    case "d1": return observeDatabase(context);
    case "storage": return observeStorage(context);
    case "authentication": return observeAuthentication(context);
    case "providers": return observeProviders(context);
    default: throw new Error("Unsupported system health family.");
  }
}

function observeDeployment({ request, env }) {
  const url = new URL(request.url);
  return {
    family: "deployment",
    label: "Deployment",
    observed: true,
    host: url.host,
    environment: env?.CF_PAGES_BRANCH || (url.hostname.includes("dev.") ? "development" : "unknown"),
    commit_sha: clean(env?.CF_PAGES_COMMIT_SHA) || null,
    deployment_id: clean(env?.CF_PAGES_DEPLOYMENT_ID) || null,
    note: "Deployment identity is reported independently from application runtime checks."
  };
}

function observeApi({ request }) {
  return {
    family: "api",
    label: "API runtime",
    observed: true,
    method: String(request.method || "GET").toUpperCase(),
    route: new URL(request.url).pathname,
    timestamp: new Date().toISOString(),
    note: "Reaching this protected endpoint proves the Pages Functions request path executed."
  };
}

function observeDatabase({ env }) {
  const hasD1 = !!env?.DB;
  const hasSupabase = !!(clean(env?.SUPABASE_URL) && clean(env?.SUPABASE_SERVICE_ROLE_KEY));
  const mode = hasD1 ? "d1" : hasSupabase ? "supabase" : "unconfigured";
  return {
    family: "d1",
    label: "Database / data plane",
    observed: true,
    configured: hasD1 || hasSupabase,
    mode,
    d1_binding_present: hasD1,
    supabase_service_present: hasSupabase,
    note: mode === "supabase"
      ? "Rosie currently uses Supabase as its configured application database; the d1 family key is retained for Build 306 release compatibility."
      : "Only configuration presence is observed here; no schema or business data is mutated."
  };
}

function observeStorage({ env }) {
  const aliases = ["ROSIE_PUBLIC_ASSETS_BUCKET", "PUBLIC_ASSETS_BUCKET", "R2_PUBLIC_ASSETS_BUCKET", "ASSETS_BUCKET"];
  const configuredAliases = aliases.filter((key) => env?.[key] != null);
  return {
    family: "storage",
    label: "Object storage",
    observed: true,
    configured: configuredAliases.length > 0,
    binding_kind: configuredAliases.length ? "cloudflare_r2" : "none_observed",
    configured_binding_names: configuredAliases,
    note: "Binding names are safe metadata; bucket contents and credentials are never returned."
  };
}

function observeAuthentication({ actor }) {
  return {
    family: "authentication",
    label: "Authentication",
    observed: true,
    authenticated: !!actor,
    role_code: clean(actor?.role_code) || null,
    admin_authority: !!(actor?.is_admin || actor?.is_legacy_admin || clean(actor?.role_code).toLowerCase() === "admin"),
    note: "Identity secrets, session tokens and email addresses are not included in this observation."
  };
}

function observeProviders({ env }) {
  const integrations = buildIntegrationStatus(env);
  const rows = collectIntegrationRows(integrations);
  return {
    family: "providers",
    label: "Provider readiness inputs",
    observed: true,
    integration_count: rows.length,
    configured_count: rows.filter((row) => row?.configured === true).length,
    integrations: rows.map((row) => ({
      key: row?.key || null,
      label: row?.label || row?.key || "Integration",
      category: row?.category || null,
      configured: row?.configured === true,
      lifecycle: row?.lifecycle || null
    })),
    note: "Configuration presence only; no provider API call or transaction is made."
  };
}

function collectIntegrationRows(value, output = [], seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return output;
  seen.add(value);
  if (!Array.isArray(value) && typeof value.key === "string" && Object.prototype.hasOwnProperty.call(value, "configured")) output.push(value);
  if (Array.isArray(value)) for (const item of value) collectIntegrationRows(item, output, seen);
  else for (const item of Object.values(value)) collectIntegrationRows(item, output, seen);
  return output.filter((row, index, all) => all.findIndex((candidate) => candidate.key === row.key) === index);
}

function clean(value) { return String(value || "").trim(); }
function safeMessage(error) { return String(error?.message || error || "Observation failed.").slice(0, 240); }
