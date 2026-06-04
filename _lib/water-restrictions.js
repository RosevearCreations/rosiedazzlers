// File: /_lib/water-restrictions.js
// Build 188: shared editable water-restriction loader and applicator.
// Mutable municipal rule text belongs in public.water_restriction_rules,
// app_management_settings.water_restriction_rules, or data/water_restriction_rules.json.

import { serviceHeaders } from "./staff-auth.js";

export async function loadEditableWaterRestrictionRules(env, fallbackPayload = {}) {
  const fallback = normalizeWaterRestrictionPayload(fallbackPayload, "bundled_json_fallback");

  if (!env?.SUPABASE_URL || !hasServiceKey(env)) {
    return fallback;
  }

  const tablePayload = await readTablePayload(env, fallback);
  if (tablePayload.rules.length) {
    return tablePayload;
  }

  const settingPayload = await readSettingPayload(env, fallback);
  if (settingPayload.rules.length) {
    return settingPayload;
  }

  return fallback;
}

export function normalizeWaterRestrictionPayload(value, sourceStatus = "unknown") {
  const src = value && typeof value === "object" ? value : {};
  const rules = normalizeRuleRows(src.rules || src.items || []);
  const localPageRules = normalizeLocalPageRules(src.local_page_rules || src.localPageRules || {});

  return {
    updated_at: clean(src.updated_at || src.updatedAt),
    version: clean(src.version || src.build),
    source_status: clean(src.source_status || sourceStatus) || sourceStatus,
    authority_order: normalizeStringArray(src.authority_order),
    purpose: clean(src.purpose),
    fallback_behavior: clean(src.fallback_behavior),
    review_policy: clean(src.review_policy),
    rules,
    local_page_rules: localPageRules
  };
}

export function applyWaterRestrictionRulesToLandingPages(payload, waterPayload) {
  if (!payload || !payload.pages || typeof payload.pages !== "object") {
    return payload;
  }

  const water = normalizeWaterRestrictionPayload(waterPayload, waterPayload?.source_status || "unknown");
  const localPageRules = buildLocalPageRuleMap(water);

  for (const [slug, pageRule] of Object.entries(localPageRules)) {
    const page = payload.pages[slug];
    if (!page) continue;

    const note = clean(pageRule.rule_summary || pageRule.note);
    const sources = normalizeLinks(pageRule.sources || pageRule.verified_sources || []);

    if (note) {
      page.water_restriction_note = note;
      const currentThings = Array.isArray(page.things_to_know) ? page.things_to_know : [];
      const filteredThings = currentThings.filter((item) => !looksLikeWaterRestrictionText(item));
      page.things_to_know = [note, ...filteredThings].filter(Boolean).slice(0, 8);
    }

    if (sources.length) {
      page.water_restriction_sources = mergeLinks(page.water_restriction_sources, sources);
      page.official_links = mergeLinks(page.official_links, sources);
    }
  }

  payload.water_restriction_authority = {
    source_status: water.source_status,
    updated_at: water.updated_at || null,
    version: water.version || null,
    note: "Water-use wording is loaded from editable DB/app-setting data with a bundled JSON fallback; mutable municipal rules are not stored in landing-page JavaScript."
  };

  return payload;
}

export function enrichServiceAreaRowsWithWaterRules(rows, waterPayload) {
  const water = normalizeWaterRestrictionPayload(waterPayload, waterPayload?.source_status || "unknown");
  const rules = water.rules;
  const byKey = new Map(rules.map((rule) => [clean(rule.key).toLowerCase(), rule]).filter(([key]) => key));
  const byCounty = new Map(rules.map((rule) => [clean(rule.county).toLowerCase(), rule]).filter(([key]) => key));

  return (Array.isArray(rows) ? rows : []).map((input) => {
    const row = input && typeof input === "object" ? { ...input } : {};
    const ruleKey = clean(row.water_rule_key).toLowerCase();
    const county = clean(row.county).toLowerCase();
    const municipality = clean(row.municipality || row.town).toLowerCase();

    let rule = ruleKey ? byKey.get(ruleKey) : null;
    if (!rule && county) rule = byCounty.get(county) || null;
    if (!rule && municipality) {
      rule = rules.find((candidate) =>
        (candidate.towns || []).some((town) => clean(town).toLowerCase() === municipality)
      ) || null;
    }

    if (!rule) return row;

    return {
      ...row,
      water_rule_key: rule.key || row.water_rule_key || null,
      water_rule: rule.rule_summary || row.water_rule || null,
      official_links: mergeLinks(row.official_links, rule.verified_sources),
      water_rule_source_status: water.source_status,
      water_rule_updated_at: water.updated_at || null
    };
  });
}

