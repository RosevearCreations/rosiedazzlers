import { serviceHeaders } from "./_lib/staff-auth.js";

const DEFAULT_LANDING_PAGES = {
  pages: {
    "ceramic-coating": {
      type: "addon",
      related_code: "external_ceramic_coating",
      enabled: true,
      slug: "ceramic-coating",
      nav_group: "special-service",
      name: "Ceramic coating",
      meta_title: "Ceramic Coating in Oxford & Norfolk Counties | Rosie Dazzlers",
      meta_description: "Learn how Rosie Dazzlers approaches ceramic coating prep, inspection, polishing requirements, aftercare, and booking expectations for Oxford and Norfolk County vehicles.",
      badge: "Special service landing page",
      hero_title: "Ceramic coating service",
      hero_intro: "Ceramic coating is a protection-focused upgrade for customers comparing gloss, wash ease, and longer-lasting surface behavior after proper prep.",
      reasons_page_exists: [
        "Customers regularly ask whether ceramic coating is a quick add-on or a full correction-led service.",
        "This page explains why prep, paint condition, and realistic expectations matter before a coating is booked.",
        "It also gives Oxford and Norfolk County visitors a direct local route into booking and quote review."
      ],
      process: [
        "Inspect paint condition and confirm whether polishing or correction is needed first.",
        "Wash, chemically decontaminate, and mechanically decontaminate the exterior so the coating is not sealing contamination underneath.",
        "Refine the surface as needed, panel-wipe it clean, then apply the coating in controlled sections.",
        "Review aftercare so the coating keeps performing as expected instead of being damaged by poor wash habits."
      ],
      equipment: [
        "pH-safe wash chemistry and decontamination products",
        "clay or synthetic decontamination media",
        "machine polishers, pads, towels, and panel prep products",
        "controlled application towels and coating-safe finishing materials"
      ],
      highlights: [
        "Best for customers who want easier routine washing and better gloss retention.",
        "Usually not the right first step if the paint is heavily swirled, etched, or oxidized.",
        "A coating is not a force field; prep quality is what makes the result look right."
      ],
      faq: [
        {"q": "Does ceramic coating replace polishing?", "a": "No. If the paint needs correction first, coating without prep can lock defects in visually."},
        {"q": "Is ceramic coating scratch-proof?", "a": "No. It can improve wash behavior and add chemical resistance, but it does not make paint immune to damage."},
        {"q": "Why is this quote-led?", "a": "Because prep time changes with contamination, paint condition, and the finish level you actually want."}
      ]
    },
    "pet-hair-removal": {
      type: "addon",
      related_code: "pet_hair_removal",
      enabled: true,
      slug: "pet-hair-removal",
      nav_group: "special-service",
      name: "Pet hair removal",
      meta_title: "Pet Hair Removal for Vehicle Interiors | Rosie Dazzlers",
      meta_description: "Detailed pet hair removal information for Oxford and Norfolk County vehicle owners. Learn when extraction time, fabric type, and heavy-fur conditions change pricing and service scope.",
      badge: "Special service landing page",
      hero_title: "Pet hair removal for vehicle interiors",
      hero_intro: "Pet hair removal is a labor-heavy interior service because fur locks into carpet, seat fabric, cargo liners, and trim edges in ways normal vacuuming does not solve.",
      reasons_page_exists: [
        "Customers often assume pet hair is a quick vacuum add-on when it is usually a dedicated extraction process.",
        "This page explains why fabric type, hair density, and how deeply the fur is woven in all affect the real time required.",
        "It also helps local customers decide whether they need a full interior service or a targeted hair-removal appointment."
      ],
      process: [
        "Dry vacuum the loose debris first so the real hair-removal work is visible.",
        "Agitate carpets, seats, and mats with friction tools that pull fur up instead of smearing it deeper into the fabric.",
        "Use compressed air and crevice work where needed around rails, seams, and cargo edges.",
        "Finish with vacuum extraction, wipe-downs, and a final inspection for embedded strands in high-friction fabrics."
      ],
      equipment: [
        "pet-hair brushes and rubber extraction tools",
        "crevice tools, air tools, and high-suction vacuuming",
        "fabric-safe agitation tools for carpet, mats, and upholstery",
        "anti-static finishing products where appropriate"
      ],
      highlights: [
        "Best paired with an interior or complete detail when odor, stains, and heavy debris are also present.",
        "Heavy pet-hair jobs can require much more time than light-maintenance interiors.",
        "Different fabrics release hair differently, so pricing can change with condition and material."
      ],
      faq: [
        {"q": "Why isn’t pet hair always a flat quick add-on?", "a": "Because embedded fur can take much longer than loose fur, especially in trunk liners, cloth seats, and dense carpet."},
        {"q": "Can you remove every single hair?", "a": "The goal is a professionally cleaned finish, but extremely embedded hair in worn fabric can take disproportionate labor to chase to a perfect zero."},
        {"q": "Should I book this alone or with interior detailing?", "a": "If the interior also needs stain work, deodorizing, or full cleaning, pairing it with an interior-focused package is usually the better choice."}
      ]
    },
    "odor-removal": {
      type: "addon",
      related_code: "odor_removal",
      enabled: true,
      slug: "odor-removal",
      nav_group: "special-service",
      name: "Odor removal",
      meta_title: "Vehicle Odor Removal in Oxford & Norfolk Counties | Rosie Dazzlers",
      meta_description: "Odor removal service details for smoke, pet, food, and musty interior conditions. Learn why source removal and interior cleaning come before deodorizing treatments.",
      badge: "Special service landing page",
      hero_title: "Vehicle odor removal",
      hero_intro: "Odor removal is most effective when the source is identified and cleaned first. Masking smells is not the same as treating the material that is causing the smell.",
      reasons_page_exists: [
        "Customers often search for odor removal as if it is separate from cleaning when the two are closely tied.",
        "This page explains why smoke, food, pet, moisture, and neglected interiors all need slightly different treatment paths.",
        "It helps set expectations before anyone books a deodorizing service on its own."
      ],
      process: [
        "Inspect the likely source zones such as carpet, seats, mats, vents, cargo area, and spill locations.",
        "Remove debris and contamination with vacuuming, wiping, extraction, or shampoo work as needed.",
        "Treat the remaining odor with the right follow-up method after the physical source has been addressed.",
        "Review whether more than one visit may be needed when odor has saturated fabric, foam, or long-neglected interiors."
      ],
      equipment: [
        "interior cleaning chemistry matched to the contamination type",
        "vacuum and extraction tools",
        "odor-treatment follow-up products or systems where appropriate",
        "vent and crevice tools for source tracking"
      ],
      highlights: [
        "Usually best paired with an interior or complete detail because source cleanup matters.",
        "Heavy smoke, pet, mildew, or spill situations can require more than one stage of work.",
        "Source removal is what makes odor work more durable than simple fragrance masking."
      ],
      faq: [
        {"q": "Can odor removal be booked alone?", "a": "Sometimes, but many odor jobs still require an interior or complete cleaning path because the source has to be treated."},
        {"q": "Will one visit always solve the smell?", "a": "Not always. Deeply absorbed odors in foam, carpet backing, or neglected interiors can take additional work."},
        {"q": "Why do you ask what caused the odor?", "a": "Because pet, smoke, food, moisture, and biological contamination do not all behave the same way or clean the same way."}
      ]
    },
    "headlight-restoration": {
      type: "addon",
      related_code: "headlight_restoration",
      enabled: true,
      slug: "headlight-restoration",
      nav_group: "special-service",
      name: "Headlight restoration",
      meta_title: "Headlight Restoration Service | Rosie Dazzlers",
      meta_description: "Learn how Rosie Dazzlers approaches oxidized, hazy, and yellowed headlights, including sanding, polishing, clarity restoration, and protection-stage expectations.",
      badge: "Special service landing page",
      hero_title: "Headlight restoration",
      hero_intro: "Headlight restoration is about removing the failed oxidized layer, restoring clarity, and applying realistic protection expectations afterward.",
      reasons_page_exists: [
        "Hazy headlights affect appearance and can reduce night-time light output.",
        "This page explains what restoration does, what it does not do, and why protection after refinishing matters.",
        "It gives local customers a clear explanation before they compare restoration against replacement."
      ],
      process: [
        "Inspect the lens for oxidation, yellowing, surface damage, and deeper failure.",
        "Level the failed outer layer using the correct abrasive progression for the condition of the lens.",
        "Refine and polish the lens back to usable clarity.",
        "Finish with a protection step and explain that restored lenses still need ongoing care."
      ],
      equipment: [
        "graded abrasives and restoration pads",
        "polishing compounds and finishing materials",
        "masking materials and controlled work lights",
        "post-restoration protection products"
      ],
      highlights: [
        "Best for hazy, yellowed, or oxidized plastic headlight lenses.",
        "Restoration improves clarity, but severely damaged or internally failed lenses may still need replacement.",
        "Protection after the correction stage matters because the original failed outer layer has already broken down."
      ],
      faq: [
        {"q": "Will restoration make every old lens perfect again?", "a": "No. It improves many oxidized lenses, but heavily cracked, crazed, or internally damaged assemblies may still have limits."},
        {"q": "Why mention protection after sanding and polishing?", "a": "Because once the damaged outer layer is removed, the lens still needs help resisting future UV and weathering."},
        {"q": "Is restoration cheaper than replacement?", "a": "Often yes, but the real answer depends on how far the lens has already deteriorated."}
      ]
    },
    "paint-correction": {
      type: "addon",
      related_code: "paint_correction",
      enabled: true,
      slug: "paint-correction",
      nav_group: "special-service",
      name: "Paint correction",
      meta_title: "Paint Correction in Oxford & Norfolk Counties | Rosie Dazzlers",
      meta_description: "Paint correction information for swirl marks, oxidation, dull paint, and gloss restoration. Learn when one-stage polishing or heavier correction may be needed before protection services.",
      badge: "Special service landing page",
      hero_title: "Paint correction service",
      hero_intro: "Paint correction is a defect-removal process, not just a gloss product. The work level depends on how much the finish is marred and what level of improvement the customer wants.",
      reasons_page_exists: [
        "Customers often mix up wax, sealant, polish, and correction even though they do different jobs.",
        "This page clarifies when swirl marks, oxidation, and dullness call for correction rather than simple protection.",
        "It also sets realistic expectations about what can and cannot be safely improved."
      ],
      process: [
        "Inspect the finish under proper light to understand swirls, haze, oxidation, and deeper defects.",
        "Wash and decontaminate the paint before any polishing work begins.",
        "Choose the least aggressive polishing path that can achieve the target improvement.",
        "Refine the finish and discuss the right protection step afterward."
      ],
      equipment: [
        "wash and decontamination supplies",
        "dual-action polishers, pads, compounds, and finishing polishes",
        "inspection lighting and masking materials",
        "microfiber and panel prep supplies"
      ],
      highlights: [
        "Useful before ceramic coating or higher-end paint protection.",
        "Swirl marks, oxidation, and gloss loss are the most common reasons customers ask for this service.",
        "Deep defects that run through the clear coat cannot always be corrected safely." 
      ],
      faq: [
        {"q": "Is paint correction the same as waxing?", "a": "No. Correction removes or reduces visible defects; wax is a protection or gloss step."},
        {"q": "Can one correction level fit every vehicle?", "a": "No. Daily-driver improvement work and higher-level correction work are not the same labor or finish target."},
        {"q": "Why is this usually quote-led?", "a": "Because paint condition, defect depth, and the desired finish level all change the time and product path."}
      ]
    },
    "tillsonburg-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "tillsonburg-auto-detailing",
      nav_group: "town",
      name: "Tillsonburg auto detailing",
      meta_title: "Mobile Auto Detailing in Tillsonburg, Ontario | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing information for Tillsonburg customers. Review how Rosie Dazzlers handles mobile setup, local booking flow, service-area fit, and recent work before booking.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Tillsonburg",
      hero_intro: "This page exists so Tillsonburg-area customers can find local wording, mobile-detailing expectations, and proof of recent work without digging through broader county content.",
      reasons_page_exists: [
        "Town pages improve relevance when people search by place name first instead of by service brand first.",
        "They answer common local questions about mobile setup, travel fit, and which services are most commonly booked in that area.",
        "They also give you a stronger place to keep recent proof, review signals, and town-specific calls to action visible."
      ],
      highlights: [
        "Strong fit for package comparison, interior work, and repeat maintenance customers in the Tillsonburg area.",
        "Useful entry page for customers who search by town name before they search by package name.",
        "Works well as a bridge page into the live booking planner, pricing page, and gallery."
      ],
      process: [
        "Confirm service area fit and the type of property setup available.",
        "Guide the customer into the live package and add-on planner.",
        "Use recent proof and review content to support local trust before contact or checkout.",
        "Keep the page refreshed as service mix, proof, and local wording evolve."
      ],
      equipment: [
        "mobile detailing setup sized for driveway-based work",
        "package and add-on workflow that matches the live booking planner",
        "photo, review, and recent-work proof blocks kept visible near calls to action"
      ],
      faq: [
        {"q": "Why make a Tillsonburg page instead of only one general service page?", "a": "Because local search visitors often look for a town match first, then decide whether to keep reading or book."},
        {"q": "Does this page change the actual booking flow?", "a": "No. It routes into the same pricing and booking system, but with better local context around it."}
      ]
    },
    "woodstock-ingersoll-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "woodstock-ingersoll-auto-detailing",
      nav_group: "town",
      name: "Woodstock / Ingersoll auto detailing",
      meta_title: "Mobile Auto Detailing in Woodstock & Ingersoll | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing page for Woodstock and Ingersoll customers. Learn how Rosie Dazzlers presents local service information, proof, and booking guidance for this Oxford County service area.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Woodstock and Ingersoll",
      hero_intro: "This page gives Woodstock and Ingersoll visitors a clearer local service entry point, with package guidance, mobile-detailing expectations, and current proof kept close to booking paths.",
      reasons_page_exists: ["Woodstock and Ingersoll searchers often use town-plus-service queries rather than brand-first queries.","A combined page helps keep local wording, booking guidance, and proof visible for one of the strongest Oxford County zones.","It supports both search intent and customer confidence before someone clicks deeper into pricing or books."],
      highlights: ["Useful for customers comparing full packages, maintenance work, and local travel fit.","Supports stronger Oxford County local visibility and easier page-to-page internal linking.","Designed to keep current proof and review trust signals visible for local search users."],
      process: ["Guide the customer into the same live package and add-on planner used elsewhere on the site.","Keep travel, setup, and availability expectations simple and local.","Use recent work and reviews to show that the service is active and current in the area."],
      equipment: ["mobile setup for driveway-based detailing","local proof blocks and recent-work media","booking and package comparison tools that match the main site flow"],
      faq: [{"q":"Why combine Woodstock and Ingersoll on one page?","a":"Because the service intent and local search behavior overlap strongly enough that one richer local page is often more useful than two thin ones."}]
    },
    "simcoe-delhi-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "simcoe-delhi-auto-detailing",
      nav_group: "town",
      name: "Simcoe / Delhi auto detailing",
      meta_title: "Mobile Auto Detailing in Simcoe & Delhi | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing page for Simcoe and Delhi customers. Review local service wording, current proof, and booking guidance for this Norfolk County zone.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Simcoe and Delhi",
      hero_intro: "This page is built for Norfolk County visitors who search by Simcoe or Delhi first and want proof, service context, and booking guidance before contacting the business.",
      reasons_page_exists: ["Simcoe and Delhi are clear local search anchors within the Norfolk side of the service area.","This page gives those customers a stronger local explanation instead of pushing them straight onto a broad county page.","It also supports clearer internal linking for nearby Norfolk-area content."],
      highlights: ["Strong fit for local package comparisons and repeat maintenance customers.","Keeps Norfolk-specific wording, proof, and live booking routes close together.","Works as a trust-building bridge page for customers who want local proof first."],
      process: ["Confirm area fit and route the customer into pricing and booking.","Surface current work and review proof before the customer leaves the page.","Keep the page updated as local service proof and content expand."],
      equipment: ["mobile driveway-detailing setup","local proof sections and before/after media","site-wide booking and pricing tools"],
      faq: [{"q":"Why use a Simcoe / Delhi page?","a":"Because local searchers often want to confirm town coverage and local proof before they engage with a wider service-area page."}]
    },
    "port-dover-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "port-dover-auto-detailing",
      nav_group: "town",
      name: "Port Dover auto detailing",
      meta_title: "Mobile Auto Detailing in Port Dover | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing page for Port Dover customers. Review local booking context, proof, and service information before booking with Rosie Dazzlers.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Port Dover",
      hero_intro: "Port Dover deserves its own page because coastal and seasonal traffic patterns make local search intent and customer questions feel different from broader inland service pages.",
      reasons_page_exists: ["Port Dover searchers often want stronger location confirmation and trust signals before they book.","This page lets you explain local fit, mobile expectations, and proof-of-work with more relevance for the area.","It also gives you a stronger place to grow coastal or seasonal search visibility over time."],
      highlights: ["Useful for local search visitors who want visible proof before they call or book.","Supports coastal-area wording and stronger local relevance signals.","Creates a more useful internal-link destination than a generic county mention."],
      process: ["Confirm service-area fit and route the customer into the same live booking flow.","Keep proof and reviews visible beside the call to action.","Use the page to grow stronger place-based visibility over time."],
      equipment: ["mobile detailing setup sized for local driveway work","current review and gallery proof blocks","site-wide booking and pricing tools"],
      faq: [{"q":"Why give Port Dover its own page?","a":"Because town-first local searches often perform better when the page clearly matches the place the customer typed into search."}]
    }
  }
};

