import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { PRODUCTION_TEST_PLAYBOOK_BUILD212 } from "../_lib/production-test-playbook.js";

export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
export async function onRequestOptions(){ return new Response("", {status:204,headers:corsHeaders()}); }

async function handle({ request, env }) {
  try {
    const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const loaded = await loadRuns(env);
    const latestByKey = {};
    for (const row of loaded.rows) {
      const key = String(row.test_key || "").trim();
      if (key && !latestByKey[key]) latestByKey[key] = row;
    }
    const rows = PRODUCTION_TEST_PLAYBOOK_BUILD212.map((test) => ({ ...test, latest_run: latestByKey[test.key] || null }));
    const latest = Object.values(latestByKey);
    const summary = {
      total: PRODUCTION_TEST_PLAYBOOK_BUILD212.length,
      passed: latest.filter((row) => row.status === "passed").length,
      failed: latest.filter((row) => row.status === "failed").length,
      blocked: latest.filter((row) => row.status === "blocked").length,
      not_started: PRODUCTION_TEST_PLAYBOOK_BUILD212.filter((test) => !latestByKey[test.key] || latestByKey[test.key].status === "not_started").length,
      persistence_available: !loaded.warning
    };
    return withCors(json({ ok:true, build:212, tests:rows, summary, warning:loaded.warning || null, generated_at:new Date().toISOString() }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || "Could not load guided production tests." }, 500));
  }
}

async function loadRuns(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return {rows:[],warning:"Supabase service configuration is missing."};
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/production_test_runs?select=id,test_key,test_name,status,notes,evidence_url,environment,performed_by_staff_email,performed_at,created_at&order=performed_at.desc,created_at.desc&limit=500`, {headers:serviceHeaders(env)});
    const text = await response.text();
    if (!response.ok) return {rows:[],warning:`Test history is unavailable. Apply Build 212 migration. ${text.slice(0,180)}`};
    return {rows:JSON.parse(text || "[]"),warning:null};
  } catch (err) {
    return {rows:[],warning:String(err)};
  }
}
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
