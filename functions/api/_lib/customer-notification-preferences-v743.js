import { serviceHeaders } from './customer-session.js';
import { PREFERENCE_FIELDS743 } from '../../../assets/notification-consent-preview-v743.mjs';

// Null means no Build 743 override exists: service falls back to the existing
// profile preference, marketing remains unconsented. Read errors fail closed.
export async function loadLatestPreference743({ env, profileId }) {
  if (!env?.SUPABASE_URL || !profileId) throw new Error('Preference authority unavailable');
  const path = `customer_communication_preference_versions?select=id,recorded_at,${PREFERENCE_FIELDS743.join(',')}&customer_profile_id=eq.${encodeURIComponent(profileId)}&order=recorded_at.desc,id.desc&limit=1`;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error('Preference authority read failed');
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('Preference authority returned invalid rows');
  return rows[0] || null;
}
