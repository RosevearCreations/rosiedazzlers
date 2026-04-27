import { requireStaffAccess, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";
import { listAccountingDocuments, saveAccountingDocument } from "../_lib/accounting-gl.js";

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const url = new URL(request.url);
    const documents = await listAccountingDocuments(env, {
      relatedType: cleanText(url.searchParams.get('related_type')) || null,
      relatedId: cleanText(url.searchParams.get('related_id')) || null,
      documentKind: cleanText(url.searchParams.get('document_kind')) || null,
      limit: Number(url.searchParams.get('limit') || 200)
    });
    return withCors(json({ ok:true, documents }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestPost({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const body = await request.json().catch(()=>({}));
    const saved = await saveAccountingDocument(env, body, {
      name: access.actor?.full_name || access.actor?.email || null,
      staffUserId: access.actor?.id || null
    });
    return withCors(json({ ok:true, document: saved }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestDelete(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers = new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
