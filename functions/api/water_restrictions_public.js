// File: /functions/api/water_restrictions_public.js
// Build 186: Public verified seasonal water-restriction fallback for service-area guidance.

const RULES = {
  updated_at: '2026-06-02',
  authority: 'build186_verified_static_fallback',
  rules: [
    {
      county: 'Oxford County',
      effective_dates: 'May 1 to September 30',
      rule_summary: 'Oxford County: restrictions are in effect May 1–September 30 under Oxford County By-law No. 4193-2002. Outdoor water use by hose or attachment, including washing vehicles and power washing, is allowed every other day by address parity: even-numbered addresses on even-numbered days and odd-numbered addresses on odd-numbered days. Allowed hours are residential 6:00–9:00 a.m. or 6:00–9:00 p.m.; commercial/industrial 8:00–10:00 a.m. or 3:00–5:00 p.m. Confirm the current municipal/county notice before dispatch.',
      address_rule: 'Even-numbered addresses on even-numbered days; odd-numbered addresses on odd-numbered days.',
      residential_hours: '6:00–9:00 a.m. or 6:00–9:00 p.m.',
      commercial_industrial_hours: '8:00–10:00 a.m. or 3:00–5:00 p.m.',
      source_urls: [
        'https://www.tillsonburg.ca/living-here/water-and-wastewater/water-restrictions/',
        'https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/'
      ]
    },
    {
      county: 'Norfolk County',
      effective_dates: 'May 15 to September 15',
      rule_summary: 'Norfolk County: seasonal watering restrictions run May 15–September 15 under the Water Restriction By-law. Outdoor water use is allowed only 9:00–11:00 a.m. and 7:00–10:00 p.m.; odd-numbered houses water on odd calendar days and even-numbered houses water on even calendar days. Newly planted sod is exempt for the first 24 hours when proof of installation date can be provided. Confirm the current County notice before dispatch.',
      address_rule: 'Odd-numbered houses on odd calendar days; even-numbered houses on even calendar days.',
      allowed_hours: '9:00–11:00 a.m. and 7:00–10:00 p.m.',
      source_urls: [
        'https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/'
      ]
    }
  ],
  operational_note: 'These are public guidance reminders, not legal advice. Staff should confirm the current municipal/county notice and any temporary stricter restriction before dispatch.'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=900'
    }
  });
}

function clean(value) {
  return String(value || '').trim().toLowerCase();
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const county = clean(url.searchParams.get('county'));
  const rules = county
    ? RULES.rules.filter((rule) => clean(rule.county) === county || clean(rule.county).includes(county))
    : RULES.rules;

  return json({
    ok: true,
    updated_at: RULES.updated_at,
    authority: RULES.authority,
    rules,
    summary: {
      rule_count: rules.length,
      filter_county: county || null,
      source_count: RULES.rules.reduce((count, rule) => count + (Array.isArray(rule.source_urls) ? rule.source_urls.length : 0), 0)
    },
    operational_note: RULES.operational_note
  });
}
