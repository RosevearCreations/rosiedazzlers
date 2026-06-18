import { schemaLooksLegacy } from "../_lib/job-live-feed.js";
import { queueStaffLiveAlert } from "../_lib/live-interaction-alerts.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = clean(body.token);
    const updateId = clean(body.update_id);
    const decision = clean(body.decision).toLowerCase();
    const note = clean(body.note).slice(0, 1000);
    if (!token || !updateId) return json({ ok:false, error:"token and update_id are required." }, 400);
    if (!["approved","declined","needs_discussion"].includes(decision)) return json({ ok:false, error:"Invalid decision." }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok:false, error:"Server configuration is incomplete." }, 500);

    const headers = serviceHeaders(env);
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_name,customer_email,customer_profile_id,progress_enabled,progress_token&progress_token=eq.${encodeURIComponent(token)}&limit=1`, { headers });
    if (!bookingRes.ok) return json({ ok:false, error:`Could not resolve booking. ${await bookingRes.text()}` }, 500);
    const booking = (await bookingRes.json().catch(() => []))?.[0] || null;
    if (!booking) return json({ ok:false, error:"Progress record not found." }, 404);
    if (booking.progress_enabled === false) return json({ ok:false, error:"Progress viewing is not enabled." }, 403);

    const updateRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_updates?select=id,booking_id,stage,visibility,review_status,customer_action_required,recommendation_title,recommendation_amount_cents,recommendation_status,linked_payment_request_id,note&id=eq.${encodeURIComponent(updateId)}&booking_id=eq.${encodeURIComponent(booking.id)}&limit=1`, { headers });
    if (!updateRes.ok) {
      const text = await updateRes.text();
      if (schemaLooksLegacy(text)) return json({ ok:false, error:"Recommendation decisions require the Build 210 migration.", migration:"sql/2026-06-17_build210_connected_live_workflow.sql" }, 501);
      return json({ ok:false, error:`Could not load recommendation. ${text}` }, 500);
    }
    const update = (await updateRes.json().catch(() => []))?.[0] || null;
    if (!update || update.stage !== "recommendation" || update.visibility !== "customer") return json({ ok:false, error:"Customer-visible recommendation not found." }, 404);

    const now = new Date().toISOString();
    let paymentRequest = null;
    if (decision === "approved" && Number(update.recommendation_amount_cents || 0) > 0 && !update.linked_payment_request_id) {
      const requestRow = {
        booking_id: booking.id,
        customer_name: booking.customer_name || null,
        customer_email: booking.customer_email || null,
        status: "draft",
        amount_cents: Math.round(Number(update.recommendation_amount_cents || 0)),
        currency: "CAD",
        notes: `Approved in-job recommendation: ${update.recommendation_title || update.note || "additional service"}`.slice(0, 500),
        created_at: now,
        updated_at: now
      };
      const paymentRes = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests`, { method:"POST", headers:{ ...headers, Prefer:"return=representation" }, body:JSON.stringify([requestRow]) });
      if (paymentRes.ok) paymentRequest = (await paymentRes.json().catch(() => []))?.[0] || null;
    }

    const patch = {
      customer_decision: decision,
      customer_decision_at: now,
      customer_decision_note: note || null,
      recommendation_status: decision === "approved" ? "customer_approved" : decision === "declined" ? "customer_declined" : "discussion_requested",
      customer_action_required: decision === "needs_discussion",
      linked_payment_request_id: paymentRequest?.id || update.linked_payment_request_id || null
    };
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_updates?id=eq.${encodeURIComponent(updateId)}`, { method:"PATCH", headers:{ ...headers, Prefer:"return=representation" }, body:JSON.stringify(patch) });
    if (!patchRes.ok) return json({ ok:false, error:`Could not save decision. ${await patchRes.text()}` }, 500);
    const saved = (await patchRes.json().catch(() => []))?.[0] || null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method:"POST", headers, body:JSON.stringify([{
      booking_id: booking.id,
      event_type: "customer_recommendation_decision",
      actor_name: booking.customer_name || "Customer",
      event_note: `Customer ${decision.replace("_", " ")} recommendation: ${update.recommendation_title || update.note || "additional service"}`.slice(0, 250),
      payload:{ update_id:updateId, decision, payment_request_id:paymentRequest?.id || null, amount_cents:Number(update.recommendation_amount_cents || 0) }
    }]) }).catch(() => null);

    await queueStaffLiveAlert({ env, bookingId:booking.id, eventType:"customer_recommendation_decision", message:`Customer ${decision.replace("_", " ")} an in-job recommendation.`, payload:{ update_id:updateId, decision, payment_request_id:paymentRequest?.id || null } }).catch(() => null);

    return json({ ok:true, decision, update:saved, payment_request:paymentRequest, payment_request_created:!!paymentRequest });
  } catch (err) {
    return json({ ok:false, error:err?.message || "Could not save recommendation decision." }, 500);
  }
}
export async function onRequestOptions(){ return new Response("", { status:204, headers:{ "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type", "Cache-Control":"no-store" } }); }
function clean(v){ return String(v == null ? "" : v).trim(); }
function serviceHeaders(env){ return { apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type":"application/json" }; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}}); }
