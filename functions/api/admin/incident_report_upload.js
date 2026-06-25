// Build 202 — R2 evidence upload for incident reports.
import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }){
  try {
    const form = await request.formData();
    const bookingId = cleanText(form.get('booking_id'));
    if (!bookingId || !isUuid(bookingId)) return withCors(json({ ok:false, error:'A valid booking_id is required before uploading evidence.' }, 400));
    const access = await requireStaffAccess({ request, env, body:{ booking_id: bookingId }, capability:'work_booking', bookingId, allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);

    const bucket = env.ROSIE_PUBLIC_ASSETS_BUCKET || env.PUBLIC_ASSETS_BUCKET || env.R2_PUBLIC_ASSETS_BUCKET || env.ASSETS_BUCKET;
    if (!bucket || typeof bucket.put !== 'function') return withCors(json({ ok:false, error:'No R2 bucket binding is configured. Add ROSIE_PUBLIC_ASSETS_BUCKET or PUBLIC_ASSETS_BUCKET before uploading incident evidence.', expected_bindings:['ROSIE_PUBLIC_ASSETS_BUCKET','PUBLIC_ASSETS_BUCKET','R2_PUBLIC_ASSETS_BUCKET','ASSETS_BUCKET'] }, 501));
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') return withCors(json({ ok:false, error:'A file field is required.' }, 400));
    const contentType = file.type || guessContentType(file.name || '') || 'application/octet-stream';
    if (!/^image\/(png|jpeg|webp|gif)$/i.test(contentType)) return withCors(json({ ok:false, error:'Incident evidence must be an image file: PNG, JPEG, WebP, or GIF.' }, 400));
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 12 * 1024 * 1024) return withCors(json({ ok:false, error:'Evidence image is too large. Please keep each photo under 12 MB.' }, 400));
    const dims = readImageDimensions(new Uint8Array(bytes));
    const suffix = safeFileName(file.name || `evidence.${contentType.split('/').pop()}`);
    const key = cleanKey(form.get('r2_key')) || `incident-reports/${bookingId}/${new Date().toISOString().slice(0,10)}/${Date.now()}-${suffix}`;
    if (!/^incident-reports\/[a-zA-Z0-9._\/-]+$/.test(key)) return withCors(json({ ok:false, error:'Incident evidence keys must stay under incident-reports/.' }, 400));
    await bucket.put(key, bytes, { httpMetadata:{ contentType }, customMetadata:{ booking_id: bookingId, uploaded_by: access.actor?.email || 'staff', build:'202', private_until_approved:'true' } });
    const publicBase = String(env.PUBLIC_ASSET_BASE_URL || env.ASSETS_PUBLIC_BASE_URL || 'https://assets.rosiedazzlers.ca/').replace(/\/?$/, '/');
    return withCors(json({ ok:true, r2_key:key, url:publicBase + key, content_type:contentType, size_bytes:bytes.byteLength, dimensions:dims, evidence_item:{ url:publicBase + key, caption: cleanText(form.get('caption')), evidence_type:'photo', customer_visible:false, taken_at:new Date().toISOString() } }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || 'Could not upload incident evidence.' }, 500));
  }
}
export async function onRequestGet(){ return withCors(json({ ok:false, error:'POST multipart/form-data with booking_id and file.' }, 405)); }
function cleanText(v){ return String(v == null ? '' : v).trim(); }
function cleanKey(v){ return cleanText(v).replace(/^\/+/, '').replace(/\.\.+/g, ''); }
function safeFileName(v){ return String(v||'evidence.jpg').trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'evidence.jpg'; }
function guessContentType(k){ const e=String(k||'').split('.').pop().toLowerCase(); return { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp', gif:'image/gif' }[e] || ''; }
function readImageDimensions(bytes){ if(!bytes||bytes.length<12)return null; if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes.length>=24)return {type:'png',width:u32(bytes,16),height:u32(bytes,20)}; if(bytes[0]===0xff&&bytes[1]===0xd8){let i=2;while(i+9<bytes.length){if(bytes[i]!==0xff){i++;continue;}const m=bytes[i+1],l=(bytes[i+2]<<8)+bytes[i+3];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m))return {type:'jpeg',height:(bytes[i+5]<<8)+bytes[i+6],width:(bytes[i+7]<<8)+bytes[i+8]};i+=Math.max(2,l+2);}} return null; }
function u32(b,i){return ((b[i]<<24)>>>0)+(b[i+1]<<16)+(b[i+2]<<8)+b[i+3];}
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST,GET,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id', 'Cache-Control':'no-store' }; }
function withCors(response){ const headers=new Headers(response.headers||{}); Object.entries(corsHeaders()).forEach(([k,v])=>headers.set(k,v)); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
