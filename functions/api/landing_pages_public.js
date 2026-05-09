import { serviceHeaders } from "./_lib/staff-auth.js";
import fallbackPricingCatalog from "./data/rosie_services_pricing_and_packages.json";
import fallbackProductCatalog from "./data/rosie_products_catalog.json";

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

const LANDING_PAGE_EXPANSIONS = {
  "pages": {
    "ceramic-coating": {
      "related_products": [
        {
          "name": "10 HCeramic Coating",
          "role": "coating product",
          "note": "Used when the goal is a durable ceramic-style protection layer after the paint has been cleaned and refined."
        },
        {
          "name": "DIYDetail Ceramic Gloss",
          "role": "finish support",
          "note": "Useful as a gloss and maintenance-support product around the ceramic workflow."
        },
        {
          "name": "Turtle Wax 53409 Hybrid Solutions Ceramic Spray Coating, Incredible Shine & Protection for Car Paint, Extreme Water Beading, Safe for Cars, Trucks, Motorcycles, RV's & More, 16 oz.",
          "role": "maintenance / topper",
          "note": "Helpful for customers who want ceramic-style behaviour with easier maintenance support between deeper services."
        }
      ],
      "highlights": [
        "Best for customers who want long-term gloss behaviour, easier washing, and a more deliberate maintenance path than a short-lived shine product alone.",
        "Usually paired with exterior detail or paint correction because the coating locks in whatever finish quality is underneath it.",
        "Quote-led service because paint condition, vehicle size, defect level, and cure planning all affect labour and prep time.",
        "Strong landing-page topic because customers actively search for ceramic coating as its own service rather than as a line item inside a generic package page."
      ],
      "things_to_know": [
        "Ceramic coating is not a substitute for proper washing, decontamination, or maintenance care.",
        "A coating helps with wash behaviour and gloss retention, but it does not make paint immune to scratching or neglected wash habits.",
        "If a vehicle has heavy swirls, haze, or oxidation, those issues are usually addressed before the coating stage so they are not locked in.",
        "Coating pages perform better when they explain prep, limitations, aftercare, and real-world expectations instead of treating ceramic like a magic product."
      ]
    },
    "pet-hair-removal": {
      "related_products": [
        {
          "name": "Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)",
          "role": "interior agitation tool",
          "note": "Useful for controlled interior scrubbing around fabric and trim during pet-hair-heavy interior recovery work."
        },
        {
          "name": "9 Piece Shop Vac Attachments",
          "role": "vacuum support",
          "note": "Helpful for reaching seat rails, cargo edges, tight trim joints, and other spots where pet hair hides."
        }
      ],
      "things_to_know": [
        "Pet hair removal is usually easier to judge after inspection than from a single photo because loose surface hair and deeply embedded hair are very different workloads.",
        "Rubber mats, cloth seats, cargo carpeting, and seat rails all trap hair differently and often need different tool choices.",
        "If odour, stains, or dander are also present, a deeper interior package may be the better path than hair removal by itself.",
        "This page exists because pet hair is one of the most common search-led pain points for interior detailing customers."
      ]
    },
    "odor-removal": {
      "related_products": [
        {
          "name": "Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)",
          "role": "source-cleaning support",
          "note": "Useful when the job needs agitation on interior surfaces before the deodorizing step begins."
        },
        {
          "name": "9 Piece Shop Vac Attachments",
          "role": "access support",
          "note": "Helps reach rails, seams, vents, and tight debris zones where odour sources often hide."
        }
      ],
      "things_to_know": [
        "Masking a smell is not the same thing as removing the source of the odour.",
        "Spills under seats, inside cargo liners, or within HVAC areas can change the labour and the likely result.",
        "If water intrusion or mould is suspected, the vehicle may need mechanical or body repair beyond detailing.",
        "A strong odor-removal page should explain why cleaning the source comes first and why some vehicles need inspection-led quoting."
      ]
    },
    "headlight-restoration": {
      "related_products": [
        {
          "name": "3 DScratch Remover",
          "role": "polish support",
          "note": "Useful for refinement and clarity-recovery stages after the failed outer layer has been worked down correctly."
        }
      ],
      "things_to_know": [
        "Severely cracked, crazed, or internally damaged housings may still need replacement rather than restoration alone.",
        "The clearer the lens becomes, the more noticeable any remaining internal damage can appear.",
        "Freshly restored lenses still need protection and sensible washing habits.",
        "Restoration pages work best when they explain the difference between surface oxidation and internal lens failure."
      ]
    },
    "paint-correction": {
      "related_products": [
        {
          "name": "3 DScratch Remover",
          "role": "correction support",
          "note": "Useful in defect-reduction and gloss-improvement workflows where the paint needs refinement rather than only a protection product."
        },
        {
          "name": "Chemical Guys Clay Luber",
          "role": "prep support",
          "note": "Supports the decontamination stage so polishing is not performed over bonded contamination."
        }
      ],
      "things_to_know": [
        "Paint correction removes or reduces visible defects; it is not the same thing as waxing or adding gloss only.",
        "Not every vehicle needs an aggressive cut step. Sometimes a lighter refinement path is the smarter and safer choice.",
        "The better the correction target, the more valuable the protection step becomes afterward.",
        "This page should explain goals, limitations, and why quote-led inspection matters for defect-removal work."
      ]
    },
    "graphene-finish": {
      "type": "addon",
      "related_code": "external_graphene_fine_finish",
      "enabled": true,
      "slug": "graphene-finish",
      "nav_group": "special-service",
      "name": "Graphene finish",
      "meta_title": "Graphene Finish Service in Oxford & Norfolk Counties | Rosie Dazzlers",
      "meta_description": "Learn how Rosie Dazzlers approaches graphene finish prep, what products are used, when exterior detailing is required first, and what customers should expect from gloss and maintenance behaviour.",
      "badge": "Special service landing page",
      "hero_title": "Graphene finish service",
      "hero_intro": "Graphene finish work is only worthwhile when the exterior has already been cleaned and prepared properly. This page explains the prep, the products, the finish expectations, and why graphene is tied to qualifying exterior-focused packages instead of being chosen alone.",
      "reasons_page_exists": [
        "Customers search for graphene as its own service, but the real result depends on the prep that happens before the product touches paint.",
        "This page explains why a graphene finish is tied to exterior or complete detailing rather than being treated like a stand-alone miracle step.",
        "It gives customers a clearer explanation of gloss, water behaviour, and maintenance expectations before they book."
      ],
      "process": [
        "Inspect the paint and confirm the vehicle is a good fit for a graphene-style finishing or protection step.",
        "Wash and decontaminate the exterior so the finish is not being applied over bonded contamination, residue, or neglected surfaces.",
        "Perform the level of refinement needed for the target result, then apply the graphene finish in controlled sections.",
        "Explain wash habits, maintenance expectations, and how the result should be cared for after the service."
      ],
      "equipment": [
        "paint-safe wash and decontamination products",
        "microfiber, applicators, and panel-prep workflow",
        "dual-action polishing support where refinement is needed before the graphene step",
        "controlled finishing workflow with inspection lighting"
      ],
      "highlights": [
        "Best for customers who want stronger gloss behaviour and a modern protection-style finish after exterior prep has already been handled.",
        "Requires a qualifying exterior or complete detailing path first because the finish is only as good as the surface underneath it.",
        "Useful for customers comparing graphene against wax or ceramic-style finishing options.",
        "Strong SEO topic because graphene is searched as a stand-alone term by customers who often need more education before booking."
      ],
      "things_to_know": [
        "Graphene is not a substitute for proper washing, decontamination, or correction work.",
        "If the paint is dull, contaminated, or heavily swirled, the finish stage alone will not solve those issues.",
        "This add-on is tied to base exterior-capable packages because prep is mandatory for a worthwhile result.",
        "Customers should still use safer washes and maintenance habits after the service."
      ],
      "official_links": [],
      "faq": [
        {
          "q": "Can a graphene finish be booked by itself?",
          "a": "No. It is tied to qualifying exterior or complete packages because the paint must be cleaned and prepared first."
        },
        {
          "q": "Is graphene the same as ceramic coating?",
          "a": "No. They are related protection conversations, but the product path, prep, and final expectations are not identical."
        },
        {
          "q": "Why explain the products used?",
          "a": "Because customers want proof that a graphene page reflects a real workflow and real materials, not generic marketing language."
        }
      ],
      "related_products": [
        {
          "name": "Adams Graphene Coating",
          "role": "main finish product",
          "note": "Used where a graphene-branded protection and gloss product fits the finish plan after prep."
        },
        {
          "name": "Turtle Wax Graphene",
          "role": "alternate graphene product",
          "note": "Useful when the service path calls for a graphene-style finishing product and practical maintenance support."
        },
        {
          "name": "Chemical Guys Clay Luber",
          "role": "prep support",
          "note": "Helpful during the decontamination stage before any graphene finish is applied."
        }
      ]
    },
    "full-clay-treatment": {
      "type": "addon",
      "related_code": "full_clay_treatment",
      "enabled": true,
      "slug": "full-clay-treatment",
      "nav_group": "special-service",
      "name": "Full clay treatment",
      "meta_title": "Full Clay Treatment for Vehicle Paint | Rosie Dazzlers",
      "meta_description": "Learn what a full clay treatment is, why bonded contamination matters, what products Rosie Dazzlers uses, and when a clay treatment should be paired with exterior detailing or correction work.",
      "badge": "Special service landing page",
      "hero_title": "Full clay treatment",
      "hero_intro": "A clay treatment is a decontamination service, not a gloss shortcut. It helps remove bonded contamination from the paint so the surface feels cleaner and later polishing or protection steps behave the way they should.",
      "reasons_page_exists": [
        "Many customers have heard of clay bars without understanding what contamination they remove or why the service matters before polishing and protection.",
        "This page explains what a full clay treatment does, where it fits in the workflow, and why it is tied to exterior-capable packages instead of standing alone in most cases.",
        "It gives the site a stronger service page for customers searching specifically for clay bar treatment or decontamination."
      ],
      "process": [
        "Wash the exterior thoroughly to remove loose dirt before any contact decontamination begins.",
        "Lubricate the panels properly and work the surface with the correct clay media for the paint condition.",
        "Check the finish for remaining contamination and decide whether further refinement or polishing is recommended.",
        "Follow with the next appropriate protection or correction step so the newly cleaned surface is not left unprotected."
      ],
      "equipment": [
        "clay bars, clay lubricant, and alternative clay media",
        "wash buckets, mitts, drying towels, and contamination-safe workflow",
        "inspection lighting and surface-checking methods",
        "microfiber and protection-stage support products"
      ],
      "highlights": [
        "Best for rough-feeling paint, fallout contamination, and prep before polishing or coating.",
        "Usually tied to exterior or complete detailing because the paint needs full wash support first.",
        "Useful as a prep service before wax, sealant, graphene, ceramic, or correction work."
      ],
      "things_to_know": [
        "Clay removes bonded contamination, but it can also reveal swirls or defects that were hidden by grime.",
        "A clay treatment is not meant to replace polishing or correction when the paint has visible defects.",
        "The dirtier or more contaminated the paint is, the more valuable proper lubrication and technique become.",
        "This page should educate customers that decontamination is part of prep, not a final finish by itself."
      ],
      "official_links": [],
      "faq": [
        {
          "q": "What does a clay treatment remove?",
          "a": "It targets bonded contamination that regular washing often leaves behind, such as rough-feeling fallout on the paint."
        },
        {
          "q": "Can clay be booked without exterior detailing?",
          "a": "Usually no. The surface still needs to be washed safely before clay work begins."
        },
        {
          "q": "Why would polishing be recommended after clay?",
          "a": "Because once contamination is removed, the true condition of the finish becomes easier to see."
        }
      ],
      "related_products": [
        {
          "name": "Chemical Guys Blue Clay Bar",
          "role": "clay media",
          "note": "Useful for bonded contamination removal when the finish needs a traditional clay approach."
        },
        {
          "name": "Chemical Guys Clay Luber",
          "role": "lubrication",
          "note": "Helps the clay step glide more safely while reducing the risk of dragging contamination."
        },
        {
          "name": "Rag Company Ultra Clay Mitt",
          "role": "alternate clay media",
          "note": "Helpful when the workflow calls for alternative clay-style decontamination media."
        },
        {
          "name": "Rag Company Ultra Clay Scrubber",
          "role": "decontamination support",
          "note": "Useful for practical decontamination work on paint that needs more than a basic wash."
        }
      ]
    },
    "engine-cleaning": {
      "type": "addon",
      "related_code": "engine_cleaning",
      "enabled": true,
      "slug": "engine-cleaning",
      "nav_group": "special-service",
      "name": "Engine cleaning",
      "meta_title": "Engine Cleaning Service | Rosie Dazzlers",
      "meta_description": "Learn how Rosie Dazzlers approaches engine-bay cleaning, what products and tools support the process, when it can be booked by itself, and what limits apply to older or more sensitive engine bays.",
      "badge": "Special service landing page",
      "hero_title": "Engine cleaning service",
      "hero_intro": "Engine cleaning is one of the few add-ons that can stand on its own when the vehicle and engine bay are a good fit. The goal is a cleaner, easier-to-maintain bay using sensible moisture control and product choice rather than reckless pressure or over-dressing.",
      "reasons_page_exists": [
        "Customers often want engine cleaning by itself, which makes it one of the clearer stand-alone add-on pages on the site.",
        "This page explains what the service is for, how the bay is approached, and where caution matters on older or more sensitive vehicles.",
        "It also helps separate proper engine-bay cleaning from quick visual dressing work that ignores sensitive areas."
      ],
      "process": [
        "Inspect the engine bay for loose parts, exposed electronics, heavy grease, aftermarket wiring, and general sensitivity.",
        "Remove loose debris first and apply the appropriate cleaners only where they make sense for the condition.",
        "Agitate safely, control moisture, and clean down the bay without treating it like a high-pressure wash-only job.",
        "Dry and finish the bay appropriately, then explain sensible maintenance expectations and limitations to the customer."
      ],
      "equipment": [
        "degreasing and grime-cutting chemicals used with care",
        "brushes, microfiber, and controlled low-moisture cleaning workflow",
        "protective masking or caution around sensitive areas where needed",
        "inspection lighting and finishing materials"
      ],
      "highlights": [
        "One of the clearer stand-alone add-ons because it does not always require a full main package first.",
        "Useful for cleaner presentation, easier maintenance, and under-hood visual improvement.",
        "Best when approached carefully, especially on older or modified vehicles."
      ],
      "things_to_know": [
        "Not every engine bay should be treated the same way, especially if it is old, fragile, heavily modified, or already has electrical issues.",
        "The goal is safe practical cleaning, not flooding the bay or chasing an unrealistic new-from-factory result.",
        "If heavy oil leaks or mechanical issues are present, those problems still need repair beyond detailing.",
        "This page should warn customers that condition and access change the labour and safe process."
      ],
      "official_links": [],
      "faq": [
        {
          "q": "Can engine cleaning be booked by itself?",
          "a": "Yes. It is one of the add-ons that can often stand alone when the bay is a good fit for the service."
        },
        {
          "q": "Is engine cleaning just spraying everything down?",
          "a": "No. A proper engine-bay service is about controlled cleaning, appropriate chemicals, and care around sensitive components."
        },
        {
          "q": "Will engine cleaning fix leaks or mechanical issues?",
          "a": "No. It improves cleanliness, but it does not repair oil leaks or electrical problems."
        }
      ],
      "related_products": [
        {
          "name": "Adams Tar Remover",
          "role": "spot cleaning support",
          "note": "Useful for breaking down stubborn grime or tar-like residue in targeted areas where appropriate."
        },
        {
          "name": "Meguiar's Heavy Duty Bug & Tar Remover",
          "role": "grime support",
          "note": "Helpful in selected contamination-heavy areas when the condition calls for additional grime-cutting support."
        },
        {
          "name": "9 Piece Shop Vac Attachments",
          "role": "dry debris access",
          "note": "Useful for removing loose debris from corners and tight access zones before chemical cleaning begins."
        }
      ]
    },
    "high-grade-paint-sealant": {
      "type": "addon",
      "related_code": "high_grade_paint_sealant",
      "enabled": true,
      "slug": "high-grade-paint-sealant",
      "nav_group": "special-service",
      "name": "High grade paint sealant",
      "meta_title": "High Grade Paint Sealant Service | Rosie Dazzlers",
      "meta_description": "Learn how Rosie Dazzlers applies paint sealant, when it makes sense, what products support the service, and how it compares with wax, graphene, and ceramic-style protection.",
      "badge": "Special service landing page",
      "hero_title": "High grade paint sealant service",
      "hero_intro": "A high grade paint sealant is a protection-focused add-on for customers who want stronger gloss and water behaviour than a simple wash alone, but who may not need a heavier correction or quote-led ceramic path.",
      "reasons_page_exists": [
        "Customers often compare wax, sealant, graphene, and ceramic without understanding how they differ in prep, durability, and cost.",
        "This page explains where a high grade paint sealant fits and why the exterior still needs to be cleaned properly first.",
        "It gives you a stronger page for customers who want practical paint protection without jumping straight to a more advanced coating path."
      ],
      "process": [
        "Wash and decontaminate the paint so the surface is ready for protection rather than trapping grime under the sealant.",
        "Inspect the finish and explain whether the paint is suitable for protection as-is or whether refinement is recommended first.",
        "Apply the sealant evenly and finish the surface so gloss and coverage are consistent.",
        "Explain wash habits and maintenance expectations so the protection step lasts as well as possible."
      ],
      "equipment": [
        "wash and decontamination support products",
        "paint-safe microfiber and applicators",
        "inspection lighting and surface prep workflow",
        "finishing and maintenance support products"
      ],
      "highlights": [
        "Good fit for customers wanting a practical protection upgrade without a deeper quote-led correction path.",
        "Usually paired with exterior or complete detailing because proper prep still matters.",
        "Useful middle ground between simpler wax-style protection and more involved correction/coating work."
      ],
      "things_to_know": [
        "Sealant is still only as good as the surface underneath it.",
        "A sealant improves protection and appearance, but it does not correct swirls or paint damage by itself.",
        "Exterior protection add-ons should not be chosen alone without the surrounding wash and prep work."
      ],
      "official_links": [],
      "faq": [
        {
          "q": "How is sealant different from wax?",
          "a": "Sealant is generally chosen for a stronger protection-focused result and more deliberate finish behaviour than a very short-term shine step."
        },
        {
          "q": "Can sealant be chosen without an exterior detail?",
          "a": "No. The paint still needs to be cleaned properly first."
        },
        {
          "q": "Why would someone choose sealant instead of ceramic?",
          "a": "Because it can be a more practical protection upgrade for customers who want better finish behaviour without committing to a larger ceramic-style process."
        }
      ],
      "related_products": [
        {
          "name": "DIYDetail Ceramic Gloss",
          "role": "finish support",
          "note": "Useful when the goal is a slicker, glossier protection-style finish after the paint has been prepared."
        },
        {
          "name": "Turtle Wax Hybrid",
          "role": "protection support",
          "note": "Supports practical paint protection workflows where a customer wants easier wash maintenance and finish behaviour."
        },
        {
          "name": "Turtle Wax Ice",
          "role": "finish support",
          "note": "Helpful for gloss-oriented finishing paths where the paint has already been cleaned properly."
        }
      ]
    },
    "uv-protectant": {
      "type": "addon",
      "related_code": "uv_protectant_applied_on_interior_panels",
      "enabled": true,
      "slug": "uv-protectant",
      "nav_group": "special-service",
      "name": "UV protectant applied on interior panels",
      "meta_title": "UV Protectant for Interior Panels | Rosie Dazzlers",
      "meta_description": "Learn how Rosie Dazzlers approaches UV protectant on interior panels, why a complete detail is usually required first, and what products support the finishing stage.",
      "badge": "Special service landing page",
      "hero_title": "UV protectant applied on interior panels",
      "hero_intro": "UV protectant is a finishing and preservation step, not a shortcut around cleaning. It works best after the interior is properly cleaned and, in your workflow, after the complete-detail path that also addresses the glass and surrounding surfaces.",
      "reasons_page_exists": [
        "Customers often see interior protection as a quick wipe-on service without understanding the cleaning prep underneath it.",
        "This page explains why UV protectant is tied to a fuller package instead of being chosen by itself.",
        "It also gives you a stronger service page for customers who want dashboard, trim, and panel preservation explained clearly."
      ],
      "process": [
        "Clean the relevant interior surfaces first so the protectant is not being applied over film, dust, or residue.",
        "Complete the surrounding detail work needed for the finish to make sense visually, including the glass-related prep your workflow depends on.",
        "Apply the protectant evenly to the right surfaces and level the finish so it looks intentional rather than greasy.",
        "Explain maintenance expectations, including realistic reapplication timing and gentle wipe-down habits."
      ],
      "equipment": [
        "interior-safe cleaners and agitation tools",
        "microfiber finishing cloths",
        "trim-safe protectant products",
        "glass and surrounding detail workflow support"
      ],
      "highlights": [
        "Best for customers who want cleaner-looking interior panels and more deliberate upkeep on high-touch trim areas.",
        "Tied to a complete-detail path because the surrounding cleaning and glass work matter before the finishing step is applied.",
        "Useful for customers comparing basic wipe-downs against a more finished interior-preservation step."
      ],
      "things_to_know": [
        "Protectant should not be applied over dirty or neglected surfaces if you want the finish to look intentional.",
        "Too much product or poor leveling can leave the interior looking uneven or greasy.",
        "This add-on is tied to the complete-detail path in your workflow because both the surrounding surfaces and the windows need to be handled first."
      ],
      "official_links": [],
      "faq": [
        {
          "q": "Can UV protectant be booked by itself?",
          "a": "No. In your workflow it requires the complete-detail path first so the surrounding surfaces and windows are already handled properly."
        },
        {
          "q": "Is UV protectant the same thing as cleaning?",
          "a": "No. It is a finishing and preservation step that comes after proper cleaning."
        },
        {
          "q": "Why explain the prep on this page?",
          "a": "Because customers often underestimate how much the final appearance depends on the cleaning work underneath."
        }
      ],
      "related_products": [
        {
          "name": "Stoner Car Care 92034 2 PK 22 Ounce Trim Shine Protectant for Interior and Exterior Restores, Moisturizes, and Conditions Vinyl, Rubber, Leather and More, Pack of 2",
          "role": "protectant product",
          "note": "Supports trim and panel finishing where the goal is a cleaner-looking, conditioned surface rather than a greasy dressing effect."
        },
        {
          "name": "Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)",
          "role": "prep tool",
          "note": "Useful for the cleaning stage before the protectant is applied."
        }
      ]
    },
    "exterior-wax": {
      "type": "addon",
      "related_code": "external_wax",
      "enabled": true,
      "slug": "exterior-wax",
      "nav_group": "special-service",
      "name": "Exterior wax",
      "meta_title": "Exterior Wax Service | Rosie Dazzlers",
      "meta_description": "Learn when exterior wax makes sense, how Rosie Dazzlers approaches prep, what products support the service, and how wax compares with sealant, graphene, and ceramic-style protection.",
      "badge": "Special service landing page",
      "hero_title": "Exterior wax service",
      "hero_intro": "Exterior wax is a practical protection and gloss add-on when the vehicle has already been washed and prepared properly. It is a simpler protection conversation than ceramic or graphene, but the prep still matters.",
      "reasons_page_exists": [
        "Customers still search for wax specifically, even when newer protection terms dominate social media and detailing ads.",
        "This page explains where wax fits, when it makes sense, and why the exterior must be cleaned first.",
        "It gives the site a useful page for customers who want a classic protection step explained clearly."
      ],
      "process": [
        "Wash and dry the exterior thoroughly so wax is not applied over dirt or loose contamination.",
        "Check whether the paint needs light decontamination or refinement before protection is applied.",
        "Apply the wax evenly and finish the surface so the protection and gloss look consistent.",
        "Explain realistic durability and maintenance expectations so customers understand how wax compares with sealant, graphene, or coating paths."
      ],
      "equipment": [
        "wash and drying materials",
        "applicators, microfiber, and finish-checking workflow",
        "decontamination support where needed",
        "protection-stage products matched to customer goals"
      ],
      "highlights": [
        "Good fit for customers who want a practical gloss and protection boost without moving into a larger coating discussion.",
        "Requires exterior-capable package support because prep still matters before wax is applied.",
        "Useful comparison page for customers deciding between wax, sealant, graphene, and ceramic options."
      ],
      "things_to_know": [
        "Wax does not replace cleaning, decontamination, or correction work when the paint condition is poor.",
        "It is usually a simpler and shorter-term protection conversation than a coating-focused service.",
        "The page should explain durability honestly so customers choose the right protection path for their habits and budget."
      ],
      "official_links": [],
      "faq": [
        {
          "q": "Is wax still worth offering?",
          "a": "Yes. Many customers still want a practical gloss and protection step that is easier and less involved than a larger coating path."
        },
        {
          "q": "Can wax be chosen alone?",
          "a": "No. The exterior still needs the surrounding wash and prep work first."
        },
        {
          "q": "How is wax different from sealant or graphene?",
          "a": "Wax is generally the simpler protection conversation, while sealant, graphene, and ceramic-style options are chosen for different finish and maintenance expectations."
        }
      ],
      "related_products": [
        {
          "name": "Meguiar's Ultimate Quik Wax, 709 m L Durable Protection, Quick & Easy G 200924 C",
          "role": "wax product",
          "note": "Useful when the customer wants a practical wax-based protection and gloss path after proper exterior prep."
        },
        {
          "name": "Turtle Wax Ice",
          "role": "finish support",
          "note": "Supports slicker finish behaviour in a wax-style protection conversation."
        },
        {
          "name": "Turtle Wax Slickn Shine",
          "role": "maintenance support",
          "note": "Useful for customers who want easier upkeep after a wax-oriented finishing service."
        }
      ]
    },
    "de-ionizing-treatment": {
      "type": "addon",
      "related_code": "de_ionizing_treatment",
      "enabled": true,
      "slug": "de-ionizing-treatment",
      "nav_group": "special-service",
      "name": "De-ionizing treatment",
      "meta_title": "De-Ionizing Treatment for Spot-Free Rinsing | Rosie Dazzlers",
      "meta_description": "Learn how Rosie Dazzlers uses de-ionized water support for cleaner rinsing, reduced spotting, and more controlled finishing on exterior detailing work.",
      "badge": "Special service landing page",
      "hero_title": "De-ionizing treatment",
      "hero_intro": "A de-ionizing treatment is about controlling mineral-heavy water behaviour so the final rinse and finish stages stay cleaner, safer, and less spot-prone. It makes the most sense around exterior work where water quality can influence the result.",
      "reasons_page_exists": [
        "Most customers have never seen de-ionized water explained clearly, even though it can make a visible difference in rinse and dry behaviour.",
        "This page explains why the treatment belongs inside an exterior-focused workflow instead of being treated like a random upsell.",
        "It also gives you a service page that feels more expert and process-led than many competitor sites."
      ],
      "process": [
        "Set up the rinse path with the appropriate water-management support before the final finishing stages begin.",
        "Use the de-ionizing support where the water quality or spotting risk makes it worthwhile.",
        "Finish drying and inspection with the reduced spotting risk in mind.",
        "Explain why the service is a support stage inside the exterior workflow rather than a cosmetic add-on by itself."
      ],
      "equipment": [
        "water-management support tools",
        "de-ionizing hardware and related setup",
        "drying towels and final inspection workflow",
        "exterior-safe wash and rinse staging"
      ],
      "highlights": [
        "Useful when water spotting risk is a concern and final rinse quality matters.",
        "Tied to exterior-capable work rather than a stand-alone cosmetic result.",
        "Helps the site explain a more technical process many local competitors do not describe well."
      ],
      "things_to_know": [
        "This treatment supports the final result; it does not replace washing, decontamination, or drying technique.",
        "The benefit is easier to appreciate on spotting-prone finishes or during harder-water conditions.",
        "It belongs inside the exterior workflow, not as a stand-alone service page with no surrounding context."
      ],
      "official_links": [],
      "faq": [
        {
          "q": "What is de-ionized water doing in detailing?",
          "a": "It helps reduce mineral-heavy rinse behaviour so final drying and finishing are less spot-prone."
        },
        {
          "q": "Can this be booked by itself?",
          "a": "No. It works as part of exterior detailing, not as a separate cosmetic service."
        }
      ],
      "related_products": [
        {
          "name": "HGWater Deionizer",
          "role": "water-management system",
          "note": "Supports lower-mineral rinsing when the finish would benefit from a cleaner final water stage."
        },
        {
          "name": "VEVORWater Tank Bladder",
          "role": "water handling support",
          "note": "Supports mobile water management workflow when the service setup needs more controlled rinse planning."
        }
      ]
    },
    "tillsonburg-auto-detailing": {
      "highlights": [
        "Useful as the core local page for the home-base service area where stronger local wording can improve trust and conversion.",
        "Lets the site explain mobile setup expectations, seasonal water rules, and practical driveway-access details for Tillsonburg customers.",
        "Supports a more professional, information-rich location page than most local detailing sites provide."
      ],
      "reasons_page_exists": [
        "Tillsonburg is a core local service area, so it deserves a page that feels locally useful rather than just a duplicate of the county-wide services page.",
        "This page gives customers practical location notes that matter to mobile detailing, such as watering rules, parking considerations, and household-power timing context.",
        "It also gives the site a stronger place-first page for local searches and internal linking."
      ],
      "process": [
        "Confirm the service address, package fit, and driveway / access setup before the appointment.",
        "Use the page to explain practical local considerations like outdoor water rules and overnight street rules before the day of service.",
        "Keep current proof, booking links, and local information close together so Tillsonburg visitors do not need to hunt for essentials.",
        "Use the page over time to grow place-based visibility with more local photos, reviews, and service examples."
      ],
      "things_to_know": [
        "Tillsonburg outdoor water restrictions run from May 1 to September 30, with separate even/odd-day windows that can matter for driveway-based exterior work.",
        "Tillsonburg winter overnight street parking restrictions typically run from November 15 to March 31 between 2 a.m. and 6 a.m., which can matter for on-street vehicles.",
        "Ontario Time-of-Use electricity pricing keeps evenings, weekends, and holidays as lower-cost periods for many customers using household power during a mobile service.",
        "A strong town page should give practical local setup information, not just repeat the same generic service copy."
      ]
    },
    "woodstock-ingersoll-auto-detailing": {
      "things_to_know": [
        "Woodstock has official outside-water use windows for residential and commercial properties, which can matter for exterior-detail planning during the warmer season.",
        "Ingersoll has municipal parking information and permit details that can matter where driveway or curb access is limited.",
        "Ontario Time-of-Use pricing keeps evenings, weekends, and holidays as lower-cost household periods for many customers supplying power at home.",
        "This page should combine route-area relevance with practical customer information rather than acting like a thin county duplicate."
      ]
    },
    "simcoe-delhi-auto-detailing": {
      "highlights": [
        "Useful for local search visitors who want stronger Norfolk-side proof before they call or book.",
        "Lets the site explain county watering, parking, and mobile-access considerations that are different from broader Oxford-focused pages.",
        "Creates a stronger internal-link destination than a generic county mention alone."
      ]
    },
    "port-dover-auto-detailing": {
      "highlights": [
        "Useful for local search visitors who want visible proof before they call or book.",
        "Supports coastal-area wording and stronger local relevance signals.",
        "Creates a more useful internal-link destination than a generic county mention.",
        "Lets the site talk about seasonal traffic, parking, and waterfront access issues that can affect mobile service timing."
      ]
    }
  }
};
const ADDON_LANDING_PAGE_TEMPLATES = {
  "de-badging": {
    "related_code": "de_badging",
    "name": "De-badging",
    "meta_title": "De-Badging Service in Oxford & Norfolk Counties | Rosie Dazzlers",
    "meta_description": "Learn how Rosie Dazzlers approaches de-badging, adhesive removal, residue cleanup, paint-safe finishing, and why this service is usually inspection-led before booking.",
    "hero_title": "De-badging service",
    "hero_intro": "De-badging removes emblems, dealer stickers, and leftover adhesive safely so the panel looks cleaner without leaving obvious residue or unnecessary damage behind.",
    "reasons_page_exists": [
      "Customers search for badge removal as its own service because they want a cleaner look without trying risky DIY scraping at home.",
      "This page explains why de-badging is more than pulling off a logo — adhesive, age, paint condition, and leftover ghosting all matter.",
      "It also gives local customers a clear explanation before they request a quote or pair the service with polishing and protection."
    ],
    "process": [
      "Inspect the badge, adhesive condition, panel age, and paint sensitivity before removing anything.",
      "Soften and lift the badge or decal carefully, then remove leftover adhesive without rushing into harsh scraping.",
      "Clean and refine the panel so residue, haze, or sticky areas are not left behind.",
      "Explain whether follow-up polishing or protection is recommended because older badges can leave visible paint contrast behind."
    ],
    "equipment": [
      "adhesive-removal chemicals used in controlled amounts",
      "plastic-safe trim tools and residue-lifting workflow",
      "microfiber, panel-safe cleaners, and paint-finishing support",
      "inspection lighting to check for ghosting, haze, or leftover residue"
    ],
    "highlights": [
      "Best for customers removing dealer branding, old model badges, or unwanted emblems.",
      "Often pairs well with exterior detailing or polishing because badge removal can reveal a cleaner panel that still needs refinement.",
      "Quote-led when the badge age, adhesive load, or paint condition suggests more careful labour."
    ],
    "things_to_know": [
      "Older badges can leave a visible paint shadow because the surrounding panel has aged differently.",
      "Adhesive residue can take longer than the actual badge removal itself.",
      "Paint condition matters — a weak or previously repainted panel deserves extra caution."
    ],
    "faq": [
      {
        "q": "Can de-badging be done without harming the paint?",
        "a": "Often yes, but the answer depends on adhesive age, panel condition, and whether the paint has prior damage or repaint history."
      },
      {
        "q": "Why might polishing be recommended afterward?",
        "a": "Because once the badge is gone, leftover haze, adhesive marks, or paint contrast can be easier to see."
      },
      {
        "q": "Is this always a stand-alone service?",
        "a": "Not always. It can stand alone, but many customers pair it with exterior cleaning or polishing so the panel looks finished afterwards."
      }
    ],
    "related_products": [
      {
        "name": "Adams Tar Remover",
        "role": "adhesive cleanup support",
        "note": "Useful for breaking down sticky badge residue after the emblem has been lifted."
      },
      {
        "name": "Car Pro Tar X",
        "role": "residue removal support",
        "note": "Helps with stubborn leftover adhesive and tar-like residue in controlled paint-safe cleanup work."
      },
      {
        "name": "3 DScratch Remover",
        "role": "refinement support",
        "note": "Useful when the panel needs light finishing after badge removal exposes haze or older marks."
      }
    ]
  },
  "two-stage-polish": {
    "related_code": "two_stage_polish",
    "name": "Two stage polish",
    "meta_title": "Two Stage Polish Service in Oxford & Norfolk Counties | Rosie Dazzlers",
    "meta_description": "Learn how Rosie Dazzlers approaches two-stage polishing, when cutting and refining make sense, what products support the workflow, and why inspection matters before defect-removal work.",
    "hero_title": "Two stage polish service",
    "hero_intro": "Two-stage polishing is a more deliberate defect-reduction service for paint that needs both a stronger correction step and a separate refining step before protection is applied.",
    "reasons_page_exists": [
      "Customers often hear “polish” used as a vague term, but a two-stage polish is a very specific correction workflow.",
      "This page explains when a heavier cut and a second finishing step make sense instead of a lighter one-step improvement.",
      "It also helps customers understand why this service is typically quote-led and tied to paint condition rather than promised as a flat universal fix."
    ],
    "process": [
      "Inspect the paint under proper light and decide whether the vehicle really needs a two-stage correction path.",
      "Wash and decontaminate the exterior so polishing is done on a clean, honest surface.",
      "Use a stronger first stage to reduce swirls, oxidation, or heavier defects, then refine with a second stage for better gloss and clarity.",
      "Protect the finish after polishing and explain maintenance expectations so the result lasts longer."
    ],
    "equipment": [
      "dual-action polishers, pads, compounds, and refinement-stage polishes",
      "wash, decontamination, and panel-prep workflow",
      "inspection lighting and masking materials",
      "microfiber and protection-stage products after correction"
    ],
    "highlights": [
      "Best for vehicles with more visible swirls, haze, oxidation, or tired gloss than a light polish would realistically solve.",
      "Usually paired with ceramic, graphene, sealant, or wax because the corrected finish should be protected afterward.",
      "Quote-led because defect depth, paint condition, and vehicle size all change the labour."
    ],
    "things_to_know": [
      "Two-stage polishing is more involved than a simple gloss enhancement.",
      "Not every defect can be removed safely if it is too deep in the paint.",
      "The better the correction goal, the more important good washing habits become afterward."
    ],
    "faq": [
      {
        "q": "How is a two-stage polish different from a one-stage polish?",
        "a": "A two-stage polish uses a stronger correction step first and a separate refining step after that, which usually takes more labour but can deliver a better finish on tougher paint."
      },
      {
        "q": "Does every vehicle need two stages?",
        "a": "No. Some vehicles only need a lighter refinement. Inspection matters so the service matches the real paint condition."
      },
      {
        "q": "Can it be booked online without discussion?",
        "a": "It is usually quote-led because paint condition and finish expectations change the actual workload."
      }
    ],
    "related_products": [
      {
        "name": "3 DScratch Remover",
        "role": "correction support",
        "note": "Useful in the heavier defect-reduction stage where the paint needs more than a simple finishing product."
      },
      {
        "name": "Chemical Guys Clay Luber",
        "role": "prep support",
        "note": "Used during decontamination prep so polishing is not performed over bonded contamination."
      },
      {
        "name": "DIYDetail Ceramic Gloss",
        "role": "post-polish protection support",
        "note": "Helpful after refining when the finish is ready for gloss support and ongoing care."
      }
    ]
  },
  "external-ceramic-coating": {
    "related_code": "external_ceramic_coating",
    "name": "External ceramic coating",
    "meta_title": "External Ceramic Coating Service | Rosie Dazzlers",
    "meta_description": "Exterior ceramic coating information, including prep, decontamination, polishing decisions, products used, and why the coating stage depends on a properly detailed surface first.",
    "hero_title": "External ceramic coating service",
    "hero_intro": "Exterior ceramic coating is a prep-driven protection service. The coating matters, but the real quality of the result depends on how well the paint is washed, decontaminated, and refined before application.",
    "reasons_page_exists": [
      "Customers often search for ceramic coating as a stand-alone purchase when the real service is prep plus protection together.",
      "This page explains the exterior-only coating path in plain language so customers understand why coating is not chosen by itself without proper prep.",
      "It also gives Rosie Dazzlers a clearer landing page for exterior-coating intent than a generic package page alone."
    ],
    "process": [
      "Inspect paint condition and explain whether polishing, correction, or refinement is recommended before coating.",
      "Wash and decontaminate the surface thoroughly so the coating is not applied over fallout, residue, or neglected paint.",
      "Apply the ceramic product in controlled sections, level the coating properly, and protect the finish during cure timing.",
      "Explain ongoing maintenance so the coated finish keeps performing the way the customer expects."
    ],
    "equipment": [
      "panel-prep chemicals, decontamination support, and wash-safe workflow",
      "dual-action polishing support when refinement is needed before coating",
      "ceramic applicators, leveling towels, and controlled section-by-section application",
      "inspection lighting and microfiber-safe final finishing materials"
    ],
    "highlights": [
      "Best for customers who want stronger wash behaviour and longer-term protection after exterior prep has been handled properly.",
      "Usually connected to exterior or complete detailing because the paint must be made coating-ready first.",
      "High-intent local SEO topic because ceramic coating is one of the most searched detailing upgrades."
    ],
    "things_to_know": [
      "Ceramic coating does not fix neglected paint by itself.",
      "If the paint is swirled, oxidized, or contaminated, those problems usually need to be addressed first.",
      "The better the prep, the better the coating feels in real ownership after the appointment."
    ],
    "faq": [
      {
        "q": "Can ceramic coating be booked by itself?",
        "a": "Not usually. The vehicle still needs proper washing and preparation before the coating stage is worthwhile."
      },
      {
        "q": "How is this different from wax?",
        "a": "Ceramic coating is a different protection path with different prep, behaviour, and maintenance expectations than a shorter-term wax step."
      },
      {
        "q": "Why does paint condition affect the quote?",
        "a": "Because defect level, vehicle size, and prep needs all change how much work happens before the coating is applied."
      }
    ],
    "related_products": [
      {
        "name": "10 HCeramic Coating",
        "role": "main coating product",
        "note": "Used when a stronger ceramic-style protection path fits the paint and service goal."
      },
      {
        "name": "DIYDetail Ceramic Gloss",
        "role": "ceramic support / maintenance product",
        "note": "Helpful for gloss support and coating-friendly maintenance behaviour after prep."
      },
      {
        "name": "Turtle Wax 53409 Hybrid Solutions Ceramic Spray Coating, Incredible Shine & Protection for Car Paint, Extreme Water Beading, Safe for Cars, Trucks, Motorcycles, RV's & More, 16 oz.",
        "role": "ceramic protection support",
        "note": "Useful in practical ceramic-style protection workflows and ongoing care discussions."
      }
    ]
  },
  "vinyl-wrapping": {
    "related_code": "vinyl_wrapping",
    "name": "Vinyl wrapping",
    "meta_title": "Vinyl Wrapping Preparation and Service Information | Rosie Dazzlers",
    "meta_description": "Learn how Rosie Dazzlers approaches vinyl wrapping requests, panel prep, realistic scope, tools, and when wrapping jobs require inspection or a more specialized planning path.",
    "hero_title": "Vinyl wrapping service information",
    "hero_intro": "Vinyl wrapping depends heavily on surface prep, panel shape, edges, and finish condition. This page explains the practical workflow, why some jobs are quote-led, and what customers should understand before choosing a wrap-based service.",
    "reasons_page_exists": [
      "Customers often ask about wrap work as if it behaves like a quick add-on, when the real job depends on prep, panel shape, and surface condition.",
      "This page gives Rosie Dazzlers a cleaner explanation of what wrapping involves before anyone assumes it is the same as a wash or coating upgrade.",
      "It also helps the site target wrap-related questions while keeping booking expectations realistic."
    ],
    "process": [
      "Inspect the panel condition, shape, trim edges, and overall scope so the wrap plan matches the real surface.",
      "Clean and prepare the surface thoroughly because dirt, oils, or old residue reduce wrap quality and longevity.",
      "Measure, position, and apply the vinyl carefully while managing edges, curves, and finish alignment.",
      "Check edges and finish quality, then explain aftercare so the wrap keeps looking its best."
    ],
    "equipment": [
      "surface-prep workflow, degreasing support, and careful panel cleaning",
      "wrap tools, squeegees, trim-safe handling, and edge management",
      "microfiber, inspection lighting, and controlled finishing workflow",
      "protective materials for surrounding trim and paint-safe access"
    ],
    "highlights": [
      "Useful for customers wanting a visual change, accent work, or selected wrapped areas rather than a full repaint path.",
      "Best treated as an inspection-led service because edges, trim, and panel condition all matter.",
      "A strong page topic because wrap-related questions often need more explanation than a normal detailing package page provides."
    ],
    "things_to_know": [
      "Wrapping is highly surface-dependent. Contaminated or damaged panels create weaker wrap results.",
      "Some jobs are better suited to specialist planning than instant online booking.",
      "Aftercare matters: aggressive washing, edge lifting, or harsh chemicals can shorten wrap life."
    ],
    "faq": [
      {
        "q": "Can vinyl wrapping be booked instantly like a normal add-on?",
        "a": "Usually it is better handled as an inspection-led service because panel shape, edge complexity, and scope all affect the job."
      },
      {
        "q": "Why talk so much about prep?",
        "a": "Because vinyl only behaves well when the surface underneath is properly cleaned and ready for adhesion."
      },
      {
        "q": "Is wrap care different from normal washing?",
        "a": "Yes. Wraps benefit from gentler care and attention to edges and finish-safe cleaning habits."
      }
    ],
    "related_products": [
      {
        "name": "Pro Vinyl Wrap Kit",
        "role": "main wrap workflow kit",
        "note": "Directly tied to wrap installation and practical handling for vinyl work."
      },
      {
        "name": "Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)",
        "role": "prep support",
        "note": "Useful where vinyl-safe prep and cleaning is needed before wrap work or related trim prep."
      }
    ]
  },
  "window-tinting": {
    "related_code": "window_tinting",
    "name": "Window tinting",
    "meta_title": "Window Tinting Service Information | Rosie Dazzlers",
    "meta_description": "Learn how Rosie Dazzlers approaches window tinting requests, glass prep, inspection, realistic quoting, and what customers should know before booking tint work.",
    "hero_title": "Window tinting service information",
    "hero_intro": "Window tinting depends on clean glass, material choice, and careful installation. This page explains the workflow, what to expect, and why tint work is usually inspection-led rather than treated like a quick online add-on.",
    "reasons_page_exists": [
      "Customers search directly for tinting, but many do not realize how much clean glass prep and installation skill matter.",
      "This page gives Rosie Dazzlers a clearer explanation of tint work, scope, and expectations before people assume it is a simple instant upgrade.",
      "It also creates a landing page that can support local tinting intent while keeping the booking path realistic."
    ],
    "process": [
      "Inspect the vehicle glass, legal considerations, and the requested tint scope before confirming the work plan.",
      "Clean the glass thoroughly because residue or contamination will affect the final finish and adhesion.",
      "Install the tint carefully while managing edges, fit, and final appearance.",
      "Explain cure time, aftercare, and what the customer should avoid immediately after installation."
    ],
    "equipment": [
      "glass-prep workflow and contamination-free cleaning",
      "installation tools, squeegees, and trim-safe handling",
      "lighting and close visual checks for bubbles, edges, and finish quality",
      "aftercare guidance for cure time and early maintenance"
    ],
    "highlights": [
      "Useful for customers wanting heat, glare, or privacy improvement with a cleaner finished look.",
      "Best handled as a quote-led or inspection-led service because tint scope and film choice change the labour.",
      "A strong search topic that benefits from a dedicated page instead of being buried inside a generic add-on list."
    ],
    "things_to_know": [
      "Fresh tint needs cure time and should not be disturbed immediately after installation.",
      "Proper glass cleaning is one of the biggest factors in the final look.",
      "Tint services can involve legal and visibility considerations depending on the vehicle and chosen darkness."
    ],
    "faq": [
      {
        "q": "Why is tinting not treated like a normal click-and-go add-on?",
        "a": "Because glass condition, tint scope, and film choice all change the labour and planning involved."
      },
      {
        "q": "Does the glass really need special prep first?",
        "a": "Yes. Clean, contamination-free glass is one of the most important parts of a good tint result."
      },
      {
        "q": "Can I use the windows normally right away?",
        "a": "New tint usually needs cure time, so customers should follow aftercare instructions before rolling windows repeatedly."
      }
    ],
    "related_products": []
  }
};


