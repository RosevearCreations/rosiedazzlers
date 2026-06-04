// File: /functions/api/water_restrictions_public.js
// Build 187: Public verified seasonal water-restriction fallback for service-area and local-page guidance.

const RULES = {
  "updated_at": "2026-06-03",
  "build": "187",
  "purpose": "Verified local-page outdoor water-use restrictions for Rosie Dazzlers town landing pages, booking fallbacks, Admin App review, and local SEO content.",
  "rules": [
    {
      "county": "Oxford County",
      "effective_dates": "May 1 to September 30",
      "rule_summary": "Oxford County outdoor water-use reminder: May 1 to September 30, outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity. Even-numbered addresses use even-numbered days; odd-numbered addresses use odd-numbered days. Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.; commercial/industrial windows are 8:00–10:00 a.m. or 3:00–5:00 p.m. Confirm current municipal/county notices before exterior work.",
      "address_rule": "Even-numbered addresses on even-numbered days; odd-numbered addresses on odd-numbered days.",
      "residential_hours": [
        "6:00 a.m. to 9:00 a.m.",
        "6:00 p.m. to 9:00 p.m."
      ],
      "commercial_industrial_hours": [
        "8:00 a.m. to 10:00 a.m.",
        "3:00 p.m. to 5:00 p.m."
      ],
      "applies_to": "Outdoor water use by hose or attachment, including vehicle washing and power washing.",
      "verified_sources": [
        {
          "label": "Town of Tillsonburg water restrictions",
          "url": "https://www.tillsonburg.ca/living-here/water-and-wastewater/water-restrictions/"
        },
        {
          "label": "Oxford County water conservation",
          "url": "https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/"
        },
        {
          "label": "City of Woodstock watering restrictions",
          "url": "https://www.cityofwoodstock.ca/living-in-woodstock/water-and-utilities/water/watering-restrictions-and-conservation/"
        }
      ],
      "local_pages": [
        "tillsonburg-auto-detailing",
        "woodstock-ingersoll-auto-detailing",
        "norwich-otterville-auto-detailing",
        "zorra-thamesford-embro-auto-detailing"
      ],
      "towns": [
        "Embro",
        "Ingersoll",
        "Norwich",
        "Otterville",
        "Thamesford",
        "Tillsonburg",
        "Woodstock",
        "Zorra"
      ]
    },
    {
      "county": "Norfolk County",
      "effective_dates": "May 15 to September 15",
      "rule_summary": "Norfolk County outdoor water-use reminder: May 15 to September 15, outdoor water use is allowed only 9:00–11:00 a.m. and 7:00–10:00 p.m.; odd-numbered houses use odd calendar days and even-numbered houses use even calendar days. Confirm current County notices before exterior work.",
      "address_rule": "Odd-numbered houses on odd calendar days; even-numbered houses on even calendar days.",
      "residential_hours": [
        "9:00 a.m. to 11:00 a.m.",
        "7:00 p.m. to 10:00 p.m."
      ],
      "commercial_industrial_hours": [],
      "applies_to": "Outdoor water use under Norfolk County's seasonal watering restriction by-law.",
      "verified_sources": [
        {
          "label": "Norfolk County watering restrictions",
          "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/"
        }
      ],
      "local_pages": [
        "simcoe-delhi-auto-detailing",
        "port-dover-auto-detailing",
        "waterford-vittoria-auto-detailing",
        "port-rowan-turkey-point-auto-detailing"
      ],
      "towns": [
        "Delhi",
        "Port Dover",
        "Port Rowan",
        "Simcoe",
        "Turkey Point",
        "Vittoria",
        "Waterford"
      ]
    }
  ],
  "local_page_rules": {
    "tillsonburg-auto-detailing": {
      "county": "Oxford County",
      "towns": [
        "Tillsonburg"
      ],
      "rule_summary": "Oxford County outdoor water-use reminder: May 1 to September 30, outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity. Even-numbered addresses use even-numbered days; odd-numbered addresses use odd-numbered days. Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.; commercial/industrial windows are 8:00–10:00 a.m. or 3:00–5:00 p.m. Confirm current municipal/county notices before exterior work.",
      "source_summary": "Verified from Town of Tillsonburg and Oxford County water-conservation notices.",
      "sources": [
        {
          "label": "Town of Tillsonburg water restrictions",
          "url": "https://www.tillsonburg.ca/living-here/water-and-wastewater/water-restrictions/"
        },
        {
          "label": "Oxford County water conservation",
          "url": "https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/"
        }
      ]
    },
    "woodstock-ingersoll-auto-detailing": {
      "county": "Oxford County",
      "towns": [
        "Woodstock",
        "Ingersoll"
      ],
      "rule_summary": "Woodstock/Ingersoll Oxford County outdoor water-use reminder: May 1 to September 30, outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity. Even-numbered addresses use even-numbered days; odd-numbered addresses use odd-numbered days. Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.; commercial/industrial windows are 8:00–10:00 a.m. or 3:00–5:00 p.m. Confirm current municipal/county notices before exterior work.",
      "source_summary": "Verified from Oxford County and City of Woodstock water-use notices.",
      "sources": [
        {
          "label": "Oxford County water conservation",
          "url": "https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/"
        },
        {
          "label": "City of Woodstock watering restrictions",
          "url": "https://www.cityofwoodstock.ca/living-in-woodstock/water-and-utilities/water/watering-restrictions-and-conservation/"
        }
      ]
    },
    "norwich-otterville-auto-detailing": {
      "county": "Oxford County",
      "towns": [
        "Norwich",
        "Otterville"
      ],
      "rule_summary": "Norwich/Otterville Oxford County outdoor water-use reminder: May 1 to September 30, outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity. Even-numbered addresses use even-numbered days; odd-numbered addresses use odd-numbered days. Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.; commercial/industrial windows are 8:00–10:00 a.m. or 3:00–5:00 p.m. Confirm current municipal/county notices before exterior work.",
      "source_summary": "Verified from Oxford County water-conservation notice.",
      "sources": [
        {
          "label": "Oxford County water conservation",
          "url": "https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/"
        }
      ]
    },
    "zorra-thamesford-embro-auto-detailing": {
      "county": "Oxford County",
      "towns": [
        "Zorra",
        "Thamesford",
        "Embro"
      ],
      "rule_summary": "Zorra/Thamesford/Embro Oxford County outdoor water-use reminder: May 1 to September 30, outdoor water use by hose or attachment, including vehicle washing and power washing, follows address parity. Even-numbered addresses use even-numbered days; odd-numbered addresses use odd-numbered days. Residential windows are 6:00–9:00 a.m. or 6:00–9:00 p.m.; commercial/industrial windows are 8:00–10:00 a.m. or 3:00–5:00 p.m. Confirm current municipal/county notices before exterior work.",
      "source_summary": "Verified from Oxford County water-conservation notice.",
      "sources": [
        {
          "label": "Oxford County water conservation",
          "url": "https://www.oxfordcounty.ca/services-for-you/water-and-wastewater/drinking-water/water-conservation/"
        }
      ]
    },
    "simcoe-delhi-auto-detailing": {
      "county": "Norfolk County",
      "towns": [
        "Simcoe",
        "Delhi"
      ],
      "rule_summary": "Simcoe/Delhi Norfolk County outdoor water-use reminder: May 15 to September 15, outdoor water use is allowed only 9:00–11:00 a.m. and 7:00–10:00 p.m.; odd-numbered houses use odd calendar days and even-numbered houses use even calendar days. Confirm current County notices before exterior work.",
      "source_summary": "Verified from Norfolk County watering restrictions.",
      "sources": [
        {
          "label": "Norfolk County watering restrictions",
          "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/"
        }
      ]
    },
    "port-dover-auto-detailing": {
      "county": "Norfolk County",
      "towns": [
        "Port Dover"
      ],
      "rule_summary": "Port Dover Norfolk County outdoor water-use reminder: May 15 to September 15, outdoor water use is allowed only 9:00–11:00 a.m. and 7:00–10:00 p.m.; odd-numbered houses use odd calendar days and even-numbered houses use even calendar days. Confirm current County notices before exterior work.",
      "source_summary": "Verified from Norfolk County watering restrictions.",
      "sources": [
        {
          "label": "Norfolk County watering restrictions",
          "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/"
        }
      ]
    },
    "waterford-vittoria-auto-detailing": {
      "county": "Norfolk County",
      "towns": [
        "Waterford",
        "Vittoria"
      ],
      "rule_summary": "Waterford/Vittoria Norfolk County outdoor water-use reminder: May 15 to September 15, outdoor water use is allowed only 9:00–11:00 a.m. and 7:00–10:00 p.m.; odd-numbered houses use odd calendar days and even-numbered houses use even calendar days. Confirm current County notices before exterior work.",
      "source_summary": "Verified from Norfolk County watering restrictions.",
      "sources": [
        {
          "label": "Norfolk County watering restrictions",
          "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/"
        }
      ]
    },
    "port-rowan-turkey-point-auto-detailing": {
      "county": "Norfolk County",
      "towns": [
        "Port Rowan",
        "Turkey Point"
      ],
      "rule_summary": "Port Rowan/Turkey Point Norfolk County outdoor water-use reminder: May 15 to September 15, outdoor water use is allowed only 9:00–11:00 a.m. and 7:00–10:00 p.m.; odd-numbered houses use odd calendar days and even-numbered houses use even calendar days. Confirm current County notices before exterior work.",
      "source_summary": "Verified from Norfolk County watering restrictions.",
      "sources": [
        {
          "label": "Norfolk County watering restrictions",
          "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/"
        }
      ]
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600'
    }
  });
}

