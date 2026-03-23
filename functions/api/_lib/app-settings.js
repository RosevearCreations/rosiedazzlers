// functions/api/_lib/app-settings.js
// Shared app-management settings loader with safe defaults.

export const DEFAULT_APP_SETTINGS = {
  visibility_matrix: {
    customer_detailer_notes: true,
    customer_admin_notes_admin_only: true,
    detailer_admin_notes_admin_only: true
  },
  manual_scheduling_rules: {
    manual_schedule_admin_only: true,
    blocking_admin_only: true,
    notes: ''
  },
  feature_flags: {
    live_updates_default: false,
    customer_chat_enabled: true,
    picture_first_observations: true,
    tier_discount_badges: true,
    image_annotations_enabled: true,
    annotation_lightbox_enabled: true,
    annotation_thread_replies_enabled: true,
    notifications_retry_enabled: true,
  catalog_management_enabled: true,
  analytics_journeys_enabled: true,
  abandoned_recovery_enabled: true,
  seo_structured_data_enabled: true,
    analytics_tracking_enabled: true
  }
};

export async function loadAppSettings(env, keys = ['visibility_matrix','manual_scheduling_rules','feature_flags']) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return structuredClone(DEFAULT_APP_SETTINGS);
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
  const out = structuredClone(DEFAULT_APP_SETTINGS);
  for (const key of keys) {
    try {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=eq.${encodeURIComponent(key)}&limit=1`, { headers });
      if (!res.ok) continue;
      const rows = await res.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;
      if (row && row.value && typeof row.value === 'object') out[key] = { ...(out[key] || {}), ...row.value };
    } catch {}
  }
  return out;
}

export async function loadFeatureFlags(env) {
  const settings = await loadAppSettings(env, ['feature_flags']);
  return settings.feature_flags || structuredClone(DEFAULT_APP_SETTINGS.feature_flags);
}
