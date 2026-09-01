// Build 283 — return only internally pairing-eligible final media to Gallery Approvals.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { signedStorageUrl } from "../_lib/job-live-feed.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet(context) { return handle(context); }
export async function onRequestPost(context) { return handle(context); }

async function handle({ request, env }) {
  try {
    const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_progress", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gallery_media_candidates?select=*&order=created_at.desc&limit=200`, { headers: serviceHeaders(env) });
    if (!res.ok) {
      const text = await res.text();
      return withCors(json({
        ok: true,
        candidates: [],
        blocked_count: 0,
        warning: text.includes("gallery_media_candidates") ? "Run the Build 210 migration to enable the final-photo candidate queue." : text,
      }, 200));
    }

    const rows = await res.json().catch(() => []);
    const eligibleRows = [];
    let blockedCount = 0;

    for (const row of Array.isArray(rows) ? rows : []) {
      const eligibility = pairingEligibility(row);
      if (!eligibility.eligible) {
        blockedCount++;
        continue;
      }

      let media_url = row.media_url || null;
      if (row.storage_bucket && row.storage_path) {
        media_url = await signedStorageUrl({ env, bucket: row.storage_bucket, path: row.storage_path }) || media_url;
      }
      if (!media_url) {
        blockedCount++;
        continue;
      }

      eligibleRows.push({
        ...row,
        media_url,
        pairing_eligible: true,
        pairing_blockers: [],
      });
    }

    return withCors(json({
      ok: true,
      candidates: eligibleRows,
      blocked_count: blockedCount,
      eligibility_rule: "Candidate picker shows only final-media queue rows with a usable media locator that are not rejected, private, hidden, deleted, or withdrawn. Public-use consent is still reviewed separately on the paired Gallery row.",
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not load Gallery candidates." }, 500));
  }
}

function pairingEligibility(row) {
  const blockers = [];
  const status = norm(row?.status);
  const consent = norm(row?.consent_status);
  const stage = norm(row?.stage);
  const hasMedia = Boolean(String(row?.media_url || row?.storage_path || "").trim());

  if (stage && stage !== "final") blockers.push("candidate is not final-stage media");
  if (["rejected", "private", "hidden", "deleted", "withdrawn"].includes(status)) blockers.push(`candidate status ${status} blocks pairing`);
  if (["rejected", "private", "approved_private", "hidden"].includes(consent)) blockers.push(`candidate consent status ${consent} blocks pairing`);
  if (!hasMedia) blockers.push("candidate has no media locator");

  return { eligible: blockers.length === 0, blockers };
}
function norm(value) { return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_"); }

export const onRequestDelete = methodNotAllowed;
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-email,x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const h = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) h.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h }); }
