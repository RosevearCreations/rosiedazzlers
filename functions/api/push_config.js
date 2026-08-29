import { requireStaffAccess, serviceHeaders, json } from "./_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status:204, headers:corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability:null, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const config = await loadPublicPushConfig(env);
    return withCors(json({
      ok:true,
      build:270,
      push_supported:true,
      subscription_enabled:!!config.public_key,
      delivery_ready:!!config.public_key,
      sender:"supabase_edge",
      vapid_public_key:config.public_key || null
    }));
  } catch (error) {
    return withCors(json({ error:error?.message || "Could not load push configuration." },500));
  }
}

export async function onRequestPost() {
  return withCors(json({ error:"Method not allowed." },405));
}

async function loadPublicPushConfig(env) {
  const response = await fetch(`${String(env.SUPABASE_URL || "").replace(/\/$/,"")}/rest/v1/rpc/notification_push_public_config`, {
    method:"POST",
    headers:serviceHeaders(env),
    body:"{}"
  });
  if (!response.ok) throw new Error(`Could not load VAPID public configuration (${response.status}).`);
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data[0] || {} : data || {};
}

function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
