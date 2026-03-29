import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const payload = {
      item_key: String(body?.item_key || '').trim(),
      item_type: String(body?.item_type || '').trim().toLowerCase(),
      name: String(body?.name || '').trim(),
      category: String(body?.category || '').trim() || null,
      subcategory: String(body?.subcategory || '').trim() || null,
      image_url: String(body?.image_url || '').trim() || null,
      amazon_url: String(body?.amazon_url || '').trim() || null,
      qty_on_hand: Number(body?.qty_on_hand || 0),
      reorder_point: Number(body?.reorder_point || 0),
      reorder_qty: Number(body?.reorder_qty || 0),
      unit_label: String(body?.unit_label || '').trim() || null,
      rating_value: body?.rating_value == null || body?.rating_value === '' ? null : Number(body.rating_value),
      rating_count: Number(body?.rating_count || 0),
      preferred_vendor: String(body?.preferred_vendor || '').trim() || null,
      reuse_policy: String(body?.reuse_policy || 'reorder').trim() || 'reorder',
      sort_key: body?.sort_key == null || body?.sort_key === '' ? 0 : Number(body.sort_key),
      notes: String(body?.notes || '').trim() || null,
      is_public: body?.is_public !== false,
      is_active: body?.is_active !== false,
      updated_at: new Date().toISOString()
    };
    if (!payload.item_key || !payload.name || !['tool','consumable'].includes(payload.item_type)) return withCors(json({ error: 'Missing required fields.' }, 400));
    if (!['reorder','single_use','never_reuse'].includes(payload.reuse_policy)) return withCors(json({ error: 'Invalid reuse policy.' }, 400));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?on_conflict=item_key`, { method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([payload]) });
    if (!res.ok) return withCors(json({ error: await res.text() }, 500));
    return withCors(json({ ok: true, item: (await res.json().catch(()=>[]))?.[0] || null }));
  } catch (err) { return withCors(json({ error: String(err) }, 500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }

function toNum(v){ if(v===null||v===undefined||v==="") return null; const n=Number(v); return Number.isFinite(n)?n:null; }
