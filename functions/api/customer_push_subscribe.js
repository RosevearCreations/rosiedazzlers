import { getCurrentCustomerSession } from "./_lib/customer-session.js";
import { normalizeBrowserPushSubscription, cleanPushMetadata, saveCustomerPushSubscription } from "./_lib/push-subscriptions.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}

export async function onRequestPost({ request, env }) {
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile) return withCors(json({ error:"Unauthorized." },401));
    const body = await request.json().catch(() => ({}));
    const subscription = normalizeBrowserPushSubscription(body.subscription || body);
    const metadata = cleanPushMetadata(body, request);
    const saved = await saveCustomerPushSubscription({ env, customerProfile:current.customer_profile, subscription, metadata });
    return withCors(json({
      ok:true,
      build:270,
      subscription:{ id:saved?.id || null, owner_type:"customer", push_enabled:true, timezone:metadata.timezone }
    }));
  } catch (error) {
    return withCors(json({ error:error?.message || "Could not save customer push subscription." }, Number(error?.status) || 400));
  }
}

export async function onRequestGet(){return withCors(json({error:"Method not allowed."},405));}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
