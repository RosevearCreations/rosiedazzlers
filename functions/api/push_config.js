import { requireStaffAccess, json } from "./_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status:204, headers:corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability:null, allowLegacyAdminFallback:false });
  if (!access.ok) return withCors(access.response);
  const publicKey = String(env.VAPID_PUBLIC_KEY || "").trim();
  const privateReady = !!String(env.VAPID_PRIVATE_KEY || "").trim();
  return withCors(json({
    ok:true,
    build:270,
    push_supported:true,
    subscription_enabled:!!publicKey,
    delivery_ready:!!publicKey && privateReady,
    vapid_public_key:publicKey || null
  }));
}

export async function onRequestPost() {
  return withCors(json({ error:"Method not allowed." },405));
}

function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
