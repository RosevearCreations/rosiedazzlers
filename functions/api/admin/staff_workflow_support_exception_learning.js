// Build 442 — read-only Staff Workflow & Support Exception Learning endpoint.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { onRequestGet as getTodayNeedsAttention } from "./today_needs_attention_report.js";
import { onRequestGet as getSupportExceptions } from "./support_exceptions.js";
import { buildStaffWorkflowSupportExceptionLearning } from "../_lib/staff-workflow-support-exception-learning.js";

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

  const generatedAt = new Date().toISOString();
  const [today, support] = await Promise.all([
    collect("today_needs_attention", () => getTodayNeedsAttention({ request: request.clone(), env })),
    collect("support_exceptions", () => getSupportExceptions({ request: request.clone(), env }))
  ]);

  if ([today, support].some((row) => row.restricted)) {
    return json({
      ok: false,
      error: "One or more retained staff/support evidence sources are not authorized for this staff account.",
      source_status: sourceStatusMap({ today, support })
    }, 403);
  }

  const learning = buildStaffWorkflowSupportExceptionLearning({
    today: today.data || {},
    support: support.data || {},
    source_status: sourceStatusMap({ today, support }),
    generated_at: generatedAt
  });

  return json({
    ok: learning.evidence_status !== "unavailable",
    authority: "staff_workflow_support_exception_learning",
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
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("source_timeout")), SOURCE_TIMEOUT_MS); })
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

function sourceStatusMap({ today, support }) {
  return {
    today_needs_attention: sourceState(today),
    support_exceptions: sourceState(support)
  };
}

function sourceState(row) {
  return {
    available: row?.available === true,
    restricted: row?.restricted === true,
    http_status: Number(row?.status) || null,
    error_class: row?.error_class || null
  };
}

function readOnly() {
  return json({
    ok: false,
    error: "Staff workflow and support exception learning is read-only. Use existing explicit owning workflows for any correction or business action."
  }, 405);
}
