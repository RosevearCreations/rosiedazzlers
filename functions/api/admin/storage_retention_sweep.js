import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestGet(context){ return handle(context, true); }
export async function onRequestPost(context){ return handle(context, false); }
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }

async function handle({ request, env }, forceDryRun) {
  try {
    const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ ok:false, error:"Supabase service configuration is missing." }, 500));
    const now = new Date();
    const dryRun = forceDryRun || body.dry_run !== false;
    const action = String(body.action || "mark_expired_pending_review").trim().toLowerCase();
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=id,booking_id,kind,stage,retention_policy,retention_expires_at,retention_status,thread_status,storage_bucket,storage_path,media_url,created_at&retention_expires_at=lte.${encodeURIComponent(now.toISOString())}&order=retention_expires_at.asc&limit=250`, { headers:serviceHeaders(env) });
    const text = await res.text();
    if (!res.ok) return withCors(json({ ok:false, error:`Could not load retention candidates. ${text}`, migration:"sql/2026-06-18_build211_production_reliability.sql" }, 500));
    const candidates = (safeJson(text) || []).filter((row) => isEligible(row));
    const results = [];
    if (!dryRun && candidates.length) {
      for (const row of candidates) {
        const patch = action === "archive" ? { retention_status:"archived_pending_delete", thread_status:"archived", updated_at:now.toISOString() } : { retention_status:"expired_pending_review", updated_at:now.toISOString() };
        const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_media?id=eq.${encodeURIComponent(row.id)}`, { method:"PATCH", headers:{ ...serviceHeaders(env), Prefer:"return=minimal" }, body:JSON.stringify(patch) });
        const ok = patchRes.ok;
        results.push({ id:row.id, ok, action:patch.retention_status, error: ok ? null : await patchRes.text() });
        await logRetentionAudit(env, { job_media_id:row.id, booking_id:row.booking_id, action:patch.retention_status, dry_run:false, details:{ retention_policy:row.retention_policy, storage_bucket:row.storage_bucket, storage_path:row.storage_path }, staff_user_id:access.actor?.id || null }).catch(() => null);
      }
    }
    return withCors(json({ ok:true, build:211, dry_run:dryRun, action, candidate_count:candidates.length, candidates:candidates.slice(0,50), results, protected_rules:"permanent_proof and legal_hold are never included; this endpoint does not physically delete storage objects." }));
  } catch (err) { return withCors(json({ ok:false, error:err?.message || "Could not run storage retention sweep." }, 500)); }
}
function isEligible(row){ const policy=String(row.retention_policy||"").toLowerCase(); const status=String(row.retention_status||"").toLowerCase(); if(["permanent_proof","legal_hold"].includes(policy)) return false; if(["archived","deleted","legal_hold"].includes(status)) return false; return true; }
async function logRetentionAudit(env, row){ await fetch(`${env.SUPABASE_URL}/rest/v1/storage_retention_audit`, { method:"POST", headers:{ ...serviceHeaders(env), Prefer:"return=minimal" }, body:JSON.stringify([{ ...row, created_at:new Date().toISOString() }]) }); }
function safeJson(text){ try{return JSON.parse(text);}catch{return null;} }
function corsHeaders(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id", "Cache-Control":"no-store" }; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
