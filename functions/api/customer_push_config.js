import { getCurrentCustomerSession } from "./_lib/customer-session.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}

export async function onRequestGet({ request, env }) {
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile) return withCors(json({ error:"Unauthorized." },401));
    const publicKey = String(env.VAPID_PUBLIC_KEY || "").trim();
    const privateReady = !!String(env.VAPID_PRIVATE_KEY || "").trim();
    return withCors(json({
      ok:true,
      build:270,
      push_supported:true,
      notification_opt_in:current.customer_profile.notification_opt_in === true,
      subscription_enabled:current.customer_profile.notification_opt_in === true && !!publicKey,
      delivery_ready:current.customer_profile.notification_opt_in === true && !!publicKey && privateReady,
      vapid_public_key:publicKey || null
    }));
  } catch (error) {
    return withCors(json({ error:error?.message || "Could not load customer push configuration." },500));
  }
}

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