const PRICING_CATALOG_DEFAULT = fallbackPricingCatalog && typeof fallbackPricingCatalog === "object" ? fallbackPricingCatalog : {};
const PRODUCT_CATALOG_DEFAULT = Array.isArray(fallbackProductCatalog) ? fallbackProductCatalog : [];

const ADDON_LANDING_PAGE_MAP = {
  full_clay_treatment: "full-clay-treatment",
  two_stage_polish: "two-stage-polish",
  high_grade_paint_sealant: "high-grade-paint-sealant",
  uv_protectant_applied_on_interior_panels: "uv-protectant",
  de_ionizing_treatment: "de-ionizing-treatment",
  de_badging: "de-badging",
  engine_cleaning: "engine-cleaning",
  external_ceramic_coating: "external-ceramic-coating",
  external_graphene_fine_finish: "graphene-finish",
  external_wax: "exterior-wax",
  vinyl_wrapping: "vinyl-wrapping",
  window_tinting: "window-tinting"
};

const GENERATED_ADDON_LANDING_PAGES = buildGeneratedAddonPages();

function buildGeneratedAddonPages() {
  const pages = {};
  const addons = Array.isArray(PRICING_CATALOG_DEFAULT?.addons) ? PRICING_CATALOG_DEFAULT.addons : [];
  for (const addon of addons) {
    const code = String(addon?.code || "").trim();
    if (!code) continue;
    const slug = ADDON_LANDING_PAGE_MAP[code] || String(code).trim().replace(/_/g, "-");
    const template = ADDON_LANDING_PAGE_TEMPLATES[slug] || {};
    const addonName = String(addon?.name || template.name || code).trim();
    pages[slug] = {
      type: "addon",
      related_code: code,
      enabled: true,
      slug,
      nav_group: template.nav_group || "addon-service",
      name: template.name || addonName,
      meta_title: template.meta_title || `${addonName} | Rosie Dazzlers`,
      meta_description: template.meta_description || template.hero_intro || `${addonName} service information for Rosie Dazzlers customers in Oxford and Norfolk Counties.`,
      badge: template.badge || "Add-on landing page",
      hero_title: template.hero_title || addonName,
      hero_intro: template.hero_intro || `${addonName} service information, process, tools, booking fit, and practical expectations.`,
      reasons_page_exists: template.reasons_page_exists || [
        `${addonName} is a service people search for directly, so it deserves a clearer page than a generic add-on row.`,
        `This page explains how ${addonName.toLowerCase()} fits into a real detailing workflow before someone books or requests a quote.`,
        `It also gives Rosie Dazzlers a stronger local destination for service-specific search intent.`
      ],
      process: template.process || [],
      equipment: template.equipment || [],
      highlights: template.highlights || [],
      things_to_know: template.things_to_know || [],
      official_links: template.official_links || [],
      faq: template.faq || [],
      related_products: normalizeProductRefList(template.related_products || [])
    };
  }
  return { pages };
}

