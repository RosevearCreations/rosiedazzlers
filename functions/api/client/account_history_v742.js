// Build 742: exact-session, owner-scoped account history and change-request intake.
// Intentionally does not update a booking, availability, payment or communication.
import { getCurrentCustomerSession, serviceHeaders } from '../_lib/customer-session.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statusesNotRequestable = new Set(['completed', 'cancelled', 'canceled', 'refunded', 'no_show']);

export async function onRequestOptions() {
  return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
}

export async function onRequestGet({ request, env }) {
  try {
    const identity = await authenticatedIdentity(request, env);
    if (!identity) return json({ ok: false, error: 'Sign in to view your account history.' }, 401);
    const { profileId, email } = identity;
    const [requests, quotes, maintenance, depositReceipts, finalReceipts] = await Promise.all([
      loadRows(env, `customer_booking_change_requests?select=id,booking_id,request_type,status,preferred_service_date,preferred_start_slot,customer_reason,submitted_at,updated_at,reviewed_at,customer_visible_resolution&customer_profile_id=eq.${encodeURIComponent(profileId)}&order=submitted_at.desc&limit=50`),
      loadRows(env, `quote_proposal_drafts?select=id,title,status,acceptance_status,sent_at,accepted_at,declined_at,terms_expires_at&customer_email=eq.${encodeURIComponent(email)}&or=(sent_at.not.is.null,accepted_at.not.is.null,declined_at.not.is.null)&order=created_at.desc&limit=25`),
      loadRows(env, `membership_interest_requests?select=id,status,preferred_cycle,vehicle_count,created_at&email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=15`),
      loadRows(env, `quote_deposit_payment_requests?select=id,quote_proposal_draft_id,booking_id,confirmed_booking_id,payment_status,paid_at,paid_amount_cents,currency&customer_email=eq.${encodeURIComponent(email)}&payment_status=eq.paid&paid_at=not.is.null&order=paid_at.desc&limit=25`),
      loadRows(env, `final_balance_payment_requests?select=id,booking_id,status,paid_at,paid_amount_cents,currency&customer_email=eq.${encodeURIComponent(email)}&status=eq.paid&paid_at=not.is.null&order=paid_at.desc&limit=25`)
    ]);
    const receipts = [
      ...depositReceipts.map((row) => safeReceipt(row, 'Quote deposit')),
      ...finalReceipts.map((row) => safeReceipt(row, 'Final balance'))
    ].filter(Boolean).sort((a, b) => Date.parse(b.paid_at) - Date.parse(a.paid_at));
    return json({ ok: true, authenticated: true, history: {
      change_requests: requests.map(safeRequest),
      quotes: quotes.map((row) => ({ id: row.id, title: row.title, status: row.status, acceptance_status: row.acceptance_status, sent_at: row.sent_at, accepted_at: row.accepted_at, declined_at: row.declined_at, terms_expires_at: row.terms_expires_at })),
      maintenance_interest: maintenance.map((row) => ({ id: row.id, status: row.status, preferred_cycle: row.preferred_cycle, vehicle_count: row.vehicle_count, created_at: row.created_at })),
      payment_receipts: receipts,
      authority: { owner_scoped: true, schedule_change_requires_staff_review: true, automatic_payment_or_notification: false }
    } });
  } catch {
    return json({ ok: false, error: 'Account history is temporarily unavailable. Please try again.' }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!sameOriginPost(request)) return json({ ok: false, error: 'Requests must be submitted from the account page.' }, 403);
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return json({ ok: false, error: 'JSON is required.' }, 415);
    const identity = await authenticatedIdentity(request, env);
    if (!identity) return json({ ok: false, error: 'Sign in before sending a change request.' }, 401);

    const raw = await request.text();
    if (raw.length > 4096) return json({ ok: false, error: 'The request is too large.' }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ ok: false, error: 'A request is required.' }, 400);
    const { profileId, email } = identity;
    const bookingId = String(body.booking_id || '').trim();
    const clientRequestId = String(body.client_request_id || '').trim();
    const type = String(body.request_type || '').trim();
    const date = type === 'reschedule' ? String(body.preferred_service_date || '').trim() : null;
    const slot = type === 'reschedule' ? clean(body.preferred_start_slot, 80) : null;
    const reason = clean(body.reason, 1000);
    if (!UUID.test(bookingId) || !UUID.test(clientRequestId) || !['reschedule', 'cancel'].includes(type)) {
      return json({ ok: false, error: 'Choose a booking and a valid change type.' }, 400);
    }
    if (type === 'reschedule' && !validRequestedDate(date)) return json({ ok: false, error: 'Choose a valid future date for review.' }, 400);
    if (!reason || reason.length < 8) return json({ ok: false, error: 'Please explain your request (at least 8 characters).' }, 400);

    const ownedRows = await loadRows(env, `bookings?select=id,customer_profile_id,customer_email,service_date,status,job_status,detailing_completed_at&customer_email=eq.${encodeURIComponent(email)}&id=eq.${encodeURIComponent(bookingId)}&limit=1`);
    const owned = ownedRows[0] || null;
    if (!owned || (owned.customer_profile_id && owned.customer_profile_id !== profileId)) {
      return json({ ok: false, error: 'This booking is not available in your account.' }, 404);
    }
    if (owned.detailing_completed_at || statusesNotRequestable.has(String(owned.status || '').toLowerCase()) || statusesNotRequestable.has(String(owned.job_status || '').toLowerCase())) {
      return json({ ok: false, error: 'This booking is already closed. Contact Rosie for assistance.' }, 409);
    }

    const prior = await loadRows(env, `customer_booking_change_requests?select=id,booking_id,request_type,status,preferred_service_date,preferred_start_slot,customer_reason,submitted_at,updated_at,reviewed_at,customer_visible_resolution&customer_profile_id=eq.${encodeURIComponent(profileId)}&client_request_id=eq.${encodeURIComponent(clientRequestId)}&limit=1`);
    if (prior.length) {
      if (prior[0].booking_id !== bookingId || prior[0].request_type !== type) return json({ ok: false, error: 'This request reference was already used.' }, 409);
      return json({ ok: true, duplicate: true, change_request: safeRequest(prior[0]) });
    }

    const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_booking_change_requests?select=id,booking_id,request_type,status,preferred_service_date,preferred_start_slot,customer_reason,submitted_at,updated_at,reviewed_at,customer_visible_resolution`, {
      method: 'POST',
      headers: { ...serviceHeaders(env), Prefer: 'return=representation' },
      body: JSON.stringify([{
        customer_profile_id: profileId,
        booking_id: bookingId,
        client_request_id: clientRequestId,
        request_type: type,
        status: 'pending_review',
        preferred_service_date: date,
        preferred_start_slot: slot || null,
        customer_reason: reason,
        customer_email_snapshot: email
      }])
    });
    if (insert.status === 409) return json({ ok: false, error: 'A change request for this booking is already awaiting Rosie’s review.' }, 409);
    if (!insert.ok) return json({ ok: false, error: 'Could not save the request. Please try again.' }, 503);
    const rows = await insert.json().catch(() => []);
    if (!Array.isArray(rows) || !rows[0]) return json({ ok: false, error: 'Request confirmation is temporarily unavailable.' }, 503);
    return json({ ok: true, duplicate: false, change_request: safeRequest(rows[0]), appointment_changed: false, notification_sent: false }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ ok: false, error: 'The request could not be read.' }, 400);
    return json({ ok: false, error: 'The request service is temporarily unavailable.' }, 503);
  }
}

async function authenticatedIdentity(request, env) {
  if (!env?.SUPABASE_URL) return null;
  const current = await getCurrentCustomerSession({ env, request });
  const profileId = String(current?.customer_profile?.id || '').trim();
  const email = String(current?.customer_profile?.email || '').trim().toLowerCase();
  return UUID.test(profileId) && email.includes('@') ? { profileId, email } : null;
}

async function loadRows(env, path) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: serviceHeaders(env) });
  if (!response.ok) throw new Error('Source unavailable.');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid source.');
  return rows;
}

function safeRequest(row) {
  return { id: row.id, booking_id: row.booking_id, request_type: row.request_type, status: row.status, preferred_service_date: row.preferred_service_date, preferred_start_slot: row.preferred_start_slot, reason: row.customer_reason, submitted_at: row.submitted_at, updated_at: row.updated_at, reviewed_at: row.reviewed_at, resolution: row.customer_visible_resolution };
}

function safeReceipt(row, label) {
  if (!row?.paid_at || !(Number(row.paid_amount_cents) > 0) || row.currency !== 'CAD') return null;
  return { id: row.id, label, paid_at: row.paid_at, amount_cents: row.paid_amount_cents, currency: 'CAD', booking_id: row.confirmed_booking_id || row.booking_id || null };
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validRequestedDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) return false;
  const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type) => dateParts.find((value) => value.type === type)?.value || '';
  const todayToronto = `${part('year')}-${part('month')}-${part('day')}`;
  return value >= todayToronto;
}

function sameOriginPost(request) {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (site && !['same-origin', 'none'].includes(site)) return false;
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
