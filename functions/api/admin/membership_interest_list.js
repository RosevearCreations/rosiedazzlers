import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { loadMembershipPlanSettings, buildMembershipReminderCandidates } from "../_lib/membership-reminders.js";

const MAX_INTEREST_ROWS = 200;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: 'manage_staff',
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const limit = clampWhole(body.limit, 1, 50, 10);
    const interestLimit = clampWhole(body.interest_limit, 1, MAX_INTEREST_ROWS, 100);
    const settings = await loadMembershipPlanSettings(env);
    const [candidates, interestRequests] = await Promise.all([
      buildMembershipReminderCandidates(env, settings, {
        origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, ''),
        limit: Math.max(limit * 6, 60)
      }),
      fetchInterestRequests(env, interestLimit)
    ]);

    const reminderCandidates = candidates.slice(0, limit);
    const metrics = buildMetrics(interestRequests, reminderCandidates);
    const readiness = {
      interest_capture_enabled: settings?.waitlist_enabled !== false,
      maintenance_plan_enabled: settings?.enabled === true,
      reminder_engine_enabled: settings?.reminder_enabled === true,
      automatic_enrollment: false,
      recurring_billing: false,
      appointment_creation: false,
      interest_rows_truncated: interestRequests.length >= interestLimit
    };

    return withCors(json({
      ok: true,
      interest_requests: interestRequests,
      reminder_candidates: reminderCandidates,
      requests: reminderCandidates,
      settings: {
        enabled: settings?.enabled === true,
        waitlist_enabled: settings?.waitlist_enabled !== false,
        reminder_enabled: settings?.reminder_enabled === true,
        reminder_channel: String(settings?.reminder_channel || 'email'),
        plan_name: String(settings?.plan_name || 'Maintenance Plan Interest'),
        cycle_label: String(settings?.cycle_label || 'Cadence selected after service review')
      },
      metrics,
      readiness
    }));
  } catch (err) {
    console.error('Could not load maintenance retention readiness.', err);
    return withCors(json({ error: 'Could not load maintenance retention readiness.' }, 500));
  }
}

export async function onRequestGet(context) { return onRequestPost(context); }
export async function onRequestOptions() { return new Response('', { status: 204, headers: corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed(['GET','POST','OPTIONS'])); }

async function fetchInterestRequests(env, limit) {
  if (!env?.SUPABASE_URL) throw new Error('supabase_not_configured');
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?select=*&limit=${limit}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`membership_interest_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  if (!Array.isArray(rows)) return [];
  rows.sort((a, b) => sortStamp(b).localeCompare(sortStamp(a)));
  return rows;
}

function buildMetrics(interestRequests, candidates) {
  const counts = { new: 0, contacted: 0, interested: 0, scheduled: 0, converted: 0, closed: 0, unsubscribed: 0, other: 0 };
  for (const row of interestRequests) {
    const status = normalizeStatus(row?.status);
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
    else counts.other += 1;
  }
  return {
    waitlist_total: interestRequests.length,
    new_interest_count: counts.new,
    contacted_count: counts.contacted,
    interested_count: counts.interested,
    qualified_count: counts.interested,
    scheduled_count: counts.scheduled,
    converted_count: counts.converted,
    closed_count: counts.closed,
    unsubscribed_count: counts.unsubscribed,
    other_status_count: counts.other,
    reminder_candidate_count: candidates.length,
    due_reminder_count: candidates.filter((row) => row?.due === true).length
  };
}

function normalizeStatus(value) {
  const status = String(value || 'new').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (['new','contacted','interested','scheduled','converted','closed','unsubscribed'].includes(status)) return status;
  return status || 'new';
}

function sortStamp(row) {
  return String(row?.created_at || row?.updated_at || row?.submitted_at || '');
}

function clampWhole(value, min, max, fallback) {
  const parsed = Math.floor(Number(value ?? fallback));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, x-staff-email, x-staff-user-id',
    'Cache-Control': 'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