export async function onRequestGet({ env }) {
  try {
    const landingPages = await loadLandingPages(env);
    return withCors(json({ ok: true, ...landingPages }));
  } catch (err) {
    return withCors(json({ ok: true, ...DEFAULT_LANDING_PAGES, warning: err?.message || "Could not load saved landing pages; using fallback defaults." }, 200));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadLandingPages(env) {
  const fallback = cloneLandingPages(DEFAULT_LANDING_PAGES);
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return fallback;
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.landing_pages&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) return fallback;
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return mergeLandingPages(fallback, row?.value);
}

function mergeLandingPages(fallback, candidate) {
  const base = cloneLandingPages(fallback);
  const pages = candidate && typeof candidate === "object" && candidate.pages && typeof candidate.pages === "object" ? candidate.pages : {};
  for (const [slug, page] of Object.entries(pages)) {
    base.pages[slug] = normalizePage({ ...(base.pages[slug] || {}), ...(page || {}), slug });
  }
  return base;
}

function normalizePage(page) {
  const faq = Array.isArray(page?.faq) ? page.faq : [];
  return {
    type: String(page?.type || "addon").trim() || "addon",
    related_code: String(page?.related_code || "").trim() || null,
    enabled: page?.enabled !== false,
    slug: String(page?.slug || "").trim(),
    nav_group: String(page?.nav_group || "other").trim() || "other",
    name: String(page?.name || page?.slug || "Landing page").trim(),
    meta_title: String(page?.meta_title || "").trim(),
    meta_description: String(page?.meta_description || "").trim(),
    badge: String(page?.badge || "Service landing page").trim(),
    hero_title: String(page?.hero_title || page?.name || "Landing page").trim(),
    hero_intro: String(page?.hero_intro || "").trim(),
    reasons_page_exists: normalizeStringArray(page?.reasons_page_exists),
    process: normalizeStringArray(page?.process),
    equipment: normalizeStringArray(page?.equipment),
    highlights: normalizeStringArray(page?.highlights),
    faq: faq.map((item) => ({ q: String(item?.q || "").trim(), a: String(item?.a || "").trim() })).filter((item) => item.q && item.a)
  };
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : []).map((item) => String(item || "").trim()).filter(Boolean);
}

function cloneLandingPages(payload) {
  const raw = JSON.parse(JSON.stringify(payload || DEFAULT_LANDING_PAGES));
  const pages = raw.pages && typeof raw.pages === "object" ? raw.pages : {};
  for (const [slug, page] of Object.entries(pages)) pages[slug] = normalizePage({ ...page, slug });
  raw.pages = pages;
  return raw;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
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
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
