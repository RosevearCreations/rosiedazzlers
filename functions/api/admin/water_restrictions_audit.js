// File: /functions/api/admin/water_restrictions_audit.js
// Build 187: Staff-only audit of service-area water-rule readiness with safe fallback.

import { requireStaffAccess } from './_lib/staff-auth.js';

const OXFORD_RULE_PHRASE = 'May 1–September 30 under Oxford County By-law No. 4193-2002';
const OXFORD_LOCAL_PAGE_PHRASE = 'Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.';
const NORFOLK_LOCAL_PAGE_PHRASE = '9:00–11:00 a.m. and 7:00–10:00 p.m.';
const NORFOLK_RULE_PHRASE = 'May 15–September 15 under the Water Restriction By-law';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function serviceHeaders(env) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE || env.SUPABASE_SECRET_KEY;
  if (!env.SUPABASE_URL || !key) return null;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

function expectedPhrase(county) {
  const normalized = String(county || '').toLowerCase();
  if (normalized.includes('oxford')) return OXFORD_RULE_PHRASE;
  if (normalized.includes('norfolk')) return NORFOLK_RULE_PHRASE;
  return '';
}

function auditRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const phrase = expectedPhrase(row?.county);
    const waterRule = String(row?.water_rule || '');
    const ok = phrase ? waterRule.includes(phrase) : false;
    return {
      id: row?.id || null,
      label: row?.label || row?.value || row?.municipality || 'Service area',
      county: row?.county || '',
      municipality: row?.municipality || '',
      water_rule_ok: ok,
      expected_phrase: phrase,
      water_rule: waterRule
    };
  });
}

export async function onRequestGet(context) {
  const gate = await requireStaffAccess({ request: context.request, env: context.env, capability: 'manage_app_settings', allowLegacyAdminFallback: true });
  if (!gate.ok) return gate.response;

  const headers = serviceHeaders(context.env || {});
  if (!headers) {
    return json({
      ok: true,
      degraded: true,
      authority: 'no_supabase_config',
      message: 'Supabase is not configured. Use bundled data/service_area_rules.json and /api/water_restrictions_public as the current fallback.',
      rows: []
    });
  }

  const base = String(context.env.SUPABASE_URL || '').replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/rest/v1/service_area_rules?select=id,label,value,county,municipality,water_rule&order=county.asc,label.asc&limit=500`, { headers });
    if (!res.ok) throw new Error(`service_area_rules ${res.status}`);
    const rows = await res.json();
    const audited = auditRows(rows);
    const failed = audited.filter((row) => !row.water_rule_ok);
    return json({
      ok: true,
      authority: 'service_area_rules_table',
      rows: audited,
      summary: { checked: audited.length, passed: audited.length - failed.length, failed: failed.length }
    });
  } catch (error) {
    return json({
      ok: true,
      degraded: true,
      authority: 'fallback_audit_unavailable',
      message: error?.message || 'Could not audit service_area_rules.',
      rows: [],
      summary: { checked: 0, passed: 0, failed: 0 }
    });
  }
}
