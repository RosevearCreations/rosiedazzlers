// Build 382 — authenticated, read-only customer retention summary.
import { getCurrentCustomerSession, touchCustomerSession, serviceHeaders } from '../_lib/customer-session.js';
import { customerSafeProfile, customerSafeReviews } from './_lib/customer-safe-shape.js';
import { loadCustomerRetention } from './_lib/customer-retention.js';

export async function onRequestOptions() {
  return new Response('', { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env?.SUPABASE_URL) return response({ ok: false, authenticated: false, code: 'configuration_incomplete', error: 'Customer retention summary is temporarily unavailable.' }, 503);

    const current = await getCurrentCustomerSession({ env, request }).catch(() => null);
    if (!current?.customer_profile?.id) {
      return response({ ok: false, authenticated: false, code: 'not_authenticated', error: 'Sign in required to view account retention details.' }, 200);
    }

    await touchCustomerSession({ env, sessionId: current.session?.id || null, request });
    const headers = serviceHeaders(env);
    const profileId = current.customer_profile.id;
    const email = String(current.customer_profile.email || '').trim().toLowerCase();

    const [profileRes, reviewRes, bookingRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=*&id=eq.${encodeURIComponent(profileId)}&limit=1`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_reviews?select=*&customer_profile_id=eq.${encodeURIComponent(profileId)}&order=created_at.desc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,completed_at,detailing_completed_at,service_date,created_at&customer_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, { headers }).catch(() => null)
    ]);

    const profileRows = profileRes?.ok ? await profileRes.json().catch(() => []) : [];
    const profile = customerSafeProfile(Array.isArray(profileRows) ? profileRows[0] || current.customer_profile : current.customer_profile) || customerSafeProfile(current.customer_profile);
    const reviewRows = reviewRes?.ok ? await reviewRes.json().catch(() => []) : [];
    const reviews = customerSafeReviews(reviewRows);
    const bookings = bookingRes?.ok ? await bookingRes.json().catch(() => []) : [];

    const retention = await loadCustomerRetention({
      env,
      headers,
      email,
      profileId,
      profile,
      reviews,
      bookings: Array.isArray(bookings) ? bookings : []
    });

    return response({ ok: true, authenticated: true, retention });
  } catch (error) {
    return response({ ok: false, authenticated: true, code: 'retention_summary_unavailable', error: error?.message || 'Could not load customer retention details.' }, 200);
  }
}

export async function onRequestPost() {
  return response({ ok: false, error: 'Method not allowed.', allowed_methods: ['GET', 'OPTIONS'] }, 405);
}

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };
}
