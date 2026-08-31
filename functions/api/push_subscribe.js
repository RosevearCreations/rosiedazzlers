import { requireStaffAccess, json } from "./_lib/staff-auth.js";
import { normalizeBrowserPushSubscription, cleanPushMetadata, saveStaffPushSubscription } from "./_lib/push-subscriptions.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:null, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const subscription = normalizeBrowserPushSubscription(body.subscription || body);
    const metadata = cleanPushMetadata(body, request);
    const saved = await saveStaffPushSubscription({ env, actor:access.actor, subscription, metadata });
    return withCors(json({
      ok:true,
      build:270,
      subscription:{ id:saved?.id || null, owner_type:"staff", push_enabled:true, timezone:metadata.timezone }
    }));
  } catch (error) {
    return withCors(json({ error:error?.message || "Could not save push subscription." }, Number(error?.status) || 400));
  }
}

export async function onRequestGet(){return withCors(json({error:"Method not allowed."},405));}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