function clean(value) {
  return String(value || '').trim().toLowerCase();
}

function findRuleForQuery(query) {
  const q = clean(query);
  if (!q) return null;
  for (const [slug, pageRule] of Object.entries(RULES.local_page_rules || {})) {
    const matchSlug = clean(slug).includes(q) || q.includes(clean(slug));
    const matchTown = (pageRule.towns || []).some((town) => clean(town) === q || q.includes(clean(town)));
    if (matchSlug || matchTown) return { slug, ...pageRule };
  }
  return (RULES.rules || []).find((rule) => clean(rule.county) === q || q.includes(clean(rule.county))) || null;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const town = url.searchParams.get('town') || url.searchParams.get('municipality') || '';
  const slug = url.searchParams.get('slug') || '';
  const county = url.searchParams.get('county') || '';
  const match = findRuleForQuery(slug || town || county);

  return json({
    ok: true,
    authority: 'build187_verified_static_fallback',
    updated_at: RULES.updated_at,
    build: RULES.build,
    requested: { town, slug, county },
    match,
    rules: RULES.rules,
    local_page_rules: RULES.local_page_rules,
    note: 'Use this endpoint as the public fallback for local page, booking, and dispatch water-use reminders. Staff should still confirm current municipal/county notices before exterior work.'
  });
}
