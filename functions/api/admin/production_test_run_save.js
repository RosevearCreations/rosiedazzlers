import { requireStaffAccess, serviceHeaders, json, cleanText, isUuid } from "../_lib/staff-auth.js";
import { PRODUCTION_TEST_PLAYBOOK_BUILD212, PRODUCTION_TEST_KEYS_BUILD212 } from "../_lib/production-test-playbook.js";

const STATUSES = new Set(["passed","failed","blocked","not_started"]);
export async function onRequestOptions(){ return new Response("", {status:204,headers:corsHeaders()}); }
export async function onRequestPost({request,env}){
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({request,env,body,capability:"manage_bookings",allowLegacyAdminFallback:true});
    if (!access.ok) return withCors(access.response);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ok:false,error:"Supabase service configuration is missing."},500));
    const testKey = cleanText(body.test_key).toLowerCase();
    const status = cleanText(body.status).toLowerCase();
    if (!PRODUCTION_TEST_KEYS_BUILD212.has(testKey)) return withCors(json({ok:false,error:"Unknown production test."},400));
    if (!STATUSES.has(status)) return withCors(json({ok:false,error:"Choose passed, failed, blocked, or not started."},400));
    const test = PRODUCTION_TEST_PLAYBOOK_BUILD212.find((item) => item.key === testKey);
    const notes = limit(cleanText(body.notes), 5000);
    const evidenceUrl = cleanUrl(body.evidence_url);
    if (body.evidence_url && !evidenceUrl) return withCors(json({ok:false,error:"Evidence link must begin with http:// or https://."},400));
    const now = new Date().toISOString();
    const row = {
      test_key:testKey,
      test_name:test?.name || testKey,
      status,
      notes:notes || null,
      evidence_url:evidenceUrl || null,
      environment:limit(cleanText(body.environment) || "unknown", 80),
      build_number:212,
      performed_by_staff_user_id:isUuid(access.actor?.id) ? access.actor.id : null,
      performed_by_staff_email:limit(cleanText(access.actor?.email), 320) || null,
      performed_at:now,
      created_at:now,
      payload:{source:"admin-test-centre",test_key:testKey,status,actor_role:access.actor?.role_code || null}
    };
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/production_test_runs`, {method:"POST",headers:{...serviceHeaders(env),Prefer:"return=representation"},body:JSON.stringify([row])});
    const text = await response.text();
    if (!response.ok) return withCors(json({ok:false,error:`Could not save test result. Apply Build 212 migration. ${text.slice(0,200)}`},409));
    const saved = safeJson(text)?.[0] || row;
    return withCors(json({ok:true,run:saved,persisted:true}));
  } catch (err) {
    return withCors(json({ok:false,error:err?.message || "Could not save production test result."},500));
  }
}
function cleanUrl(value){ const raw=String(value||"").trim(); if(!raw) return ""; try{ const url=new URL(raw); return ["http:","https:"].includes(url.protocol) ? url.toString() : ""; }catch{return "";} }
function limit(value,max){ return String(value||"").slice(0,max); }
function safeJson(value){ try{return JSON.parse(value);}catch{return null;} }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
