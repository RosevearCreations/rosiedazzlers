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
      meta_description: "Learn how Rosie Dazzlers approaches ceramic coating prep, polishing requirements, coating installation, aftercare, and booking expectations for Oxford and Norfolk County vehicles.",
      badge: "Special service landing page",
      hero_title: "Ceramic coating service",
      hero_intro: "Ceramic coating is a protection-focused upgrade for customers who want easier washing, stronger gloss retention, and a more deliberate long-term maintenance path after proper prep.",
      reasons_page_exists: [
        "Customers often see the word ceramic online without understanding how much preparation usually matters before the coating stage starts.",
        "This page explains why coating work is usually tied to inspection, wash, decontamination, and polishing decisions rather than being treated like a quick spray-on extra.",
        "It also gives Oxford and Norfolk County visitors a clear local explanation before they request a quote or book the surrounding detail work that makes the coating worthwhile."
      ],
      process: [
        "Inspect paint condition under proper light and explain whether polishing or paint correction is recommended first.",
        "Wash the vehicle thoroughly, decontaminate iron fallout and bonded contamination, and refine the surface so the coating is not being applied over residue.",
        "Apply the coating in controlled sections, level high spots, and protect the finish during the initial cure period.",
        "Explain realistic aftercare: safer washes, less aggressive chemicals, and regular maintenance are still part of keeping the finish looking right."
      ],
      equipment: [
        "pH-aware wash products, decontamination chemicals, and clay media when needed",
        "dual-action polishers, pads, compounds, finishing polish, and inspection lighting",
        "coating applicators, leveling towels, panel prep, and temperature-aware workflow habits",
        "paint-safe microfiber, trim protection, and aftercare guidance materials"
      ],
      highlights: [
        "Best for customers who want long-term gloss behavior and easier wash maintenance rather than a one-day shine only.",
        "Usually paired with exterior detail or paint correction because the coating locks in whatever finish quality is underneath it.",
        "Quote-led service because paint condition, vehicle size, and target finish level affect labour and prep time."
      ],
      things_to_know: [
        "Ceramic coating is not a substitute for proper washing or decontamination.",
        "A coating helps with wash behavior and gloss retention, but it does not make paint immune to scratching.",
        "If a vehicle has heavy swirls, haze, or oxidation, those issues are usually addressed before the coating stage so they are not locked in."
      ],
      official_links: [],
      faq: [
        {"q": "Is ceramic coating the same thing as wax?", "a": "No. Wax is a shorter-term protection step; ceramic coating is a longer-term protection system that still relies on prep quality and proper aftercare."},
        {"q": "Do I always need paint correction first?", "a": "Not always, but many vehicles benefit from at least some polishing or refinement before coating so the finish underneath is worth protecting."},
        {"q": "Can coating be booked by itself?", "a": "It is usually connected to exterior or complete detailing because the paint needs to be properly cleaned and prepared first."}
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
      meta_description: "Learn how Rosie Dazzlers handles pet hair removal from carpets, seats, cargo areas, and trim, including tool choice, realistic labour expectations, and when a deeper interior package makes more sense.",
      badge: "Special service landing page",
      hero_title: "Pet hair removal service",
      hero_intro: "Pet hair removal is labour-heavy interior work that depends on the upholstery type, how deeply the hair is woven into carpet or cloth, and how much overall interior cleaning is needed at the same time.",
      reasons_page_exists: [
        "Pet hair is one of the most common reasons interior jobs take longer than customers expect.",
        "This page explains why hair removal is not just a quick vacuum pass when fibres are embedded into carpet, cargo liners, and cloth seats.",
        "It also helps customers decide whether they need a focused add-on or a deeper interior / complete detail around it."
      ],
      process: [
        "Inspect the interior and identify where hair is sitting on the surface versus woven deep into carpet or cloth.",
        "Vacuum loose debris first so the detail work can focus on embedded fibres rather than general dirt alone.",
        "Use the right combination of brushes, rubber tools, compressed air, and repeated vacuum passes to lift stubborn hair from fabric and carpet.",
        "Finish with the surrounding interior clean so the vehicle looks finished rather than having isolated clean patches only."
      ],
      equipment: [
        "commercial vacuum, crevice tools, and repeated-pass workflow",
        "rubber pet-hair tools, brushes, and fabric-safe agitation methods",
        "compressed-air style blowout tools where appropriate",
        "microfiber and interior-safe cleaners for final finish work"
      ],
      highlights: [
        "Best for cloth interiors, cargo areas, and family vehicles carrying pets regularly.",
        "Usually pairs well with interior or complete detailing because hair removal exposes the rest of the cabin condition.",
        "Heavier hair loads may still be quote-led if the labour is unusually high."
      ],
      things_to_know: [
        "Pet hair removal is usually easier to judge after an inspection than from a single photo.",
        "Rubber mats, cloth seats, cargo carpeting, and seat rails all trap hair differently.",
        "If odour, stains, or dander are also present, a deeper interior package may be the better path."
      ],
      official_links: [],
      faq: [
        {"q": "Can pet hair removal be done as a small add-on only?", "a": "Sometimes yes, but when the whole cabin is heavily affected it often makes more sense to pair it with interior or complete detailing."},
        {"q": "Why does price vary so much?", "a": "Because loose surface hair and deeply woven hair are very different workloads, especially in cargo carpet and cloth seating."},
        {"q": "Will it remove every single hair?", "a": "The goal is a strong practical improvement, but some fibres can still be stubborn depending on upholstery texture and condition."}
      ]
    },
    "odor-removal": {
      type: "addon",
      related_code: "odor_removal",
      enabled: true,
      slug: "odor-removal",
      nav_group: "special-service",
      name: "Odor removal",
      meta_title: "Vehicle Odor Removal Service | Rosie Dazzlers",
      meta_description: "Learn how Rosie Dazzlers approaches smoke, pet, food, and general interior odour reduction, including source cleaning, deeper interior prep, deodorizing tools, and realistic expectations.",
      badge: "Special service landing page",
      hero_title: "Vehicle odor removal service",
      hero_intro: "Odor removal works best when the source is cleaned first. The treatment stage matters, but the real improvement often starts with carpets, seats, vents, spill areas, and hidden organic build-up being addressed properly.",
      reasons_page_exists: [
        "Customers often ask for odour removal as if it is only a fragrance or machine step, when the bigger issue is usually the source inside the cabin.",
        "This page explains why interior or complete detailing is often required before the deodorizing stage begins.",
        "It also sets realistic expectations around smoke, pet, food, mildew, and long-term absorbed odours."
      ],
      process: [
        "Inspect the interior for likely odour sources such as spills, pet areas, trash residue, moisture, and heavy smoker buildup.",
        "Complete the surrounding interior cleaning needed to remove the source load rather than trying to mask it.",
        "Use the chosen deodorizing treatment after the cleaning stage has reduced the material causing the smell.",
        "Reassess the vehicle and explain whether the improvement is likely complete, partial, or likely to need repeat work because of deeper contamination."
      ],
      equipment: [
        "interior cleaners, extraction or shampoo support where needed, and microfiber finishing materials",
        "vacuum and compressed-air style access tools for vents, rails, and hidden buildup zones",
        "deodorizing treatment equipment matched to the odour problem",
        "inspection lights and practical follow-up notes for customers"
      ],
      highlights: [
        "Best for food, pet, smoke, or general stale-cabin concerns when cleaning and deodorizing are both needed.",
        "Usually requires an interior or complete detail because source cleaning comes first.",
        "Some long-term or moisture-driven odours may improve only partially if the source extends beyond normal detailing access."
      ],
      things_to_know: [
        "Masking a smell is not the same thing as removing the source of the odour.",
        "Spills under seats, inside cargo liners, or within HVAC areas can change the labour and results.",
        "If water intrusion or mould is suspected, the vehicle may need mechanical or body repair beyond detailing."
      ],
      official_links: [],
      faq: [
        {"q": "Can odor removal be chosen by itself?", "a": "Usually no. It is commonly tied to an interior or complete detail so the odour source can be cleaned first."},
        {"q": "Will one treatment solve every smoke smell?", "a": "Not always. Long-term smoke contamination can require deeper cleaning and sometimes more than one treatment cycle."},
        {"q": "Why talk about moisture problems on a detailing page?", "a": "Because recurring moisture can keep feeding odour even after a strong cleaning if the root leak or dampness is not fixed."}
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
      hero_intro: "Headlight restoration is about removing the failed outer layer, restoring clarity, and protecting the lens again so the improvement lasts as long as possible.",
      reasons_page_exists: [
        "Hazy headlights affect appearance and can reduce usable night-time light output.",
        "This page explains what restoration can improve, where the limits are, and why protection after refinishing matters.",
        "It also gives local customers a clear explanation before they compare restoration against replacement."
      ],
      process: [
        "Inspect the lens for yellowing, oxidation, pitting, and deeper internal failure.",
        "Mask surrounding trim and paint so the restoration work stays controlled.",
        "Use the correct abrasive progression to remove the failed surface layer, then refine and polish back to clarity.",
        "Finish with a protection step and explain that restored lenses still benefit from ongoing care."
      ],
      equipment: [
        "graded abrasives and restoration pads",
        "compounds, finishing products, and work lights",
        "masking materials and lens-safe correction workflow",
        "post-restoration protection products"
      ],
      highlights: [
        "Best for oxidized, yellowed, or hazy plastic headlight lenses.",
        "Restoration is usually more practical than replacement when the issue is surface oxidation rather than internal damage.",
        "Protection after the sanding and polishing stages helps slow the return of weathering."
      ],
      things_to_know: [
        "Severely cracked, crazed, or internally damaged housings may still need replacement.",
        "The clearer the lens becomes, the more noticeable any remaining internal damage can be.",
        "Freshly restored lenses still need protection and sensible washing habits."
      ],
      official_links: [],
      faq: [
        {"q": "Will restoration make every old lens perfect again?", "a": "No. It improves many oxidized lenses, but heavily cracked or internally failed assemblies still have limits."},
        {"q": "Why include a protection step after the correction work?", "a": "Because the damaged outer layer has already failed, so the restored lens still needs help resisting UV and weathering."},
        {"q": "Is restoration cheaper than replacement?", "a": "Often yes, but the real answer depends on how far the lens has already deteriorated and whether the failure is only on the surface."}
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
      hero_intro: "Paint correction is defect-removal work, not just a gloss product. The right path depends on paint condition, defect depth, and the level of improvement the customer wants.",
      reasons_page_exists: [
        "Customers often mix up wax, sealant, polish, and correction even though they do different jobs.",
        "This page clarifies when swirl marks, oxidation, haze, and gloss loss call for correction rather than simple protection.",
        "It also explains why quote-led inspection matters before promising a finish result."
      ],
      process: [
        "Inspect the finish under proper light to understand swirls, haze, oxidation, and deeper defects.",
        "Wash and decontaminate the paint so polishing work is not being performed over bonded contamination.",
        "Choose the least aggressive polishing path that can achieve the target improvement level.",
        "Refine the finish and match it with the right protection step afterward."
      ],
      equipment: [
        "decontamination supplies, iron removers, and wash media",
        "dual-action polishers, pads, compounds, and finishing polishes",
        "inspection lighting, masking materials, and panel prep supplies",
        "microfiber, trim-safe workflow materials, and protection-stage products"
      ],
      highlights: [
        "Useful before ceramic coating or higher-end paint protection packages.",
        "Swirl marks, oxidation, and dull paint are the most common reasons customers ask for this service.",
        "Deep defects that run through the clear coat cannot always be corrected safely."
      ],
      things_to_know: [
        "Correction removes or reduces visible defects; it is not the same thing as waxing.",
        "Not every vehicle needs an aggressive cut step; sometimes refinement is the smarter path.",
        "The better the correction target, the more valuable the protection step becomes afterward."
      ],
      official_links: [],
      faq: [
        {"q": "Is paint correction the same as waxing?", "a": "No. Correction removes or reduces visible defects; wax is mainly a protection or gloss step."},
        {"q": "Can one correction level fit every vehicle?", "a": "No. Daily-driver improvement work and higher-level correction work are not the same labour or finish target."},
        {"q": "Why is this usually quote-led?", "a": "Because paint condition, defect depth, and the desired finish level all change the time, pad, and polish path."}
      ]
    },
    "tillsonburg-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "tillsonburg-auto-detailing",
      nav_group: "town",
      name: "Tillsonburg auto detailing",
      meta_title: "Mobile Auto Detailing in Tillsonburg, Ontario | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing information for Tillsonburg customers, including local watering restrictions, seasonal parking notes, Ontario electricity timing reminders, and booking guidance.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Tillsonburg",
      hero_intro: "This page exists so Tillsonburg-area customers can find local mobile-detailing guidance, seasonal municipal reminders, and current proof of work without digging through broader county pages first.",
      reasons_page_exists: [
        "Town pages improve relevance when people search by place name first instead of brand name first.",
        "They answer practical local questions that matter to mobile service: driveway access, watering rules, parking restrictions, and timing considerations.",
        "They also give you a stronger Tillsonburg-specific page for recent proof, review trust, and local calls to action."
      ],
      highlights: [
        "Strong fit for package comparison, interior work, and repeat maintenance customers in the Tillsonburg area.",
        "Useful entry page for customers who search by town name before they search by package name.",
        "Built to keep local facts, proof-of-work, and booking routes close together."
      ],
      process: [
        "Confirm service-area fit and the type of driveway or property setup available.",
        "Guide the customer into the live package and add-on planner with realistic service-match notes.",
        "Use recent proof and review content to support local trust before contact or checkout.",
        "Keep the page refreshed as local proof, service mix, and municipal notes evolve."
      ],
      equipment: [
        "mobile detailing setup sized for driveway-based work",
        "package and add-on workflow matched to the live booking planner",
        "photo, review, and recent-work proof blocks kept visible near calls to action",
        "water- and power-aware workflow habits for residential service stops"
      ],
      things_to_know: [
        "Tillsonburg outdoor water restrictions run from May 1 to September 30 and Oxford rules limit outside water use by odd/even day scheduling.",
        "Tillsonburg winter parking restrictions prohibit overnight street parking from November 15 to March 31 between 2 a.m. and 6 a.m., which matters for early drop-offs or street-side service plans.",
        "Ontario Time-of-Use electricity is generally cheapest evenings, weekends, and holidays, so customers planning heavy vacuum or power-supported driveway service sometimes prefer off-peak windows.",
        "Hydrant and watermain flushing can temporarily cause cloudy or discoloured water in town, so customers sometimes prefer to reschedule exterior work if that is happening on their street."
      ],
      official_links: [
        { label: "Tillsonburg water restrictions", url: "https://www.tillsonburg.ca/living-here/water-and-wastewater/water-restrictions/" },
        { label: "Tillsonburg parking and parking tickets", url: "https://www.tillsonburg.ca/living-here/parking-and-parking-tickets/" },
        { label: "Tillsonburg by-law enforcement", url: "https://www.tillsonburg.ca/living-here/by-law-enforcement/" },
        { label: "Ontario electricity rates", url: "https://www.oeb.ca/consumer-information-and-protection/electricity-rates" }
      ],
      faq: [
        {"q": "Why make a Tillsonburg page instead of only one general service page?", "a": "Because local search visitors often look for a town match first, then decide whether to keep reading or book."},
        {"q": "Does this page change the actual booking flow?", "a": "No. It routes into the same pricing and booking system, but with better local context around it."},
        {"q": "Why mention water and parking on a detailing page?", "a": "Because mobile service depends on practical setup. Water-use windows, access, and seasonal parking rules can change the best service timing on the day."}
      ]
    },
    "woodstock-ingersoll-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "woodstock-ingersoll-auto-detailing",
      nav_group: "town",
      name: "Woodstock / Ingersoll auto detailing",
      meta_title: "Mobile Auto Detailing in Woodstock & Ingersoll | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing page for Woodstock and Ingersoll customers, including Oxford water-use reminders, parking notes, and practical booking guidance for this service area.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Woodstock and Ingersoll",
      hero_intro: "This page gives Woodstock and Ingersoll visitors a clearer local service entry point, with package guidance, recent proof, and practical town-level notes that matter for mobile work.",
      reasons_page_exists: [
        "Woodstock and Ingersoll searchers often use town-plus-service queries rather than brand-first queries.",
        "A combined page helps keep local wording, booking guidance, and proof visible for one of the strongest Oxford County zones.",
        "It gives customers a more useful place-specific entry page before they move into pricing, add-ons, or booking."
      ],
      highlights: [
        "Useful for customers comparing full packages, maintenance work, and local travel fit.",
        "Supports stronger Oxford County local visibility and easier page-to-page internal linking.",
        "Designed to keep current proof and review trust signals visible for local search users."
      ],
      process: [
        "Guide the customer into the same live package and add-on planner used elsewhere on the site.",
        "Keep travel, setup, and availability expectations simple and local.",
        "Use recent work and reviews to show that the service is active and current in the area.",
        "Highlight package-dependent add-ons clearly so the booking path is easier to understand."
      ],
      equipment: [
        "mobile setup for driveway-based detailing",
        "local proof blocks and recent-work media",
        "booking and package comparison tools that match the main site flow",
        "water-aware and access-aware setup notes for Oxford County properties"
      ],
      things_to_know: [
        "Woodstock follows Oxford outside-water restrictions, including residential 6–9 a.m. and 6–9 p.m. windows and commercial 8–10 a.m. and 3–5 p.m. windows on odd/even days.",
        "Ingersoll parking and permit rules can matter if a customer expects curbside service rather than driveway-based service.",
        "Ontario Time-of-Use pricing still makes evening, weekend, and holiday windows the lower-cost periods for households on TOU plans.",
        "For larger jobs, driveway access, electrical access, and water-use timing can affect the most practical appointment window."
      ],
      official_links: [
        { label: "Woodstock watering restrictions", url: "https://www.cityofwoodstock.ca/living-in-woodstock/water-and-utilities/water/watering-restrictions-and-conservation/" },
        { label: "Woodstock water information", url: "https://www.cityofwoodstock.ca/living-in-woodstock/water-and-utilities/water/" },
        { label: "Ingersoll parking information", url: "https://www.ingersoll.ca/residential-services/parking-information/" },
        { label: "Ontario electricity rates", url: "https://www.oeb.ca/consumer-information-and-protection/electricity-rates" }
      ],
      faq: [
        {"q":"Why combine Woodstock and Ingersoll on one page?","a":"Because the service intent and local search behavior overlap strongly enough that one richer local page is often more useful than two thin ones."},
        {"q":"Why mention commercial watering windows?","a":"Because some customers ask about office or shop locations rather than residential driveways, and Oxford’s commercial outdoor water windows are different from the residential ones."}
      ]
    },
    "simcoe-delhi-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "simcoe-delhi-auto-detailing",
      nav_group: "town",
      name: "Simcoe / Delhi auto detailing",
      meta_title: "Mobile Auto Detailing in Simcoe & Delhi | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing page for Simcoe and Delhi customers, including Norfolk water-use reminders, parking notes, and local mobile detailing guidance.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Simcoe and Delhi",
      hero_intro: "This page is built for Norfolk County visitors who search by Simcoe or Delhi first and want stronger local service context, proof, and practical mobile-detailing guidance before they book.",
      reasons_page_exists: [
        "Simcoe and Delhi are clear local search anchors within the Norfolk side of the service area.",
        "This page gives those customers a stronger local explanation instead of pushing them straight onto a broad county page.",
        "It also supports clearer internal linking for nearby Norfolk-area content and seasonal local search intent."
      ],
      highlights: [
        "Strong fit for local package comparisons and repeat maintenance customers.",
        "Keeps Norfolk-specific wording, proof, and live booking routes close together.",
        "Works as a trust-building bridge page for customers who want local proof first."
      ],
      process: [
        "Confirm area fit and route the customer into pricing and booking.",
        "Surface current work and review proof before the customer leaves the page.",
        "Keep the page updated as local service proof and content expand.",
        "Use it to explain which add-ons are standalone versus package-dependent."
      ],
      equipment: [
        "mobile driveway-detailing setup",
        "local proof sections and before/after media",
        "site-wide booking and pricing tools",
        "water- and access-aware workflow planning for Norfolk County service calls"
      ],
      things_to_know: [
        "Norfolk County watering restrictions in urban areas such as Simcoe and Delhi run from May 15 to September 15, generally from 9–11 a.m. and 7–10 p.m. on odd/even address days.",
        "Norfolk municipal parking information notes free municipal lots in Delhi and broader parking regulations that may matter when a customer does not have driveway space.",
        "Ontario household electricity plans still make evenings, weekends, and holidays the cheapest TOU periods for many customers using household power during service.",
        "Mobile detailing works best when driveway access and hose / outlet expectations are clear in advance."
      ],
      official_links: [
        { label: "Norfolk watering restrictions", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/" },
        { label: "Norfolk watering by-law", url: "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/by-law-directory/watering-restrictions-by-law/" },
        { label: "Norfolk parking", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/" },
        { label: "Ontario electricity rates", url: "https://www.oeb.ca/consumer-information-and-protection/electricity-rates" }
      ],
      faq: [
        {"q":"Why use a Simcoe / Delhi page?","a":"Because local searchers often want to confirm town coverage and local proof before they engage with a wider service-area page."},
        {"q":"Why mention watering windows?","a":"Because outdoor water-use rules can matter for driveway-based exterior work during the warmer months in Norfolk."}
      ]
    },
    "port-dover-auto-detailing": {
      type: "location",
      enabled: true,
      slug: "port-dover-auto-detailing",
      nav_group: "town",
      name: "Port Dover auto detailing",
      meta_title: "Mobile Auto Detailing in Port Dover | Rosie Dazzlers",
      meta_description: "Town-focused mobile auto detailing page for Port Dover customers, including seasonal parking, Norfolk water-use reminders, and local booking guidance for coastal-area service calls.",
      badge: "Town-focused detailing page",
      hero_title: "Mobile auto detailing in Port Dover",
      hero_intro: "Port Dover deserves its own page because coastal and seasonal traffic patterns make local search intent and customer questions feel different from broader inland service pages.",
      reasons_page_exists: [
        "Port Dover searchers often want stronger location confirmation and trust signals before they book.",
        "This page lets you explain local fit, mobile expectations, and proof-of-work with more relevance for the area.",
        "It also gives you a stronger place to grow seasonal and coastal search visibility over time."
      ],
      highlights: [
        "Useful for local search visitors who want visible proof before they call or book.",
        "Supports coastal-area wording and stronger local relevance signals.",
        "Creates a more useful internal-link destination than a generic county mention."
      ],
      process: [
        "Confirm service-area fit and route the customer into the same live booking flow.",
        "Keep proof and reviews visible beside the call to action.",
        "Use the page to grow stronger place-based visibility over time.",
        "Call out summer access, parking, and setup considerations so expectations are clearer before arrival."
      ],
      equipment: [
        "mobile detailing setup sized for local driveway work",
        "current review and gallery proof blocks",
        "site-wide booking and pricing tools",
        "coastal-area service planning notes for seasonal traffic and access conditions"
      ],
      things_to_know: [
        "Norfolk County’s summer watering restrictions still apply in Port Dover from May 15 to September 15, generally using 9–11 a.m. and 7–10 p.m. windows on odd/even address days.",
        "Port Dover also has seasonal paid parking zones and resident permit options in Norfolk’s paid-parking areas, which can matter for shoreline or curbside appointments.",
        "Ontario Time-of-Use electricity still makes evenings, weekends, and holidays the lower-cost household periods for customers on TOU plans.",
        "Seasonal traffic and event-day congestion can change the most practical mobile appointment windows near the waterfront."
      ],
      official_links: [
        { label: "Norfolk watering restrictions", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/" },
        { label: "Norfolk parking", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/" },
        { label: "Norfolk paid parking", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/paid-parking/" },
        { label: "Ontario electricity rates", url: "https://www.oeb.ca/consumer-information-and-protection/electricity-rates" }
      ],
      faq: [
        {"q":"Why give Port Dover its own page?","a":"Because town-first local searches often perform better when the page clearly matches the place the customer typed into search."},
        {"q":"Why mention parking on a detailing page?","a":"Because seasonal paid parking and waterfront traffic can affect how practical curbside or near-shore service access is on busy days."}
      ]
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
    things_to_know: normalizeStringArray(page?.things_to_know),
    official_links: normalizeLinkArray(page?.official_links),
    faq: faq.map((item) => ({ q: String(item?.q || "").trim(), a: String(item?.a || "").trim() })).filter((item) => item.q && item.a)
  };
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : []).map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeLinkArray(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    label: String(item?.label || item?.url || "Official source").trim(),
    url: String(item?.url || "").trim()
  })).filter((item) => item.url);
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