export function findWaterRestrictionRule(waterPayload, query) {
  const water = normalizeWaterRestrictionPayload(waterPayload, waterPayload?.source_status || "unknown");
  const q = clean(query).toLowerCase();
  if (!q) return null;

  const localPageRules = buildLocalPageRuleMap(water);
  for (const [slug, pageRule] of Object.entries(localPageRules)) {
    const matchSlug = slug.toLowerCase().includes(q) || q.includes(slug.toLowerCase());
    const matchTown = (pageRule.towns || []).some((town) => {
      const name = clean(town).toLowerCase();
      return name && (name === q || q.includes(name));
    });
    if (matchSlug || matchTown) return { slug, ...pageRule };
  }

  return water.rules.find((rule) => {
    const county = clean(rule.county).toLowerCase();
    const key = clean(rule.key).toLowerCase();
    return county === q || q.includes(county) || key === q || q.includes(key);
  }) || null;
}

export function buildLocalPageRuleMap(waterPayload) {
  const water = normalizeWaterRestrictionPayload(waterPayload, waterPayload?.source_status || "unknown");
  const map = { ...water.local_page_rules };

  for (const rule of water.rules) {
    const pageSlugs = normalizeStringArray(rule.local_pages || rule.local_page_slugs);
    for (const slug of pageSlugs) {
      if (!slug || map[slug]) continue;
      map[slug] = {
        rule_key: rule.key || null,
        county: rule.county || null,
        towns: rule.towns || [],
        rule_summary: rule.rule_summary || "",
        source_summary: rule.source_summary || "",
        sources: rule.verified_sources || []
      };
    }
  }

  return map;
}

async function readTablePayload(env, fallback) {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/water_restriction_rules?select=*&is_active=eq.true&order=sort_order.asc,county.asc`,
      { headers: serviceHeaders(env) }
    );
    if (!res.ok) return normalizeWaterRestrictionPayload({}, "water_restriction_rules_table_unavailable");

    const rows = await res.json().catch(() => []);
    const rules = normalizeRuleRows(rows);
    if (!rules.length) return normalizeWaterRestrictionPayload({}, "water_restriction_rules_table_empty");

    return {
      ...fallback,
      updated_at: latestUpdatedAt(rows) || fallback.updated_at,
      version: latestVersion(rows) || fallback.version,
      source_status: "water_restriction_rules_table",
      rules,
      local_page_rules: mergeLocalPageRules(fallback.local_page_rules, buildLocalPageRulesFromTableRows(rules))
    };
  } catch {
    return normalizeWaterRestrictionPayload({}, "water_restriction_rules_table_error");
  }
}

async function readSettingPayload(env, fallback) {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.water_restriction_rules&limit=1`,
      { headers: serviceHeaders(env) }
    );
    if (!res.ok) return normalizeWaterRestrictionPayload({}, "app_management_settings.water_restriction_rules_unavailable");

    const rows = await res.json().catch(() => []);
    const value = Array.isArray(rows) ? rows[0]?.value : null;
    const normalized = normalizeWaterRestrictionPayload(value, "app_management_settings.water_restriction_rules");
    if (!normalized.rules.length) return normalizeWaterRestrictionPayload({}, "app_management_settings.water_restriction_rules_empty");
    return normalized;
  } catch {
    return normalizeWaterRestrictionPayload({}, "app_management_settings.water_restriction_rules_error");
  }
}

function normalizeRuleRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && typeof row === "object")
    .map((row, index) => ({
      key: clean(row.key || row.rule_key || `water-rule-${index + 1}`),
      label: clean(row.label || row.name || row.county || `Water rule ${index + 1}`),
      county: clean(row.county),
      effective_dates: clean(row.effective_dates),
      effective_start: clean(row.effective_start),
      effective_end: clean(row.effective_end),
      rule_summary: clean(row.rule_summary || row.water_rule || row.note),
      address_rule: clean(row.address_rule),
      residential_hours: normalizeStringArray(row.residential_hours),
      commercial_industrial_hours: normalizeStringArray(row.commercial_industrial_hours),
      applies_to: clean(row.applies_to),
      verified_sources: normalizeLinks(row.verified_sources || row.sources || row.official_links),
      local_pages: normalizeStringArray(row.local_pages || row.local_page_slugs),
      towns: normalizeStringArray(row.towns),
      local_page_rules: normalizeLocalPageRules(row.local_page_rules || {}),
      source_summary: clean(row.source_summary),
      verified_at: clean(row.verified_at),
      next_review_at: clean(row.next_review_at),
      version: clean(row.version),
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
      is_active: row.is_active !== false
    }))
    .filter((row) => row.key || row.county || row.rule_summary);
}

function normalizeLocalPageRules(value) {
  const src = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = {};
  for (const [slug, row] of Object.entries(src)) {
    if (!slug || !row || typeof row !== "object") continue;
    out[slug] = {
      rule_key: clean(row.rule_key),
      county: clean(row.county),
      towns: normalizeStringArray(row.towns),
      rule_summary: clean(row.rule_summary || row.water_rule || row.note),
      source_summary: clean(row.source_summary),
      sources: normalizeLinks(row.sources || row.verified_sources || row.official_links)
    };
  }
  return out;
}

function buildLocalPageRulesFromTableRows(rules) {
  const out = {};
  for (const rule of rules) {
    for (const [slug, pageRule] of Object.entries(rule.local_page_rules || {})) {
      out[slug] = pageRule;
    }
    for (const slug of rule.local_pages || []) {
      if (!slug || out[slug]) continue;
      out[slug] = {
        rule_key: rule.key || "",
        county: rule.county || "",
        towns: rule.towns || [],
        rule_summary: rule.rule_summary || "",
        source_summary: rule.source_summary || "",
        sources: rule.verified_sources || []
      };
    }
  }
  return out;
}

function mergeLocalPageRules(base, override) {
  return { ...(base || {}), ...(override || {}) };
}

function mergeLinks(current, incoming) {
  const out = [];
  const seen = new Set();
  for (const row of [...normalizeLinks(current), ...normalizeLinks(incoming)]) {
    const key = row.url.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function normalizeLinks(value) {
  return (Array.isArray(value) ? value : [])
    .map((row) => ({
      label: clean(row?.label || row?.url || "Official source"),
      url: clean(row?.url)
    }))
    .filter((row) => row.url);
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n|,/).map(clean).filter(Boolean);
  return [];
}

function looksLikeWaterRestrictionText(value) {
  const text = clean(value).toLowerCase();
  if (!text.includes("water")) return false;
  return (
    text.includes("restriction") ||
    text.includes("watering") ||
    text.includes("hose") ||
    text.includes("outdoor") ||
    text.includes("address parity")
  );
}

function latestUpdatedAt(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => clean(row.updated_at || row.verified_at))
    .filter(Boolean)
    .sort()
    .pop() || "";
}

function latestVersion(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => clean(row.version))
    .filter(Boolean)
    .sort()
    .pop() || "";
}

function hasServiceKey(env) {
  return !!(
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_SERVICE_KEY ||
    env?.SUPABASE_SERVICE_ROLE ||
    env?.SUPABASE_SECRET_KEY
  );
}

function clean(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}