function normalizeProductRefList(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    name: String(row?.name || "").trim(),
    role: String(row?.role || "").trim(),
    note: String(row?.note || "").trim()
  })).filter((row) => row.name);
}

const SYSTEM_LANDING_PAGES = mergeLandingPages(mergeLandingPages(DEFAULT_LANDING_PAGES, LANDING_PAGE_EXPANSIONS), GENERATED_ADDON_LANDING_PAGES);

export async function onRequestGet({ env }) {
  try {
    const landingPages = await loadLandingPages(env);
    return withCors(json({ ok: true, ...landingPages }));
  } catch (err) {
    return withCors(json({ ok: true, ...SYSTEM_LANDING_PAGES, warning: err?.message || "Could not load saved landing pages; using fallback defaults." }, 200));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadLandingPages(env) {
  const fallback = cloneLandingPages(SYSTEM_LANDING_PAGES);
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
    related_products: normalizeProductRefs(page?.related_products),
    hero_image_url: String(page?.hero_image_url || "").trim(),
    gallery_images: normalizeStringArray(page?.gallery_images),
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

function normalizeProductRefs(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    name: String(item?.name || item?.title || "").trim(),
    role: String(item?.role || "").trim(),
    note: String(item?.note || "").trim()
  })).filter((item) => item.name);
}

function cloneLandingPages(payload) {
  const raw = JSON.parse(JSON.stringify(payload || SYSTEM_LANDING_PAGES));
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
