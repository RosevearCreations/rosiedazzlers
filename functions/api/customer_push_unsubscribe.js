import { getCurrentCustomerSession } from "./_lib/customer-session.js";
import { revokeCustomerPushSubscription } from "./_lib/push-subscriptions.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}

export async function onRequestPost({ request, env }) {
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile) return withCors(json({ error:"Unauthorized." },401));
    const body = await request.json().catch(() => ({}));
    const revoked = await revokeCustomerPushSubscription({ env, customerProfile:current.customer_profile, endpoint:body.endpoint });
    return withCors(json({ ok:true, build:270, revoked }));
  } catch (error) {
    return withCors(json({ error:error?.message || "Could not revoke customer push subscription." },400));
  }
}

export async function onRequestGet(){return withCors(json({error:"Method not allowed."},405));}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
