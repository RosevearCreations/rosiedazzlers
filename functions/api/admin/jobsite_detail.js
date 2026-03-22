import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
import { loadAppSettings } from "../_lib/app-settings.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const booking_id = String(body.booking_id || "").trim();
    if (!booking_id) return withCors(json({ error: "Missing booking_id." }, 400));
    if (!isUuid(booking_id)) return withCors(json({ error: "Invalid booking_id." }, 400));
    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId: booking_id, allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    const settings = await loadAppSettings(env, ['feature_flags','visibility_matrix']);
    const [bookingRes, intakeRes, timeRes, updatesRes, mediaRes, signoffRes, commentsRes, annRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,created_at,updated_at,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,package_code,vehicle_size,price_total_cents,deposit_cents,notes,progress_enabled,progress_token,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,customer_profile_id,customer_tier_code&id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake?select=id,booking_id,pre_existing_condition,valuables,pre_job_checklist,owner_notes,acknowledgement_notes,intake_complete,updated_by_staff_user_id,updated_by_staff_name,created_at,updated_at&booking_id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries?select=id,booking_id,minutes,note,entry_type,staff_user_id,staff_name,created_at&booking_id=eq.${encodeURIComponent(booking_id)}&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_updates?select=id,booking_id,created_at,created_by,note,visibility&booking_id=eq.${encodeURIComponent(booking_id)}&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=id,booking_id,media_url,media_type,caption,visibility,sort_order,uploaded_by_staff_user_id,uploaded_by_staff_name,created_at&booking_id=eq.${encodeURIComponent(booking_id)}&order=sort_order.asc,created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,booking_id,customer_name,signature_data_url,approval_notes,signed_at,updated_by_staff_user_id,updated_by_staff_name,created_at,updated_at&booking_id=eq.${encodeURIComponent(booking_id)}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/progress_comments?select=id,booking_id,parent_type,parent_id,author_type,author_name,author_email,message,visibility,created_at&booking_id=eq.${encodeURIComponent(booking_id)}&order=created_at.asc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/observation_annotations?select=id,booking_id,media_id,x_percent,y_percent,title,note,visibility,created_by_type,created_by_name,created_at&booking_id=eq.${encodeURIComponent(booking_id)}&order=created_at.asc`, { headers }).catch(() => null)
    ]);
    for (const [res,label] of [[bookingRes,'booking'],[intakeRes,'jobsite intake'],[timeRes,'time entries'],[updatesRes,'progress updates'],[mediaRes,'job media'],[signoffRes,'signoff']]) { if (!res.ok) return withCors(json({ error:`Could not load ${label}. ${await res.text()}` },500)); }
    const [bookingRows,intakeRows,timeRows,updateRows,mediaRows,signoffRows,commentRows,annRows] = await Promise.all([
      bookingRes.json().catch(()=>[]), intakeRes.json().catch(()=>[]), timeRes.json().catch(()=>[]), updatesRes.json().catch(()=>[]), mediaRes.json().catch(()=>[]), signoffRes.json().catch(()=>[]), commentsRes && commentsRes.ok ? commentsRes.json().catch(()=>[]) : [], annRes && annRes.ok ? annRes.json().catch(()=>[]) : []
    ]);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    if (!booking) return withCors(json({ error:'Booking not found.' },404));
    const intake = Array.isArray(intakeRows) ? intakeRows[0] || null : null;
    const timeEntries = Array.isArray(timeRows) ? timeRows : [];
    const updates = Array.isArray(updateRows) ? updateRows : [];
    const media = Array.isArray(mediaRows) ? mediaRows : [];
    const signoff = Array.isArray(signoffRows) ? signoffRows[0] || null : null;
    const comments = Array.isArray(commentRows) ? commentRows : [];
    const annotations = Array.isArray(annRows) ? annRows : [];
    const mediaWithAnnotations = media.map(item => ({ ...item, annotations: annotations.filter(a => a.media_id === item.id) }));
    return withCors(json({
      ok:true,
      app_settings: settings,
      booking: { ...booking, total_price_cents: booking.price_total_cents ?? null, deposit_cents: booking.deposit_cents ?? null },
      intake: intake ? { ...intake, valuables: Array.isArray(intake.valuables)? intake.valuables : [], pre_job_checklist: Array.isArray(intake.pre_job_checklist)? intake.pre_job_checklist : [] } : null,
      time: { totals: summarizeTime(timeEntries), entries: timeEntries },
      progress: { count: updates.length, latest_at: updates[0]?.created_at || null, updates },
      media: { count: media.length, items: mediaWithAnnotations },
      signoff,
      comments,
      annotations
    }));
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function summarizeTime(entries){ const totals={ total_minutes:0, work_minutes:0, travel_minutes:0, setup_minutes:0, cleanup_minutes:0, pause_minutes:0 }; for(const row of entries||[]){ const m=Number(row.minutes||0); totals.total_minutes += m; const k=String(row.entry_type||'').toLowerCase(); if(k==='work') totals.work_minutes+=m; else if(k==='travel') totals.travel_minutes+=m; else if(k==='setup') totals.setup_minutes+=m; else if(k==='cleanup') totals.cleanup_minutes+=m; else if(k==='pause') totals.pause_minutes+=m; } return totals; }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
