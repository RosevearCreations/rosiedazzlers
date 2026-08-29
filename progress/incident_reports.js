// Build 202 — customer-visible incident reports for progress token.
export async function onRequestGet({ request, env }){
  try {
    const url = new URL(request.url);
    const token = String(url.searchParams.get('token') || '').trim();
    if (!token) return json({ ok:false, error:'Missing token.' }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok:false, error:'Server configuration is incomplete.' }, 500);
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json' };
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,progress_enabled&progress_token=eq.${encodeURIComponent(token)}&limit=1`, { headers });
    if (!bookingRes.ok) return json({ ok:false, error:`Could not verify booking. ${await bookingRes.text()}` }, 500);
    const bookingRows = await bookingRes.json().catch(()=>[]);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    if (!booking) return json({ ok:false, error:'Progress record not found.' }, 404);
    if (booking.progress_enabled === false) return json({ ok:false, error:'Progress viewing is not enabled for this booking.' }, 403);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/incident_reports?select=id,created_at,updated_at,incident_type,severity,title,vehicle_area,equipment_name,decision_status,approved_customer_summary,approved_customer_discussion,public_evidence_items,customer_visible_at&booking_id=eq.${encodeURIComponent(booking.id)}&public_visible=eq.true&order=customer_visible_at.desc,updated_at.desc`, { headers });
    if (!res.ok) return json({ ok:false, error:`Could not load customer incident reports. ${await res.text()}` }, 500);
    const rows = await res.json().catch(()=>[]);
    return json({ ok:true, incident_reports:Array.isArray(rows)?rows:[] });
  } catch (err) { return json({ ok:false, error:err?.message || String(err) }, 500); }
}
function json(data, status=200){ return new Response(JSON.stringify(data), { status, headers:{ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' } }); }
