// functions/api/auth/bootstrap-admin.js
//
// Legacy compatibility alias for older bootstrap callers.
//
// What this file does:
// - keeps older /api/auth/bootstrap-admin callers from failing with 405
// - forwards POST requests to the newer admin bootstrap handler
// - returns JSON for all supported methods so older callers do not crash on response.json()
//
// Notes:
// - current preferred endpoint is /api/admin/auth_bootstrap_admin_password
// - this file is a transition shim for stale browser code, cached scripts, or older tooling

import {
  onRequestPost as forwardPost,
  onRequestOptions as forwardOptions
} from "../admin/auth_bootstrap_admin_password.js";

export async function onRequestOptions(context) {
  return forwardOptions(context);
}

export async function onRequestPost(context) {
  return forwardPost(context);
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify(
      {
        ok: true,
        deprecated: true,
        message: "Use POST /api/admin/auth_bootstrap_admin_password instead of /api/auth/bootstrap-admin."
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    }
  );
}
