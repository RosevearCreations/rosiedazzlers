// Exact canonical assignment gate for Build 745 mutations. No name matching.
import { serviceHeaders, isUuid } from './staff-auth.js';

export function directlyAssigned745(actor,booking) {
  if (!actor || !booking) return false;
  const id=String(actor.id||'').trim();
  const email=String(actor.email||'').trim().toLowerCase();
  return Boolean((id && id===String(booking.assigned_staff_user_id||'').trim()) ||
    (email && email===String(booking.assigned_staff_email||'').trim().toLowerCase()));
}

export async function canWorkMobileBooking745({env,actor,booking}) {
  if (actor?.is_admin || actor?.can_manage_bookings) return true;
  if (!actor?.is_detailer && !actor?.is_senior_detailer) return false;
  if (directlyAssigned745(actor,booking)) return true;
  const ids=[];
  if (isUuid(actor.id)) ids.push(`staff_user_id.eq.${encodeURIComponent(actor.id)}`);
  if (actor.email) ids.push(`staff_email.eq.${encodeURIComponent(String(actor.email).trim().toLowerCase())}`);
  if (!ids.length || !isUuid(booking?.id)) return false;
  try {
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_staff_assignments?select=booking_id&booking_id=eq.${booking.id}&or=(${ids.join(',')})&limit=1`,
      {headers:serviceHeaders(env)});
    if (!res.ok) return false;
    const rows=await res.json().catch(()=>[]);
    return Array.isArray(rows)&&rows.some(row=>row.booking_id===booking.id);
  } catch {return false;}
}
