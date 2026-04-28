import { getCurrentCustomerSession, serviceHeaders } from "../_lib/customer-session.js";
import { scoreVehicleMedia, normalizeOrientation } from "../_lib/vehicle-media-scoring.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:'Unauthorized.' },401));
    const body = await request.json().catch(()=>({}));
    const vehicle_id = String(body.vehicle_id || '').trim();
    const media_url = cleanText(body.media_url);
    const media_kind = normalizeKind(body.media_kind || body.kind);
    const capture_role = cleanText(body.capture_role);
    const caption = cleanText(body.caption);
    const alt_text = cleanText(body.alt_text);
    const image_title = cleanText(body.image_title);
    const crop_history = normalizeCropHistory(body.crop_history);
    const media_analysis = normalizeMediaAnalysis(body.media_analysis);
    const media_width_px = normalizePositiveInt(body.media_width_px ?? body.width_px);
    const media_height_px = normalizePositiveInt(body.media_height_px ?? body.height_px);
    const media_orientation = normalizeOrientation(body.media_orientation ?? body.orientation, media_width_px, media_height_px);
    const set_as_garage = body.set_as_garage === true || ['front','back'].includes(String(body.capture_role||'').toLowerCase());
    if (!vehicle_id) return withCors(json({ error:'vehicle_id is required.' },400));
    if (!media_url) return withCors(json({ error:'media_url is required.' },400));
    if (!media_kind) return withCors(json({ error:'Invalid media kind.' },400));
    const headers = serviceHeaders(env);
    const [vRes, mediaRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=id,customer_profile_id,garage_display_media_url&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&id=eq.${encodeURIComponent(vehicle_id)}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?select=id,media_kind,is_deleted,capture_role,media_url,media_analysis&vehicle_id=eq.${encodeURIComponent(vehicle_id)}&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&is_deleted=eq.false&order=created_at.asc`, { headers })
    ]);
    const vRows = await vRes.json().catch(()=>[]);
    const vehicle = Array.isArray(vRows)?vRows[0]||null:null;
    if (!vRes.ok || !vehicle) return withCors(json({ error:'Vehicle not found.' },404));
    const existingMedia = mediaRes && mediaRes.ok ? await mediaRes.json().catch(()=>[]) : [];
    const existingPhotoCount = Array.isArray(existingMedia) ? existingMedia.filter((row)=>String(row?.media_kind||'photo').toLowerCase()==='photo' && row?.is_deleted !== true).length : 0;
    const is_first_image = media_kind === 'photo' && existingPhotoCount === 0;

    const scoring = scoreVehicleMedia({
      mediaUrl: media_url,
      mediaKind: media_kind,
      altText: alt_text,
      imageTitle: image_title,
      caption,
      widthPx: media_width_px,
      heightPx: media_height_px,
      orientation: media_orientation,
      cropHistory: crop_history,
      mediaAnalysis: media_analysis,
      existingMedia,
      captureRole: capture_role,
      isFirstImage: is_first_image
    });

    if (scoring.reject_save) {
      return withCors(json({
        error: scoring.failures?.[0] || 'Uploaded media did not pass validation.',
        validation_errors: Array.isArray(scoring.failures) ? scoring.failures : [],
        media_score: scoring.score,
        media_score_label: scoring.label,
        media_score_status: scoring.status,
        checks: scoring.checks || null
      },400));
    }

    const payload = {
      customer_profile_id: current.customer_profile.id,
      vehicle_id,
      media_kind,
      media_url,
      capture_role,
      caption,
      alt_text,
      image_title,
      crop_history,
      media_width_px,
      media_height_px,
      media_orientation,
      media_analysis,
      is_primary: body.is_primary === true,
      is_deleted: false,
      uploaded_by_customer: true,
      media_score: scoring?.score ?? null,
      media_score_label: scoring?.label ?? null,
      media_score_status: scoring?.status || 'pending',
      updated_at: new Date().toISOString()
    };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media`, { method:'POST', headers:{ ...headers, Prefer:'return=representation' }, body: JSON.stringify([payload]) });
    if (!res.ok) return withCors(json({ error:`Could not save vehicle media. ${await res.text()}` },500));
    const rows = await res.json().catch(()=>[]);
    const media = Array.isArray(rows)?rows[0]||null:null;

    if (set_as_garage && media_kind === 'photo') {
      await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?id=eq.${encodeURIComponent(vehicle_id)}&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ garage_display_media_url: media_url, garage_display_media_kind: media_kind, updated_at: new Date().toISOString() }) }).catch(()=>null);
    }
    return withCors(json({ ok:true, media, media_score: scoring?.score ?? null, media_score_label: scoring?.label ?? null, media_score_status: scoring?.status || null, checks: scoring?.checks || null, media_analysis }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function cleanText(v){ const s=String(v??'').trim(); return s||null; }
function normalizeKind(v){ const s=String(v||'photo').trim().toLowerCase(); if(['photo','image'].includes(s)) return 'photo'; if(s==='video') return 'video'; return null; }
function normalizePositiveInt(v){ const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.round(n) : null; }
function normalizeMediaAnalysis(value){ if (value == null || value === '') return null; if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return { raw:value.trim() }; } } return value && typeof value === 'object' ? value : null; }
function normalizeCropHistory(value){
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value.trim() ? { raw:value.trim() } : null; }
  }
  if (Array.isArray(value)) return value.length ? value : null;
  if (typeof value === 'object') return Object.keys(value).length ? value : null;
  return null;
}
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
