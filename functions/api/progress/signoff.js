import {qualitySnapshot749} from '../_lib/quality-store-v749.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const token = String(body.token || "").trim();
    const signer_name = String(body.signer_name || "").trim();
    const signer_email = String(body.signer_email || "").trim();
    const notes = String(body.notes || "").trim();
    const signature_data_url = String(body.signature_data_url || "").trim() || null;

    if (!token) return json({ error: "Missing token." }, 400);
    if (!signer_name || signer_name.length>120) return json({ error: "A valid customer name is required." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signer_email)||signer_email.length>254) return json({ error: "A valid customer email is required." }, 400);
    if(notes.length>1200)return json({error:'Signoff note is too long.'},400);
    if(signature_data_url&&(signature_data_url.length>400000||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signature_data_url)))return json({error:'The drawing must be a bounded PNG signature from the customer.'},400);

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const bookingUrl =
      `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,status,job_status,current_workflow_stage,progress_enabled,progress_token` +
      `&progress_token=eq.${encodeURIComponent(token)}` +
      `&limit=1`;

    const bookingRes = await fetch(bookingUrl, { headers });
    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not load booking. ${text}` }, 500);
    }

    const bookings = await bookingRes.json();
    const booking = Array.isArray(bookings) ? bookings[0] : null;

    if (!booking) {
      return json({ error: "Progress record not found." }, 404);
    }

    if (booking.progress_enabled === false) {
      return json({ error: "Progress signoff is not enabled for this booking." }, 403);
    }

    // A customer acts using their own private progress token. Staff QC receipts never
    // stand in for a customer signature. Legacy already-completed jobs remain readable.
    let quality;
    try { quality=(await qualitySnapshot749(env,booking.id)).summary; }
    catch { return json({error:'Quality acceptance could not be verified. Please contact Rosie Dazzlers before signing.'},503); }
    const stage=String(booking.current_workflow_stage||booking.job_status||booking.status||'').toLowerCase();
    if(!quality.approved&&(quality.started||!['awaiting_payment','completed'].includes(stage)))
      return json({error:'Final quality inspection and independent review are not yet complete. Please wait for Rosie Dazzlers to finish the handoff.'},409);
    if(quality.started&&(!quality.approved||body.acknowledgement_749!==true||!signature_data_url))
      return json({error:'Customer or owner acknowledgement and their own drawn signature are required after independent quality acceptance.'},409);

    const bookingId = booking.id;
    const user_agent = request.headers.get("user-agent") || "";
    const existingRes=await fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id&booking_id=eq.${bookingId}&signer_type=eq.customer&limit=1`,{headers});
    if(!existingRes.ok)return json({error:'Could not check existing customer signoff. No duplicate was sent.'},503);
    const already=await existingRes.json().catch(()=>[]);
    if(!Array.isArray(already))return json({error:'Customer signoff readback unavailable.'},503);
    if(already.length)return json({error:'Customer signoff is already recorded. Reload your booking before continuing.'},409);

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([
        {
          booking_id: bookingId,
          signer_type: "customer",
          signer_name,
          signer_email,
          notes: notes || null,
          signature_data_url,
          user_agent
        }
      ])
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not save signoff. ${text}` }, 500);
    }

    const signoffRows = await insertRes.json();
    const signoff = Array.isArray(signoffRows) ? signoffRows[0] : null;

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "completed",
          job_status: "completed",
          completed_at: new Date().toISOString()
        })
      }
    );

    if (!patchRes.ok) {
      const text = await patchRes.text();
      return json({ error: `Signoff saved, but booking update failed. ${text}` }, 500);
    }

    return json({
      ok: true,
      message: "Signoff recorded.",
      signoff: signoff || null
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
