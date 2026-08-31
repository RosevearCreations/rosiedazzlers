import { requireStaffAccess, serviceHeaders, json } from "./_lib/staff-auth.js";
import { requireActionAccess } from "./_lib/action-permissions.js";
import { hasActivePushSubscription } from "./_lib/notification-hooks.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:null, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const action = requireActionAccess(access.actor, "it.notifications.process");
    if (!action.ok) return withCors(action.response);
    if (!access.actor?.id) return withCors(json({ error:"A real signed-in staff account is required for a remote push test." },400));

    const active = await hasActivePushSubscription({ env, owner_type:"staff", owner_id:access.actor.id });
    if (!active) return withCors(json({ error:"This staff account has no active push subscription. Click Enable device notifications on this device first." },409));

    const now = new Date().toISOString();
    const record = {
      event_type:"it_remote_push_test",
      channel:"push",
      recipient_staff_user_id:access.actor.id,
      subject:"Rosie Dazzlers remote push test",
      body_text:"Remote Rosie notifications are working for this staff account.",
      payload:{
        title:"Rosie Dazzlers remote push test",
        message:"Remote Rosie notifications are working for this staff account.",
        url:"/app/it/",
        source:"build270_it_remote_test"
      },
      status:"queued",
      attempt_count:0,
      next_attempt_at:now,
      max_attempts:3
    };
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`,{
      method:"POST",
      headers:{...serviceHeaders(env),Prefer:"return=representation"},
      body:JSON.stringify([record])
    });
    if (!response.ok) return withCors(json({ error:`Could not queue remote push test. ${await response.text()}` },500));
    const rows = await response.json().catch(() => []);
    const event = Array.isArray(rows) ? rows[0] || null : null;
    return withCors(json({ ok:true, build:270, event_id:event?.id || null, status:event?.status || "queued" }));
  } catch(error){
    return withCors(json({ error:error?.message || "Could not queue remote push test." },500));
  }
}

export async function onRequestGet(){return withCors(json({ error:"Method not allowed." },405));}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
