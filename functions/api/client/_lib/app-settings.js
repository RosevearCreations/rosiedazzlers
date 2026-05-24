export * from '../../_lib/app-settings.js';

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || '';
}
