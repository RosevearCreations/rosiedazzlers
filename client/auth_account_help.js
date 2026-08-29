// Build 220 — privacy-safe request for help locating a customer's sign-in email.
// It does not reveal whether an account exists and never changes login credentials.
import { serviceHeaders } from '../_lib/customer-session.js';

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:'Account help is not configured yet.' },500));
    const body = await request.json().catch(() => ({}));
    if (String(body.website || '').trim()) return withCors(json(genericResponse()));
    const fullName = safeText(body.full_name, 160);
    const phone = safePhone(body.phone);
    const emailHint = safeEmail(body.email_hint);
    const message = safeText(body.message, 700);
    if (!fullName || (!phone && !emailHint)) return withCors(json({ error:'Enter your name and either the phone number or email address that may be on the account.' },400));
    const fingerprint = await sha256Hex(`${request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'}|${utcDate()}|${env.CUSTOMER_SESSION_SECRET || env.ADMIN_PASSWORD || 'rd-help'}`);
    const since = new Date(Date.now() - 24*60*60*1000).toISOString();
    const countRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_account_recovery_requests?select=id&request_fingerprint=eq.${encodeURIComponent(fingerprint)}&created_at=gte.${encodeURIComponent(since)}&limit=4`, { headers:serviceHeaders(env) });
    const existing = countRes.ok ? await countRes.json().catch(() => []) : [];
    if (Array.isArray(existing) && existing.length >= 3) return withCors(json(genericResponse()));
    const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_account_recovery_requests`, {
      method:'POST', headers:{ ...serviceHeaders(env), Prefer:'return=minimal' }, body:JSON.stringify([{ full_name_hint:fullName, phone_hint:phone, email_hint:emailHint, message, request_fingerprint:fingerprint, status:'queued' }])
    });
    if (!insert.ok) throw new Error(`Could not record sign-in help request. ${await insert.text()}`);
    return withCors(json(genericResponse()));
  } catch (error) { return withCors(json({ error:error?.message || 'Could not send account help request.' },500)); }
}
function genericResponse(){ return { ok:true, message:'Thanks. If the details match an account, our team will review the request. For privacy, this form does not confirm whether an account exists.' }; }
function safeText(value,max){ const text=String(value ?? '').trim().replace(/[\u0000-\u001f]/g,' '); return text && text.length <= max ? text : null; }
function safePhone(value){ const text=String(value ?? '').trim(); if (!text) return null; const digits=text.replace(/[^\d+]/g,''); return digits.length>=7 && digits.length<=20 ? text.slice(0,60) : null; }
function safeEmail(value){ const text=String(value ?? '').trim().toLowerCase(); if(!text) return null; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text.slice(0,320) : null; }
function utcDate(){ return new Date().toISOString().slice(0,10); }
async function sha256Hex(input){ const bytes=new TextEncoder().encode(String(input||'')); const hash=await crypto.subtle.digest('SHA-256',bytes); return [...new Uint8Array(hash)].map((byte)=>byte.toString(16).padStart(2,'0')).join(''); }
function json(data,status=200){ return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
