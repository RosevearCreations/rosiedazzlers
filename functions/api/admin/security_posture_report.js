import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }

async function handle({ request, env }) {
  try {
    const body = request.method === 'GET' ? {} : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_settings', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ ok:false, error:'Supabase service configuration is missing.' }, 500));

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/rosie_security_posture_report`, {
      method:'POST', headers:serviceHeaders(env), body:'{}'
    });
    const text = await res.text();
    if (!res.ok) {
      const migration = 'sql/2026-06-23_build214_security_task_orchestration.sql';
      return withCors(json({ ok:false, error:`Security posture report is unavailable. Run ${migration}.`, migration, detail:text.slice(0,500) }, 503));
    }
    const tables = safeJson(text, []);
    const risky = tables.filter(row => row.browser_access_risk === true);
    const rlsDisabled = tables.filter(row => row.rls_enabled !== true);
    const browserGranted = tables.filter(row => row.anon_select || row.anon_write || row.authenticated_select || row.authenticated_write);
    return withCors(json({
      ok:true,
      generated_at:new Date().toISOString(),
      source:'protected database function via service role',
      counts:{ tables:tables.length, risk_rows:risky.length, rls_disabled:rlsDisabled.length, browser_grants:browserGranted.length },
      tables,
      risks:risky.slice(0,100),
      next_steps:risky.length ? [
        'Run the Build 214 migration in Supabase SQL Editor.',
        'Refresh Supabase Security Advisor after the migration succeeds.',
        'Test the app through Cloudflare Functions; do not restore broad browser table grants.'
      ] : [
        'RLS and direct browser table access look locked down for public-schema tables.',
        'Continue to protect the service role key and test staff/customer workflows after each migration.'
      ]
    }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || 'Could not load the security posture report.' }, 500));
  }
}
function safeJson(text, fallback){ try { const value=JSON.parse(text); return Array.isArray(value) ? value : fallback; } catch { return fallback; } }
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store' }; }
function withCors(response){ const headers=new Headers(response.headers || {}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
