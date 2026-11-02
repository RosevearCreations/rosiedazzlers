// Build 740 — staff-only, read-only accepted quote / consent / deposit preview.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { resolveCurrentQuotePrice } from "../_lib/quote-booking-authority.js";
import { evaluateQuoteBookingApproval740 } from "../_lib/quote-booking-approval-v740.js";

const DRAFT_SELECT = [
  "id", "title", "acceptance_status", "accepted_at", "responded_at", "delivered_at", "follow_up_at",
  "structured_terms_hash", "accepted_terms", "accepted_terms_hash", "latest_deposit_payment_request_id"
].join(",");
const PAYMENT_SELECT = [
  "id", "provider", "provider_status", "payment_status", "amount_cents", "requested_at", "paid_at", "booking_confirmed_at", "created_at"
].join(",");

export async function onRequestGet(context) { return preview(context); }
export async function onRequestPost(context) { return preview(context); }
export async function onRequestOptions() { return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }

async function preview({ request, env }) {
  try {
    const body = request.method === "GET" ? Object.fromEntries(new URL(request.url).searchParams) : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const draftId = cleanText(body.draft_id || body.quote_proposal_draft_id);
    if (!isUuid(draftId)) return fail("QUOTE_ID_REQUIRED", "Choose a saved quote to review.", 400);
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return fail("SOURCE_UNAVAILABLE", "Quote approval sources are unavailable.", 503);

    const quote = await rows(env, "quote_proposal_drafts", { select:DRAFT_SELECT, id:`eq.${draftId}`, limit:"1" });
    if (!quote.length) return fail("QUOTE_NOT_FOUND", "The saved quote could not be found.", 404);
    const draft = quote[0];
    const depositRows = await rows(env, "quote_deposit_payment_requests", {
      select:PAYMENT_SELECT, quote_proposal_draft_id:`eq.${draftId}`, order:"created_at.desc", limit:"10"
    });
    const accepted = draft.acceptance_status === "accepted" && draft.accepted_terms && typeof draft.accepted_terms === "object";
    const currentPrice = accepted
      ? await resolveCurrentQuotePrice(env, draft.accepted_terms)
      : { ok:false, code:"QUOTE_NOT_ACCEPTED" };
    const result = await evaluateQuoteBookingApproval740({
      quote:draft, currentPrice, paymentRequests:depositRows,
      proposedTerms:body.proposed_terms == null ? null : body.proposed_terms
    });
    return withCors(json({ ok:true, draft_id:draftId, quote_title:draft.title || "Quote", ...result }));
  } catch (error) {
    // Missing/partial provider evidence must not be represented as zero requests.
    return fail("QUOTE_APPROVAL_SOURCE_UNAVAILABLE", "Could not verify the saved quote and payment history. Try again or contact the owner.", 503);
  }
}

async function rows(env, table, params) {
  const query = new URLSearchParams(params);
  const result = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {headers:serviceHeaders(env)});
  if (!result.ok) throw new Error(`${table} unavailable (${result.status})`);
  const data = await result.json();
  if (!Array.isArray(data)) throw new Error("Unexpected source result");
  return data;
}
function fail(code, error, status) { return withCors(json({ok:false,code,error,read_only:true},status)); }
function corsHeaders() { return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response) { const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
