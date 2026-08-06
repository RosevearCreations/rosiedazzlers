// Build 154 stale-route compatibility shim.
// Active implementation: functions/api/admin/payroll_run_save.js.
// This root file overwrites older flat routes left behind by GitHub web uploads.

import * as adminRoute from "./admin/payroll_run_save.js";

function methodNotAvailable() {
  return new Response(JSON.stringify({ ok: false, error: "Route method is not available here. Use the admin route." }), {
    status: 405,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export const onRequestOptions = adminRoute.onRequestOptions || methodNotAvailable;
export const onRequestGet = adminRoute.onRequestGet || methodNotAvailable;
export const onRequestPost = adminRoute.onRequestPost || methodNotAvailable;
export const onRequestPut = adminRoute.onRequestPut || methodNotAvailable;
export const onRequestDelete = adminRoute.onRequestDelete || methodNotAvailable;
