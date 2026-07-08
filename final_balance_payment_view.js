// Build 217 — public, token-gated final-balance payment status. Never returns customer PII.
import { serviceHeaders, isUuid } from "./_lib/staff-auth.js";
import { hashOpaqueToken, equalHash, publicPaymentView, statusKind } from "./_lib/final-balance-links.js";

const SELECT = [
  "id","status","amount_cents","currency","token_hash","payment_url","checkout_url",
  "provider","provider_status","paid_at","expires_at","cancelled_at","created_at"
].join(",");

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const id = String(url.searchParams.get("request_id") || "").trim();
    const token = String(url.searchParams.get("token") || "").trim();
    if (!isUuid(id) || !/^[a-f0-9]{64}$/i.test(token)) return respond({ ok:false, error:"This secure payment link is invalid or incomplete." }, 404);
    if (!hasSupabaseConfig(env)) return respond({ ok:false, error:"Payment service is not configured." }, 503);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=${encodeURIComponent(SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers:serviceHeaders(env) });
    if (!res.ok) throw new Error("Could not load the secure payment request.");
    const row = (await res.json().catch(() => []))?.[0] || null;
    if (!row || !row.token_hash) return respond({ ok:false, error:"This secure payment link is unavailable." }, 404);
    const suppliedHash = await hashOpaqueToken(token);
    if (!equalHash(suppliedHash, row.token_hash)) return respond({ ok:false, error:"This secure payment link is unavailable." }, 404);

    const state = statusKind(row);
    const payment = publicPaymentView(row);
    if (state === "expired") return respond({ ok:false, state, payment, error:"This secure payment link has expired. Please contact Rosie Dazzlers for a replacement link." }, 410);
    if (state === "cancelled") return respond({ ok:false, state, payment, error:"This payment request is no longer active. Please contact Rosie Dazzlers if you have questions." }, 410);
    return respond({ ok:true, payment }, 200);
  } catch (err) {
    return respond({ ok:false, error:err?.message || "Could not load the secure payment request." }, 500);
  }
}

function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function respond(payload, status) { return new Response(JSON.stringify(payload), { status, headers:{ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow" } }); }
