import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const id = String(body?.id || "").trim();
    if (!isUuid(id)) return withCors(json({ error: "Invalid id." }, 400));
    const channel = String(body?.channel || "manual").trim().toLowerCase();
    if (!["manual", "email", "sms"].includes(channel)) return withCors(json({ error: "Invalid channel." }, 400));

    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: "application/json" };
    const currentRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers });
    if (!currentRes.ok) return withCors(json({ error: await currentRes.text() }, 500));
    const current = (await currentRes.json().catch(() => []))?.[0] || null;
    if (!current) return withCors(json({ error: "Purchase order not found." }, 404));

    const stamp = new Date().toISOString();
    const notePrefix = `Reminder logged via ${channel} by ${access.actor.full_name || access.actor.email || "Staff"} on ${stamp}.`;
    const nextNote = [current.note || null, notePrefix].filter(Boolean).join("\n");

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ reminder_at: stamp, reminder_sent_at: stamp, reminder_last_channel: channel, updated_at: stamp, note: nextNote }),
    });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    const updated = (await res.json().catch(() => []))?.[0] || null;
    await createReminderNotification(env, current, access.actor, channel).catch(() => null);

    return withCors(json({ ok: true, purchase_order: updated, reminded_by: access.actor.full_name || access.actor.email || "Staff" }));
  } catch (err) {
    return withCors(json({ error: String(err) }, 500));
  }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }


async function createReminderNotification(env, purchaseOrder, actor, channel) {
  const supplier = String(purchaseOrder?.supplier_name || purchaseOrder?.vendor_name || 'Supplier').trim();
  const subject = `Purchase order reminder: ${supplier}`;
  const bodyText = `Reminder logged for purchase order ${purchaseOrder?.id || ''} via ${channel} by ${actor?.full_name || actor?.email || 'Staff'}.`;
  await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify([{
      event_type: 'purchase_order_reminder_logged',
      channel: 'internal',
      recipient_email: actor?.email || null,
      subject,
      body_text: bodyText,
      status: 'queued',
      payload: { purchase_order_id: purchaseOrder?.id || null, reminder_channel: channel, actor_id: actor?.id || null }
    }])
  }).catch(() => null);
}
