
import { serviceHeaders } from "../_lib/customer-session.js";
import { issueCustomerAuthToken, sendCustomerAuthEmail } from "../_lib/customer-auth-tokens.js";

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    if (!email) return withCors(json({ error:'Valid email is required.' }, 400));
    const customer = await loadCustomerByEmail(env, email);
    if (!customer || customer.is_active !== true) return withCors(json({ ok:true, message:'If that email exists, a reset link has been sent.' }));
    if (!(await canIssuePasswordReset(env, customer.id))) return withCors(json({ ok:true, message:'If that email exists, a reset link has been sent.' }));
    const issued = await issueCustomerAuthToken({ env, customerProfileId: customer.id, purpose:'password_reset', expiresMinutes: 90, payload:{ email } });
    await sendCustomerAuthEmail({ env, request, customer, purpose:'password_reset', rawToken: issued.rawToken }).catch(() => null);
    // Match the unknown-email response exactly so browser/network observers cannot enumerate accounts.
    return withCors(json({ ok:true, message:'If that email exists, a reset link has been sent.' }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}

async function canIssuePasswordReset(env, customerProfileId){
  // Keep the response generic while slowing repeated email delivery for the same account.
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const url = `${env.SUPABASE_URL}/rest/v1/customer_auth_tokens?select=id&customer_profile_id=eq.${encodeURIComponent(customerProfileId)}&purpose=eq.password_reset&created_at=gte.${encodeURIComponent(since)}&limit=4`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not check reset request rate. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return !Array.isArray(rows) || rows.length < 3;
}

async function loadCustomerByEmail(env,email){const res=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,email,full_name,phone,is_active,email_verified_at&email=eq.${encodeURIComponent(email)}&limit=1`,{headers:serviceHeaders(env)}); if(!res.ok) throw new Error(`Could not load customer profile. ${await res.text()}`); const rows=await res.json().catch(()=>[]); return Array.isArray(rows)?rows[0]||null:null;}
function cleanEmail(v){const s=String(v||'').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:null;}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});} 
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
