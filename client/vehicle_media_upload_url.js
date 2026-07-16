
import { getCurrentCustomerSession, serviceHeaders } from "../_lib/customer-session.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:"Server not configured." },500));
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:"Unauthorized." },401));
    const body = await request.json().catch(() => ({}));
    const vehicle_id = String(body.vehicle_id || '').trim();
    const filename = String(body.filename || '').trim();
    const content_type = String(body.content_type || 'image/jpeg').trim().toLowerCase() || 'image/jpeg';
    const file_size_bytes = Number(body.file_size_bytes || 0);
    if (!vehicle_id) return withCors(json({ error:"vehicle_id is required." },400));
    if (!filename) return withCors(json({ error:"filename is required." },400));
    if (!isAllowedContentType(content_type)) return withCors(json({ error:"Unsupported upload type.", allowed: allowedContentTypes() },400));
    const vehicleRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=id,customer_profile_id&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&id=eq.${encodeURIComponent(vehicle_id)}&limit=1`, { headers: serviceHeaders(env) });
    const vehicleRows = await vehicleRes.json().catch(() => []);
    if (!vehicleRes.ok || !Array.isArray(vehicleRows) || !vehicleRows[0]) return withCors(json({ error:"Vehicle not found." },404));
    const media_kind = normalizeMediaKind(body.media_kind, content_type);
    const limit = getUploadSizeLimit({ env, content_type, media_kind });
    if (file_size_bytes > 0 && file_size_bytes > limit) return withCors(json({ error:`File is too large for ${media_kind}.`, max_size_bytes: limit },400));

    const bucket = String(env.CUSTOMER_MEDIA_BUCKET || env.JOB_MEDIA_BUCKET || 'job-media').trim() || 'job-media';
    const safeName = sanitizeFilename(filename);
    const stamp = new Date().toISOString().replaceAll(':','').replaceAll('.','');
    const path = `customer-vehicles/${current.customer_profile.id}/${vehicle_id}/${stamp}_${safeName}`;
    const signRes = await fetch(`${env.SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
      method:'POST',
      headers:{ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ expiresIn: 60 * 10, contentType: content_type })
    });
    const signText = await signRes.text();
    let sign = null; try { sign = JSON.parse(signText); } catch {}
    if (!signRes.ok) return withCors(json({ error:'Storage sign failed.', details: sign || signText },502));
    const signedURL = sign?.signedURL || sign?.signedUrl || sign?.signed_url || sign?.url;
    if (!signedURL) return withCors(json({ error:'Storage sign returned no signedURL.' },502));
    const upload_url = signedURL.startsWith('http') ? signedURL : `${env.SUPABASE_URL}/storage/v1${signedURL}`;
    const public_url = `${env.CUSTOMER_MEDIA_PUBLIC_BASE || env.JOB_MEDIA_PUBLIC_BASE || `${env.SUPABASE_URL}/storage/v1/object/public`}/${encodeURIComponent(bucket)}/${encodePath(path)}`;
    return withCors(json({ ok:true, bucket, path, media_ref:`sb://${bucket}/${path}`, upload_url, public_url, media_kind, max_size_bytes: limit }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' },500));
  }
}
function sanitizeFilename(name){ const base=name.split(/[\/]/).pop()||'file'; return base.replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,120); }
function encodePath(path){ return encodeURIComponent(path).replace(/%2F/g,'/'); }
function normalizeMediaKind(value, contentType){ const raw=String(value||'').trim().toLowerCase(); if(['image','video','document'].includes(raw)) return raw==='image'?'photo':raw; if(String(contentType||'').startsWith('video/')) return 'video'; return 'photo'; }
function allowedContentTypes(){ return ['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime']; }
function isAllowedContentType(value){ return allowedContentTypes().includes(String(value||'').trim().toLowerCase()); }
function getUploadSizeLimit({ env, content_type, media_kind }){ const defaultImage=Number(env.CUSTOMER_MEDIA_MAX_IMAGE_BYTES || env.JOB_MEDIA_MAX_IMAGE_BYTES || 25*1024*1024); const defaultVideo=Number(env.CUSTOMER_MEDIA_MAX_VIDEO_BYTES || env.JOB_MEDIA_MAX_VIDEO_BYTES || 150*1024*1024); return media_kind==='video' || String(content_type||'').startsWith('video/') ? defaultVideo : defaultImage; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
