// Build 172 public FAQ endpoint.
// Returns DB-managed FAQ rows when public_faq_entries exists, otherwise a safe static fallback.
import { serviceHeaders, json, cleanText } from "./_lib/staff-auth.js";

const STATIC_FAQS = [
  {
    "category": "Booking and service area",
    "question": "Where does Rosie Dazzlers provide mobile auto detailing?",
    "answer": "Rosie Dazzlers serves Oxford County and Norfolk County, Ontario, with strongest public pages for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Norwich, Otterville, Waterford, Vittoria, Port Rowan, Turkey Point, Zorra, Thamesford, and Embro. Final availability still depends on schedule, driveway access, travel time, and weather.",
    "cta_label": "Check booking availability",
    "cta_href": "/book"
  },
  {
    "category": "Booking and service area",
    "question": "Do we need a driveway, water, and power?",
    "answer": "Yes. The standard mobile setup assumes a safe driveway or private parking area, customer-provided water, and customer-provided power. If water or power is not available, staff must review options before confirming the job because timing, equipment, and pricing may change.",
    "cta_label": "Read service details",
    "cta_href": "/services"
  },
  {
    "category": "Booking and service area",
    "question": "How far ahead can customers book?",
    "answer": "The booking flow is designed around the live availability window shown on the website. Weather, blocked days, service length, and one-vehicle-per-day planning can affect what is available.",
    "cta_label": "See live availability",
    "cta_href": "/pricing#booking-planner"
  },
  {
    "category": "Pricing and quotes",
    "question": "Why does final pricing depend on vehicle condition?",
    "answer": "Vehicle size, pet hair, salt buildup, staining, odour, heavy soil, work-truck use, paint condition, and add-ons can change the time and products needed. The site uses quote-safe language so customers understand that the final plan may need review before work starts.",
    "cta_label": "View pricing",
    "cta_href": "/pricing"
  },
  {
    "category": "Pricing and quotes",
    "question": "Should customers book directly or send photos first?",
    "answer": "Book directly when the package is clear. Send photos or links first when the vehicle has heavy pet hair, odour, salt, staining, paint correction questions, ceramic coating questions, work-truck buildup, or fleet/maintenance needs.",
    "cta_label": "Send photos for estimate",
    "cta_href": "/book?estimate=photos"
  },
  {
    "category": "Pricing and quotes",
    "question": "Are deposits required?",
    "answer": "Deposits are used to reserve booking times. Cancellation or rescheduling rules are covered in the site terms and booking flow so staff time and travel planning are protected.",
    "cta_label": "Read terms",
    "cta_href": "/terms"
  },
  {
    "category": "Services and add-ons",
    "question": "What is the difference between a standard interior detail and heavy interior work?",
    "answer": "A standard interior detail is for normal use and maintenance-level cleanup. Heavy interior work can include pet hair, salt, odour, staining, spills, work-truck buildup, or extra extraction time, and may require add-ons or a photo estimate.",
    "cta_label": "Compare services",
    "cta_href": "/services"
  },
  {
    "category": "Services and add-ons",
    "question": "Do ceramic coating, paint correction, and sealants need inspection?",
    "answer": "Yes. Paint condition, previous waxes or coatings, scratches, oxidation, and customer expectations should be reviewed before promising a result. The website uses dedicated pages for ceramic coating, paint correction, graphene finish, clay treatment, and paint sealant so customers can choose the right path.",
    "cta_label": "Open ceramic coating page",
    "cta_href": "/ceramic-coating"
  },
  {
    "category": "Services and add-ons",
    "question": "Can gift cards be used toward add-ons?",
    "answer": "Gift cards can usually be used toward eligible detailing services and add-ons, but final use depends on the booking, vehicle condition, and staff review.",
    "cta_label": "View gift cards",
    "cta_href": "/gift-cards"
  },
  {
    "category": "Fleet and maintenance",
    "question": "Do fleet or maintenance plans need a custom quote?",
    "answer": "Yes. Fleet and maintenance pricing depends on vehicle count, cadence, parking logistics, job location, vehicle condition, water/power access, and whether the first visit should be a paid test detail.",
    "cta_label": "Request fleet quote",
    "cta_href": "/fleet"
  },
  {
    "category": "Photos, privacy, and proof",
    "question": "Can customers upload photos or videos for an estimate?",
    "answer": "The quote-first path supports pasted photo/share links, and the direct upload foundation is available when the public upload environment variables and storage bucket are enabled. Staff review privacy status before any media is used publicly.",
    "cta_label": "Start quote-first booking",
    "cta_href": "/book?estimate=photos"
  },
  {
    "category": "Photos, privacy, and proof",
    "question": "Will customer photos be posted online?",
    "answer": "Photos or videos should not be used publicly until staff confirm customer consent, privacy review, and any needed blur/crop work for plates, faces, addresses, or private information.",
    "cta_label": "Read privacy policy",
    "cta_href": "/privacy"
  }
];

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const category = cleanText(url.searchParams.get("category"));
    const hasDb = !!(env && env.SUPABASE_URL && getSupabaseServiceRoleKey(env));

    if (!hasDb) {
      return withCors(json({ ok: true, source: "static_fallback", degraded: true, items: filterItems(STATIC_FAQS, category) }));
    }

    const params = new URLSearchParams();
    params.set("select", "id,category,question,answer,cta_label,cta_href,sort_order,is_active,updated_at");
    params.set("is_active", "eq.true");
    params.set("order", "sort_order.asc,category.asc,question.asc");
    params.set("limit", "100");
    if (category) params.set("category", `eq.${category}`);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_faq_entries?${params.toString()}`, {
      headers: serviceHeaders(env)
    });
    const text = await res.text();
    const data = safeJson(text);

    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      return withCors(json({
        ok: true,
        source: "static_fallback",
        degraded: true,
        migration_hint: "Apply sql/2026-05-24_build172_public_faq_content_foundation.sql to manage FAQ content from Supabase.",
        items: filterItems(STATIC_FAQS, category)
      }));
    }

    return withCors(json({ ok: true, source: "db", degraded: false, items: data.map(normalizeRow) }));
  } catch (err) {
    return withCors(json({
      ok: true,
      source: "static_fallback",
      degraded: true,
      error: err?.message || "FAQ database read failed; static fallback returned.",
      items: STATIC_FAQS
    }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

function normalizeRow(row) {
  return {
    category: cleanText(row.category) || "General",
    question: cleanText(row.question) || "Question",
    answer: cleanText(row.answer) || "Answer pending.",
    cta_label: cleanText(row.cta_label) || null,
    cta_href: cleanText(row.cta_href) || null,
    sort_order: Number(row.sort_order || 0),
    updated_at: row.updated_at || null
  };
}

function filterItems(items, category) {
  const cat = cleanText(category);
  return cat ? items.filter((item) => item.category === cat) : items;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
