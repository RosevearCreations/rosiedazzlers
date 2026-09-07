// Build 360 — deterministic CRM operational work-queue helpers.
// This module derives staff review candidates only. It does not infer outreach consent,
// send notifications, create bookings, mutate customer profiles, or assign a persistent score.

const ACTIONS = new Set(['reviewed', 'contacted', 'no_contact_needed']);
const PRIORITY_RANK = { high: 3, medium: 2, normal: 1 };

export const CRM_QUEUE_POLICY = Object.freeze({
  recent_service_followup_days: 7,
  reengagement_after_days: 120,
  high_priority_reengagement_days: 180,
  high_priority_maintenance_overdue_days: 30,
  resolved_hold_days: 30
});

export function normalizeCrmQueueAction(input = {}) {
  const body = input && typeof input === 'object' ? input : {};
  const allowed = new Set(['customer_profile_id', 'action', 'note', 'manual_contact_confirmed']);
  const unknown = Object.keys(body).find((key) => !allowed.has(key));
  if (unknown) return { ok:false, error:`Unsupported CRM queue field: ${unknown}.` };

  const customerProfileId = cleanText(body.customer_profile_id, 80);
  if (!isUuid(customerProfileId)) return { ok:false, error:'A valid customer_profile_id is required.' };
  const action = cleanText(body.action, 40).toLowerCase();
  if (!ACTIONS.has(action)) return { ok:false, error:'Choose a supported CRM queue action.' };
  const note = cleanText(body.note, 300) || null;
  const manualContactConfirmed = body.manual_contact_confirmed === true || String(body.manual_contact_confirmed || '').toLowerCase() === 'true';
  if (action === 'contacted' && !manualContactConfirmed) {
    return { ok:false, error:'Confirm that staff already completed the contact before recording it.' };
  }
  return { ok:true, customer_profile_id:customerProfileId, action, note, manual_contact_confirmed:manualContactConfirmed };
}

export function deriveCrmOperationalQueue({ profiles = [], bookings = [], vehicles = [], auditEvents = [], now = new Date(), policy = CRM_QUEUE_POLICY } = {}) {
  const clock = validDate(now) || new Date();
  const profileRows = safeRows(profiles).filter((row) => row?.is_active === true && !row?.archived_at && isUuid(row?.id));
  const bookingMap = groupByCustomer(bookings, 'customer_profile_id');
  const vehicleMap = groupByCustomer(vehicles, 'customer_profile_id');
  const auditMap = latestQueueAuditByCustomer(auditEvents);
  const items = [];

  for (const profile of profileRows) {
    const customerId = String(profile.id);
    const customerBookings = bookingMap.get(customerId) || [];
    const customerVehicles = vehicleMap.get(customerId) || [];
    const completed = customerBookings.filter(isCompletedBooking).sort((a, b) => timestamp(a?.completed_at || a?.service_date || a?.created_at) - timestamp(b?.completed_at || b?.service_date || b?.created_at));
    const open = customerBookings.filter(isOpenBooking);
    const lastCompleted = completed[completed.length - 1] || null;
    const lastCompletedAt = validDate(lastCompleted?.completed_at || lastCompleted?.service_date || lastCompleted?.created_at);
    const reasons = [];

    const overdueVehicles = customerVehicles
      .map((row) => ({ row, due:validDate(row?.next_cleaning_due_at) }))
      .filter((item) => item.due && item.due.getTime() <= clock.getTime())
      .sort((a, b) => a.due - b.due);
    if (overdueVehicles.length) {
      const oldestDue = overdueVehicles[0].due;
      const overdueDays = wholeDaysBetween(oldestDue, clock);
      reasons.push({
        code:'maintenance_due',
        label:'Maintenance due',
        priority:overdueDays >= policy.high_priority_maintenance_overdue_days ? 'high' : 'medium',
        trigger_at:oldestDue.toISOString(),
        detail:`${overdueVehicles.length} saved vehicle${overdueVehicles.length === 1 ? '' : 's'} due for planned cleaning; oldest is ${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue.`
      });
    }

    if (lastCompletedAt && open.length === 0) {
      const daysSince = wholeDaysBetween(lastCompletedAt, clock);
      if (daysSince >= 1 && daysSince <= policy.recent_service_followup_days) {
        reasons.push({
          code:'recent_service_followup',
          label:'Recent-service follow-up',
          priority:'normal',
          trigger_at:lastCompletedAt.toISOString(),
          detail:`Completed service ${daysSince} day${daysSince === 1 ? '' : 's'} ago; internal follow-up review is due.`
        });
      }
      if (daysSince >= policy.reengagement_after_days) {
        reasons.push({
          code:'reengagement_due',
          label:'Re-engagement review',
          priority:daysSince >= policy.high_priority_reengagement_days ? 'high' : 'medium',
          trigger_at:lastCompletedAt.toISOString(),
          detail:`No open booking and last completed service was ${daysSince} days ago.`
        });
      }
    }

    if (!reasons.length) continue;
    const latestAudit = auditMap.get(customerId) || null;
    const newestSignalAt = reasons.reduce((latest, reason) => Math.max(latest, timestamp(reason.trigger_at)), 0);
    const latestAuditAt = timestamp(latestAudit?.created_at);
    const auditAgeDays = latestAuditAt ? wholeDaysBetween(new Date(latestAuditAt), clock) : null;
    const signalChangedAfterAudit = newestSignalAt > latestAuditAt;
    const recentlyResolved = Boolean(latestAuditAt && !signalChangedAfterAudit && auditAgeDays !== null && auditAgeDays < policy.resolved_hold_days);
    if (recentlyResolved) continue;

    const priority = reasons.reduce((best, reason) => PRIORITY_RANK[reason.priority] > PRIORITY_RANK[best] ? reason.priority : best, 'normal');
    const dueAt = reasons.map((reason) => validDate(reason.trigger_at)).filter(Boolean).sort((a, b) => a - b)[0] || null;
    items.push({
      customer_profile_id:customerId,
      full_name:profile.full_name || null,
      email:profile.email || null,
      phone:profile.phone || null,
      sms_phone:profile.sms_phone || null,
      tier_code:profile.tier_code || null,
      priority,
      due_at:dueAt?.toISOString() || null,
      reasons,
      completed_service_count:completed.length,
      last_completed_service:lastCompleted ? serviceSnapshot(lastCompleted) : null,
      open_booking_count:open.length,
      saved_vehicle_count:customerVehicles.length,
      maintenance_due_vehicle_count:overdueVehicles.length,
      contact_context:{
        notification_opt_in:profile.notification_opt_in === true,
        notification_channel:profile.notification_channel || null,
        outreach_consent:null,
        outreach_consent_rule:'not_inferred_from_notification_preferences',
        automatic_send_allowed:false
      },
      latest_queue_action:latestAudit ? auditSnapshot(latestAudit) : null
    });
  }

  items.sort((a, b) => {
    const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (priorityDiff) return priorityDiff;
    const dueDiff = timestamp(a.due_at) - timestamp(b.due_at);
    if (dueDiff) return dueDiff;
    return String(a.full_name || a.email || a.customer_profile_id).localeCompare(String(b.full_name || b.email || b.customer_profile_id));
  });
  return items;
}

