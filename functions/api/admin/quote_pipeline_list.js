import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

const SELECT = "id,lead_id,customer_id,booking_id,quote_number,customer_name,town,service_label,status,source_channel,quoted_amount_cents,accepted_amount_cents,probability,follow_up_stage,next_follow_up_at,sent_at,accepted_at,declined_at,created_at,updated_at";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, body: {}, capability: "manage_bookings", allowLegacyAdminFallback: true });
  if (!access.ok) return access.response;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_pipeline_items?select=${encodeURIComponent(SELECT)}&order=${encodeURIComponent("updated_at.desc,created_at.desc")}&limit=250`, { headers: serviceHeaders(env) });
    const text = await res.text();
    if (!res.ok) return json({ ok:false, error:"Could not load quote pipeline.", details:text.slice(0,500), migration_hint:"Apply the Build 206 value-added operations migration if quote_pipeline_items does not exist." }, 500);
    const rows = safeJson(text, []);
    return json({ ok:true, rows:Array.isArray(rows)?rows:[], actor:{ id:access.actor?.id||null, name:access.actor?.full_name||access.actor?.email||"Staff" } });
  } catch (err) { return json({ ok:false, error:err?.message||"Could not load quote pipeline." }, 500); }
}
export async function onRequestPost(context){ return onRequestGet(context); }
export async function onRequestOptions(){ return new Response("",{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}}); }
function safeJson(text,fallback){try{return JSON.parse(text)}catch{return fallback}}
