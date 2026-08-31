import { getCurrentCustomerSession, serviceHeaders } from "./_lib/customer-session.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}

export async function onRequestGet({ request, env }) {
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile) return withCors(json({ error:"Unauthorized." },401));
    const config = await loadPublicPushConfig(env);
    const optedIn = current.customer_profile.notification_opt_in === true;
    return withCors(json({
      ok:true,
      build:270,
      push_supported:true,
      notification_opt_in:optedIn,
      subscription_enabled:optedIn && !!config.public_key,
      delivery_ready:optedIn && !!config.public_key,
      sender:"supabase_edge",
      vapid_public_key:config.public_key || null
    }));
  } catch (error) {
    return withCors(json({ error:error?.message || "Could not load customer push configuration." },500));
  }
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

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