export function crmQueueMetrics(items = []) {
  const rows = safeRows(items);
  return {
    total:rows.length,
    high_priority:rows.filter((row) => row?.priority === 'high').length,
    maintenance_due:rows.filter((row) => safeRows(row?.reasons).some((reason) => reason?.code === 'maintenance_due')).length,
    recent_service_followup:rows.filter((row) => safeRows(row?.reasons).some((reason) => reason?.code === 'recent_service_followup')).length,
    reengagement_due:rows.filter((row) => safeRows(row?.reasons).some((reason) => reason?.code === 'reengagement_due')).length
  };
}

export function crmQueueActions() { return [...ACTIONS]; }

export function queueAuditEventType(action) {
  if (!ACTIONS.has(action)) throw new Error('Unsupported CRM queue action.');
  return `crm_queue_${action}`;
}

export function queueAuditSummary(action, note = null) {
  const label = action === 'contacted' ? 'Staff recorded a completed manual CRM contact.' : action === 'no_contact_needed' ? 'Staff marked the CRM candidate as no contact needed.' : 'Staff reviewed the CRM candidate.';
  const safeNote = cleanText(note, 300);
  return safeNote ? `${label} Note: ${safeNote}`.slice(0, 500) : label;
}

function groupByCustomer(rows, field) {
  const map = new Map();
  for (const row of safeRows(rows)) {
    const id = String(row?.[field] || '').trim();
    if (!isUuid(id)) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(row);
  }
  return map;
}

function latestQueueAuditByCustomer(rows) {
  const map = new Map();
  for (const row of safeRows(rows).sort((a, b) => timestamp(b?.created_at) - timestamp(a?.created_at))) {
    const id = String(row?.customer_profile_id || '').trim();
    if (!isUuid(id) || map.has(id) || !/^crm_queue_(reviewed|contacted|no_contact_needed)$/.test(String(row?.event_type || ''))) continue;
    map.set(id, row);
  }
  return map;
}

function normalizedStatuses(row) { return [row?.status, row?.job_status].map((value) => cleanText(value, 60).toLowerCase()); }
function isCompletedBooking(row) { return Boolean(row?.completed_at) && normalizedStatuses(row).includes('completed'); }
function isOpenBooking(row) {
  const statuses = normalizedStatuses(row);
  return !statuses.includes('cancelled') && !statuses.includes('completed');
}
function serviceSnapshot(row) { return { booking_id:row?.id || null, service_date:row?.service_date || null, completed_at:row?.completed_at || null, price_total_cents:Number(row?.price_total_cents || 0) }; }
function auditSnapshot(row) { return { action:String(row?.event_type || '').replace(/^crm_queue_/, '') || null, created_at:row?.created_at || null, safe_summary:row?.safe_summary || null }; }
function safeRows(value) { return Array.isArray(value) ? value : []; }
function timestamp(value) { const date = validDate(value); return date ? date.getTime() : 0; }
function validDate(value) { const date = value instanceof Date ? value : new Date(value || ''); return Number.isNaN(date.getTime()) ? null : date; }
function wholeDaysBetween(start, end) { return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000)); }
function cleanText(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim()); }
