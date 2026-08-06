import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { createPayrollRun } from "../_lib/payroll.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return access.response;

    const out = await createPayrollRun(env, {
      start_date: body.start_date,
      end_date: body.end_date,
      staff_user_ids: Array.isArray(body.staff_user_ids) ? body.staff_user_ids : null,
      status: String(body.status || "draft").trim().toLowerCase() === "posted" ? "posted" : "draft",
      note: body.note,
      post_to_accounting: body.post_to_accounting === true,
      actor: access.actor || null
    });

    return json({ ok: true, message: "Payroll run saved.", ...out });
  } catch (err) {
    return json({ error: err?.message || "Could not save payroll run." }, 500);
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
