import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
export async function onRequestPost({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:'Server not configured (Supabase env vars missing)' },500));
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const body = await request.json().catch(()=>({}));
    const filename = String(body.filename || '').trim();
    const content_type = String(body.content_type || 'application/octet-stream').trim().toLowerCase();
    const file_size_bytes = Number(body.file_size_bytes || 0);
    if (!filename) return withCors(json({ error:'filename required.' },400));
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(content_type)) return withCors(json({ error:'Unsupported upload type.', allowed },400));
    const limit = Number(env.ACCOUNTING_DOCUMENT_MAX_BYTES || 25 * 1024 * 1024);
    if (file_size_bytes > 0 && file_size_bytes > limit) return withCors(json({ error:'File is too large.', max_size_bytes: limit },400));
    const bucket = String(env.ACCOUNTING_DOCUMENT_BUCKET || env.JOB_MEDIA_BUCKET || 'job-media').trim() || 'job-media';
    const safeName = (filename.split(/[\/]/).pop() || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
    const stamp = new Date().toISOString().replaceAll(':','').replaceAll('.','');
    const path = `accounting/${new Date().toISOString().slice(0,7)}/${stamp}_${safeName}`;
    const signRes = await fetch(`${env.SUPABASE_URL}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
      method:'POST',
      headers:{ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ expiresIn: 60 * 10, contentType: content_type })
    });
    const signText = await signRes.text();
    let sign = null; try { sign = JSON.parse(signText); } catch {}
    if (!signRes.ok) return withCors(json({ error:'Supabase Storage sign failed.', details: sign || signText },502));
    const signedURL = sign?.signedURL || sign?.signedUrl || sign?.signed_url || sign?.url;
    if (!signedURL) return withCors(json({ error:'Supabase Storage sign returned no signedURL.' },502));
    const upload_url = signedURL.startsWith('http') ? signedURL : `${env.SUPABASE_URL}/storage/v1${signedURL}`;
    const public_url = `${env.JOB_MEDIA_PUBLIC_BASE || `${env.SUPABASE_URL}/storage/v1/object/public`}/${encodeURIComponent(bucket)}/${encodePath(path)}`;
    return withCors(json({ ok:true, bucket, path, storage_path: path, media_ref:`sb://${bucket}/${path}`, upload_url, public_url, max_size_bytes: limit }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function encodePath(path){ return encodeURIComponent(path).replace(/%2F/g,'/'); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers = new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
