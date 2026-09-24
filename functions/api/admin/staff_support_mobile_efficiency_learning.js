// Build 493 — read-only Staff & Mobile Remediation Outcome Evidence over the retained learning endpoint.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { onRequestGet as getTodayNeedsAttention } from "./today_needs_attention_report.js";
import { onRequestGet as getSupportExceptions } from "./support_exceptions.js";
import { onRequestGet as getDetailerJobs } from "../detailer/jobs.js";
import { buildStaffSupportMobileEfficiencyLearning } from "../_lib/staff-support-mobile-efficiency-learning.js";

const SOURCE_TIMEOUT_MS = 9000;

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    body: {},
    capability: "manage_bookings",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  const itAccess = requireActionAccess(access.actor, "it.runtime.view");
  if (!itAccess.ok) return itAccess.response;

  const workspaceRequest = withQuery(request, "scope", "workspace");
  const [today, support, detailer] = await Promise.all([
    collect("today_needs_attention", () => getTodayNeedsAttention({ request: request.clone(), env })),
    collect("support_exceptions", () => getSupportExceptions({ request: request.clone(), env })),
    collect("detailer_workspace", () => getDetailerJobs({ request: workspaceRequest, env }))
  ]);

  if ([today, support, detailer].some((row) => row.restricted)) {
    return json({
      ok: false,
      error: "Staff Workflow, Support & Mobile Efficiency Learning requires the retained staff, support and Detailer workspace authorities.",
      source_status: sourceStatusMap({ today, support, detailer })
    }, 403);
  }

  const learning = buildStaffSupportMobileEfficiencyLearning({
    today: today.data || {},
    support: support.data || {},
    detailer: detailer.data || {},
    source_status: sourceStatusMap({ today, support, detailer }),
    remediation_outcome_evidence: [],
    remediation_outcome_source_available: false,
    generated_at: new Date().toISOString()
  });

  return json({
    ok: learning.evidence_status !== "unavailable",
    ...learning
  });
}

export async function onRequestPost() { return readOnly(); }
export async function onRequestPut() { return readOnly(); }
export async function onRequestPatch() { return readOnly(); }
export async function onRequestDelete() { return readOnly(); }
export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    }
  });
}

async function collect(name, runner) {
  let timer;
  try {
    const response = await Promise.race([
      Promise.resolve().then(runner),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("source_timeout")), SOURCE_TIMEOUT_MS);
      })
    ]);
    const data = await response.json().catch(() => null);
    return {
      name,
      available: response.ok && Boolean(data),
      restricted: response.status === 401 || response.status === 403,
      status: response.status,
      data,
      error_class: null
    };
  } catch (error) {
    return {
      name,
      available: false,
      restricted: false,
      status: 503,
      data: null,
      error_class: error?.message === "source_timeout" ? "timeout" : (error?.name || "Error")
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function sourceStatusMap({ today, support, detailer }) {
  return {
    today_needs_attention: state(today),
    support_exceptions: state(support),
    detailer_workspace: state(detailer)
  };
}
function state(row) {
  return {
    available: row?.available === true,
    restricted: row?.restricted === true,
    http_status: Number(row?.status) || null,
    error_class: row?.error_class || null
  };
}
function withQuery(request, key, value) {
  const url = new URL(request.url);
  url.searchParams.set(key, value);
  return new Request(url.toString(), request);
}
function readOnly() {
  return json({
    ok: false,
    error: "Staff Workflow, Support & Mobile Efficiency Learning is read-only. Use the existing owning workflow for explicit business action."
  }, 405);
}
