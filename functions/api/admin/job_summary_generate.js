import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";
import { hydrateMediaRows } from "../_lib/job-live-feed.js";
import { loadProofMediaStatus } from "../_lib/proof-of-work.js";
import { queueCustomerLiveAlert } from "../_lib/live-interaction-alerts.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return withCors(json({ ok:false, error:"Valid booking_id is required." }, 400));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_progress", bookingId, allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);

    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=*&id=eq.${encodeURIComponent(bookingId)}&limit=1`, { headers });
    if (!bookingRes.ok) return withCors(json({ ok:false, error:`Could not load booking. ${await bookingRes.text()}` }, 500));
    const booking = (await bookingRes.json().catch(() => []))?.[0] || null;
    if (!booking) return withCors(json({ ok:false, error:"Booking not found." }, 404));

    const [mediaRows, updateRows, checklistRows, usageRows, signoffRows, incidentRows, paymentRows, finalBalanceRows, existingSummaryRows] = await Promise.all([
      table(env, `job_media?select=*&booking_id=eq.${encodeURIComponent(bookingId)}&visibility=eq.customer&order=created_at.asc`),
      table(env, `job_updates?select=*&booking_id=eq.${encodeURIComponent(bookingId)}&visibility=eq.customer&order=created_at.asc`),
      table(env, `job_completion_checklists?select=*&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`),
      table(env, `catalog_inventory_movements?select=id,item_key,item_name,qty_delta,note,created_at&booking_id=eq.${encodeURIComponent(bookingId)}&movement_type=eq.job_use&order=created_at.asc`),
      table(env, `job_signoffs?select=id,signer_name,signer_email,notes,signed_at&booking_id=eq.${encodeURIComponent(bookingId)}&order=signed_at.desc`),
      table(env, `incident_reports?select=id,status,decision_status,public_visible,approved_customer_summary,title&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.desc`),
      table(env, `quote_deposit_payment_requests?select=id,payment_status,amount_cents,paid_amount_cents,payment_reference,paid_at&or=(booking_id.eq.${encodeURIComponent(bookingId)},confirmed_booking_id.eq.${encodeURIComponent(bookingId)})&order=created_at.desc`),
      table(env, `final_balance_payment_requests?select=id,status,amount_cents,currency,payment_url,paid_at,notes&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.desc`),
      table(env, `completed_job_summaries?select=*&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`)
    ]);

    const media = await hydrateMediaRows(env, (mediaRows.rows || []).filter(customerSafe));
    const updates = (updateRows.rows || []).filter(customerSafe);
    const proof = await loadProofMediaStatus(env, bookingId);
    const checklist = checklistRows.rows?.[0] || null;
    const unresolvedIncidents = (incidentRows.rows || []).filter((row)=>!["resolved","closed","customer_visible"].includes(String(row.status || "").toLowerCase()) && !["resolved","no_fault","customer_resolved"].includes(String(row.decision_status || "").toLowerCase()));
    const paymentStatus = derivePaymentStatus(paymentRows.rows || [], finalBalanceRows.rows || []);
    const finalMedia = media.filter((item)=>String(item.stage || "") === "final").map((item)=>({ id:item.id, kind:item.kind, caption:item.caption, media_url:item.media_url, storage_bucket:item.storage_bucket || null, storage_path:item.storage_path || null }));
    const recommendationUpdates = updates.filter((item)=>String(item.stage || "") === "recommendation").map((item)=>({ title:item.recommendation_title || "Recommendation", note:item.note || null, amount_cents:item.recommendation_amount_cents || null, decision:item.customer_decision || null, status:item.recommendation_status || null }));
    const careAdvice = buildCareAdvice(booking, checklist);
    const maintenanceRecommendations = buildMaintenance(checklist, recommendationUpdates);
    const actorName = access.actor?.full_name || access.actor?.email || "Staff";
    const now = new Date().toISOString();
    const existingSummary = existingSummaryRows.rows?.[0] || null;
    if (existingSummary?.id) await archiveSummaryRevision(env, existingSummary, actorName).catch(()=>null);
    const summary = {
      booking_id:bookingId,
      customer_profile_id:booking.customer_profile_id || null,
      vehicle_id:booking.vehicle_id || null,
      status:body.publish === false ? "draft" : "published",
      summary_title:`${booking.package_code ? humanize(booking.package_code) : "Detailing service"} completed`,
      service_summary:String(body.service_summary || buildServiceSummary(booking, proof, unresolvedIncidents)).trim(),
      proof_items:{ media:finalMedia, proof_status:proof, signoff:signoffRows.rows?.[0] || null, checklist },
      products_used:usageRows.rows || [],
      care_advice:careAdvice,
      maintenance_recommendations:maintenanceRecommendations,
      invoice_reference:paymentRows.rows?.[0]?.payment_reference || finalBalanceRows.rows?.[0]?.id || null,
      payment_status:paymentStatus,
      customer_visible:body.publish !== false,
      generated_by_staff_user_id:access.actor?.id || null,
      generated_by_staff_name:actorName,
      generated_at:now,
      updated_at:now,
      revision_number:Number(existingSummary?.revision_number || 0) + 1,
      customer_acknowledged_at:null,
      customer_acknowledged_name:null,
      customer_acknowledgement_version:null
    };
    const saveRes = await fetch(`${env.SUPABASE_URL}/rest/v1/completed_job_summaries?on_conflict=booking_id`, { method:"POST", headers:{ ...headers, Prefer:"resolution=merge-duplicates,return=representation" }, body:JSON.stringify([summary]) });
    if (!saveRes.ok) return withCors(json({ ok:false, error:`Could not save completed-job summary. ${await saveRes.text()}`, migration:"sql/2026-06-17_build210_connected_live_workflow.sql" }, 500));
    const saved = (await saveRes.json().catch(() => []))?.[0] || summary;
    await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, { method:"PATCH", headers, body:JSON.stringify({ completed_summary_status:summary.status, completed_summary_generated_at:now }) }).catch(() => null);
    if (summary.customer_visible) await queueCustomerLiveAlert({ env, bookingId, eventType:"completed_job_summary_ready", message:"Your completed-job summary, proof, care advice, and maintenance recommendations are ready.", payload:{ summary_id:saved.id || null } }).catch(() => null);
    return withCors(json({ ok:true, summary:saved, unresolved_incidents:unresolvedIncidents.length, proof_status:proof, payment_status:paymentStatus }));
  } catch (err) { return withCors(json({ ok:false, error:err?.message || "Could not generate completed-job summary." }, 500)); }
}


async function archiveSummaryRevision(env, existing, actorName){
  const row={ summary_id:existing.id, booking_id:existing.booking_id, revision_number:Number(existing.revision_number||0), snapshot:existing, revised_by_staff_name:actorName, revised_at:new Date().toISOString() };
  await fetch(`${env.SUPABASE_URL}/rest/v1/completed_job_summary_revisions`,{method:'POST',headers:serviceHeaders(env),body:JSON.stringify([row])});
}

async function table(env, path){
  try { const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)}); if(!res.ok)return{rows:[],warning:await res.text()}; return{rows:await res.json().catch(()=>[]),warning:null}; } catch(err){ return{rows:[],warning:String(err)}; }
}
function customerSafe(row){ return String(row.visibility || "customer") === "customer" && !["hidden","internal_only"].includes(String(row.thread_status || "")) && !["pending","rejected"].includes(String(row.review_status || "")); }
function derivePaymentStatus(deposits, balances){ if (balances.some((r)=>r.paid_at || /paid/i.test(String(r.status||"")))) return "paid"; if (balances.some((r)=>/sent|open|draft/i.test(String(r.status||"")))) return "balance_requested"; if (deposits.some((r)=>r.paid_at || /paid/i.test(String(r.payment_status||"")))) return "deposit_paid"; return "unpaid_or_not_recorded"; }
function buildServiceSummary(booking,proof,incidents){ const parts=[`${humanize(booking.package_code || "detailing service")} was completed for ${booking.customer_name || "the customer"}.`, proof.ready_to_complete ? "Arrival, during-work, and final proof media are recorded." : `Proof media still needs: ${proof.missing_stages.join(", ") || "review"}.`]; if(incidents.length)parts.push(`${incidents.length} incident report(s) remain unresolved.`); return parts.join(" "); }
function buildCareAdvice(booking,checklist){ const rows=["Allow cleaned fabric and carpets to fully dry before placing heavy items on them.","Avoid harsh household cleaners on protected interior or exterior surfaces."]; if(checklist?.suggested_next_steps)rows.push(String(checklist.suggested_next_steps)); if(/ceramic|graphene/i.test(String(booking.package_code||"")))rows.push("Avoid automatic brush washes and follow the coating aftercare guidance provided by Rosie Dazzlers."); return rows; }
function buildMaintenance(checklist,recommendations){ const rows=[]; if(checklist?.recommended_interval_days)rows.push({ label:`Suggested return in ${checklist.recommended_interval_days} days`, interval_days:Number(checklist.recommended_interval_days) }); for(const item of recommendations){ if(item.decision!=="declined")rows.push({ label:item.title || "Recommended follow-up", note:item.note || null, amount_cents:item.amount_cents || null, decision:item.decision || null }); } return rows; }
function humanize(v){ return String(v||"").replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase()); }
export async function onRequestOptions(){ return new Response("",{status:204,headers:corsHeaders()}); }
function corsHeaders(){return{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
