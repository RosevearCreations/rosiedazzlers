import { serviceHeaders } from "./_lib/staff-auth.js";

const PRODUCTS = {
  "Adams Graphene Coating": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/AdamsGrapheneCoating.jpg",
  "Turtle Wax Graphene": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/TurtleWaxGraphene.jpg",
  "Chemical Guys Blue Clay Bar": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/ChemicalGuysBlueClayBar.jpg",
  "Chemical Guys Clay Luber": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/ChemicalGuysClayLuber.jpg",
  "Rag Company Ultra Clay Mitt": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/RagCompanyUltraClayMitt.jpg",
  "Rag Company Ultra Clay Scrubber": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/RagCompanyUltraClayScrubber.jpg",
  "DIYDetail Ceramic Gloss": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/DIYDetailCeramicGloss.jpg",
  "10 HCeramic Coating": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/10HCeramicCoating.jpg",
  "Turtle Wax 53409 Hybrid Solutions Ceramic Spray Coating, Incredible Shine & Protection for Car Paint, Extreme Water Beading, Safe for Cars, Trucks, Motorcycles, RV's & More, 16 oz.": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/Turtle%20Wax%2053409%20Hybrid%20Solutions%20Ceramic%20Spray%20Coating%2C%20Incredible%20Shine%20%26%20Protection%20for%20Car%20Paint%2C%20Extreme%20Water%20Beading%2C%20Safe%20for%20Cars%2C%20Trucks%2C%20Motorcycles%2C%20RV%27s%20%26%20More%2C%2016%20oz..jpg",
  "Stoner Car Care 92034 2 PK 22 Ounce Trim Shine Protectant for Interior and Exterior Restores, Moisturizes, and Conditions Vinyl, Rubber, Leather and More, Pack of 2": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/Stoner%20Car%20Care%2092034-2PK%2022-Ounce%20Trim%20Shine%20Protectant%20for%20Interior%20and%20Exterior%20Restores%2C%20Moisturizes%2C%20and%20Conditions%20Vinyl%2C%20Rubber%2C%20Leather%20and%20More%2C%20Pack%20of%202.jpg",
  "3 DScratch Remover": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/3DScratchRemover.jpg",
  "Adams Tar Remover": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/AdamsTarRemover.jpg",
  "Car Pro Tar X": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/CarProTarX.jpg",
  "HGWater Deionizer": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/HGWaterDeionizer.jpg",
  "Car Pro Iron X": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/CarProIronX.jpg",
  "Meguiar's Heavy Duty Bug & Tar Remover": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/MeguiarsHeavyDutyBugTarRemover.jpg",
  "9 Piece Shop Vac Attachments": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/9PieceShopVacAttachments.jpg",
  "Pro Vinyl Wrap Kit": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/ProVinylWrapKit.jpg",
  "Invisible Glass": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/InvisibleGlass.jpg",
  "Invisible Glass Glass Coating": "https://pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev/products/InvisibleGlassGlassCoating.jpg"
};

function product(name, role, note) {
  return {
    name,
    role,
    note,
    image_url: PRODUCTS[name] || ""
  };
}

function normalizeSlug(value) {
  return String(value || "").trim().toLowerCase();
}

function addonPage({
  slug,
  related_code,
  name,
  badge = "Add-on landing page",
  hero_intro,
  reasons_page_exists = [],
  highlights = [],
  process = [],
  equipment = [],
  things_to_know = [],
  related_products = [],
  faq = [],
  hero_image_url = "",
  gallery_image_urls = []
}) {
  return {
    type: "addon",
    related_code,
    enabled: true,
    slug,
    nav_group: "addon",
    name,
    meta_title: `${name} in Oxford & Norfolk Counties | Rosie Dazzlers`,
    meta_description: `${name} service page for Oxford and Norfolk County customers, including process, products used, expectations, and booking fit.`,
    badge,
    hero_title: name,
    hero_intro,
    hero_image_url,
    gallery_image_urls,
    reasons_page_exists,
    process,
    equipment,
    highlights,
    things_to_know,
    official_links: [],
    related_products,
    faq
  };
}

const ADDON_PAGES = {
  "full-clay-treatment": addonPage({
    slug: "full-clay-treatment",
    related_code: "full_clay_treatment",
    name: "Full Clay Treatment",
    hero_intro: "A clay treatment removes bonded contamination that regular washing leaves behind, helping the paint feel smoother and preparing the surface for wax, sealant, graphene, or ceramic-style protection.",
    hero_image_url: "/assets/addons/full_clay_treatment.png",
    reasons_page_exists: [
      "Customers often search for clay bar treatment as its own service because they can feel or see contamination even after normal washing.",
      "This page explains why clay is usually a prep step, not a final finish by itself.",
      "It creates a better place to explain what contamination removal actually does before protection is applied."
    ],
    highlights: [
      "Best for rough-feeling paint, fallout, overspray, and contamination before a protection service.",
      "Usually paired with exterior detailing, wax, sealant, graphene, or ceramic-style services.",
      "Good for customers who want cleaner paint before a finishing layer is applied."
    ],
    process: [
      "Wash and inspect the vehicle exterior.",
      "Apply lubricant and work bonded contamination out of the paint safely.",
      "Re-check the surface by feel and appearance.",
      "Move into the next protection or finishing stage if selected."
    ],
    equipment: [
      "clay bars and clay mitts",
      "clay lubricant",
      "wash and drying tools",
      "surface inspection lighting"
    ],
    things_to_know: [
      "Clay removes bonded contamination, but it does not replace polishing if the paint has swirls or oxidation.",
      "Heavier contamination can mean more labour and a larger time window.",
      "A finishing layer works better when the paint has already been properly cleaned and decontaminated."
    ],
    related_products: [
      product("Chemical Guys Blue Clay Bar", "main decontamination product", "Used to pull bonded contamination out of the surface."),
      product("Chemical Guys Clay Luber", "lubrication support", "Helps the clay process move more safely across paint."),
      product("Rag Company Ultra Clay Mitt", "speed / maintenance option", "Useful for larger panels and maintenance-style decontamination."),
      product("Rag Company Ultra Clay Scrubber", "spot treatment support", "Helpful on targeted contaminated sections.")
    ],
    faq: [
      { q: "Do I need clay treatment before wax or graphene?", a: "If the paint still feels rough after washing, clay treatment is usually the right prep step before protection." },
      { q: "Does clay fix swirls?", a: "No. Clay removes contamination. Swirls and haze are handled by polishing or paint correction." }
    ]
  }),

  "two-stage-polish": addonPage({
    slug: "two-stage-polish",
    related_code: "two_stage_polish",
    name: "Two Stage Polish",
    hero_intro: "A two-stage polish is for vehicles that need a heavier correction pass followed by a refining pass, usually because the paint has deeper swirls, haze, or neglected gloss.",
    reasons_page_exists: [
      "This service needs its own page because customers often confuse polishing, paint correction, wax, and ceramic finishing.",
      "A two-stage polish is inspection-led work, so the page needs to explain why it is usually quoted rather than instantly priced."
    ],
    highlights: [
      "Best for heavier swirls, dull paint, and stronger gloss recovery goals.",
      "Usually paired with a protection step after polishing is complete.",
      "Not every vehicle needs this level of correction."
    ],
    process: [
      "Inspect paint condition and identify the level of defect removal that is realistic.",
      "Carry out the heavier first-stage polishing step.",
      "Refine the finish with a second-stage polish.",
      "Protect the corrected paint with the chosen finishing service."
    ],
    equipment: [
      "machine polishing tools",
      "inspection lighting",
      "refining products",
      "panel wipe and paint-prep support"
    ],
    things_to_know: [
      "Heavier polishing should be inspection-led because paint condition varies from vehicle to vehicle.",
      "A polish improves the finish before sealant, graphene, or ceramic-style protection is applied.",
      "This is not a shortcut substitute for proper washing and decontamination."
    ],
    related_products: [
      product("3 DScratch Remover", "refinement support", "Useful when the finish needs more correction or visual improvement before protection."),
      product("DIYDetail Ceramic Gloss", "post-polish finish support", "Useful after polishing when the customer wants gloss support or a maintenance-friendly finishing path.")
    ],
    faq: [
      { q: "Why is two-stage polish usually quote required?", a: "Because paint condition, size, defect severity, and customer expectations all change the labour needed." },
      { q: "Should I add protection after polishing?", a: "Yes. A corrected finish is usually followed by wax, sealant, graphene, or ceramic-style protection." }
    ]
  }),

  "high-grade-paint-sealant": addonPage({
    slug: "high-grade-paint-sealant",
    related_code: "high_grade_paint_sealant",
    name: "High Grade Paint Sealant",
    hero_intro: "A paint sealant is a protection-focused exterior finishing step for customers who want stronger durability than a simple shine product, without stepping into a full ceramic-style workflow.",
    hero_image_url: "/assets/addons/high_grade_paint_sealant.png",
    reasons_page_exists: [
      "This page exists because sealant is often misunderstood as being identical to wax or coating when it is really its own protection choice."
    ],
    highlights: [
      "Best for customers who want exterior protection and easier maintenance after proper prep.",
      "Usually added after exterior cleaning and, ideally, decontamination."
    ],
    process: [
      "Clean and inspect the paint first.",
      "Prep the surface so the sealant is not being laid over contamination.",
      "Apply the sealant evenly and allow the finish to level properly.",
      "Review aftercare and maintenance expectations."
    ],
    equipment: [
      "paint-safe prep tools",
      "application pads",
      "drying towels",
      "inspection lighting"
    ],
    things_to_know: [
      "Sealant works best on paint that has already been cleaned and properly prepared.",
      "It is a protection step, not a correction step.",
      "If the finish is rough or swirled, prep work may be needed first."
    ],
    related_products: [
      product("DIYDetail Ceramic Gloss", "finish support", "Useful where a customer wants strong gloss and support after paint prep."),
      product("Turtle Wax 53409 Hybrid Solutions Ceramic Spray Coating, Incredible Shine & Protection for Car Paint, Extreme Water Beading, Safe for Cars, Trucks, Motorcycles, RV's & More, 16 oz.", "sealant / topper support", "Useful when the goal is gloss, protection, and easy maintenance support."),
      product("Meguiar's Ultimate Quik Wax, 709 m L Durable Protection, Quick & Easy G 200924 C", "shorter-term finish support", "Useful for customers comparing wax-style versus longer-lasting protection paths.")
    ],
    faq: [
      { q: "Is sealant the same as wax?", a: "No. The customer experience is similar in that both are protection steps, but the durability and finish goals are not identical." },
      { q: "Do I need prep first?", a: "Yes. A protection layer works better when the exterior has already been cleaned properly." }
    ]
  }),

  "uv-protectant": addonPage({
    slug: "uv-protectant",
    related_code: "uv_protectant_applied_on_interior_panels",
    name: "UV Protectant",
    hero_intro: "Interior UV protectant helps support vinyl, plastic, and trim after the inside has been properly cleaned. It is a finishing step, not a substitute for full cleaning.",
    hero_image_url: "/assets/addons/uv_protectant_applied_on_interior_panels.png",
    reasons_page_exists: [
      "Customers often assume protectant can be applied over dirty trim. This page explains why prep matters.",
      "The page also clarifies why this add-on depends on the right base service."
    ],
    highlights: [
      "Best after full interior work or complete detail where the glass and trim have already been cleaned properly.",
      "Useful for dashboards, door panels, and trim that need a cleaner finished look."
    ],
    process: [
      "Clean the relevant interior surfaces first.",
      "Make sure glass and surrounding trim areas are prepared properly.",
      "Apply the protectant evenly to the appropriate panels.",
      "Review shine level and finish consistency."
    ],
    equipment: [
      "interior-safe applicators",
      "interior scrub and wipe tools",
      "glass-cleaning support",
      "trim finishing towels"
    ],
    things_to_know: [
      "Protectant is not a shortcut for cleaning dirty panels.",
      "This add-on makes the most sense after the interior has already been cleaned properly.",
      "If surrounding glass is still dirty, the finish can look uneven or unfinished."
    ],
    related_products: [
      product("Stoner Car Care 92034 2 PK 22 Ounce Trim Shine Protectant for Interior and Exterior Restores, Moisturizes, and Conditions Vinyl, Rubber, Leather and More, Pack of 2", "main protectant product", "Used when the goal is trim and panel protection after proper prep."),
      product("Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)", "prep support", "Useful for interior surface prep before protectant is applied."),
      product("Invisible Glass", "glass prep support", "Important when surrounding glass must be cleaned before the final interior finish looks right.")
    ],
    faq: [
      { q: "Can UV protectant be booked by itself?", a: "Usually it makes the most sense after the proper interior or complete-detail prep has already been done." },
      { q: "Why is glass prep mentioned?", a: "Because dirty glass around clean panels makes the finished interior look incomplete." }
    ]
  }),

  "de-ionizing-treatment": addonPage({
    slug: "de-ionizing-treatment",
    related_code: "de_ionizing_treatment",
    name: "De-Ionizing Treatment",
    hero_intro: "A de-ionizing treatment is used where mineral-heavy water, spotting, or rinse quality matter. It helps improve the wash and rinse path when water quality is part of the problem.",
    reasons_page_exists: [
      "Customers do not always understand that water quality can affect the finish and spotting risk after a wash.",
      "This page explains why mineral control and fallout work can matter in the real world."
    ],
    highlights: [
      "Best where water spotting, rinse quality, or mineral-heavy conditions are part of the concern.",
      "Useful when the finish needs cleaner rinse behaviour before protection work."
    ],
    process: [
      "Inspect the finish and identify whether spotting or fallout is part of the issue.",
      "Adjust the wash and rinse path around water-quality needs.",
      "Support the finish with decontamination if the vehicle also has bonded fallout.",
      "Move into the protection stage if selected."
    ],
    equipment: [
      "de-ionized water support",
      "wash and rinse equipment",
      "decontamination support products",
      "drying and inspection tools"
    ],
    things_to_know: [
      "A de-ionizing treatment is about water and mineral control, not magic correction of etched paint damage.",
      "If the surface already has contamination or fallout, decontamination may also be required."
    ],
    related_products: [
      product("HGWater Deionizer", "water-quality support", "Used where rinse quality and mineral reduction matter."),
      product("Car Pro Iron X", "fallout support", "Helpful when mineral or fallout-style contamination is also part of the finish issue.")
    ],
    faq: [
      { q: "Does de-ionizing remove etched damage?", a: "No. It helps with water-quality-related wash and rinse behaviour, but it does not repair already-etched paint by itself." },
      { q: "Can this be paired with other exterior services?", a: "Yes. It often makes sense as part of a larger exterior cleaning or prep workflow." }
    ]
  }),

  "de-badging": addonPage({
    slug: "de-badging",
    related_code: "de_badging",
    name: "De-Badging",
    hero_intro: "De-badging removes vehicle badges and adhesive safely, then follows with cleanup and finish recovery where needed so the panel does not look half-finished.",
    reasons_page_exists: [
      "Badge removal sounds simple, but adhesive cleanup and finish recovery are what usually make the difference in the final result."
    ],
    highlights: [
      "Best for customers removing factory or aftermarket emblems and wanting a cleaner finished look.",
      "Often followed by cleanup, light correction, or protection in the same area."
    ],
    process: [
      "Inspect badge placement and surrounding paint condition.",
      "Remove the emblem with care.",
      "Work the adhesive off safely.",
      "Refine the area and protect it if needed."
    ],
    equipment: [
      "adhesive-removal support",
      "surface-safe cleanup tools",
      "refinement products",
      "paint inspection lighting"
    ],
    things_to_know: [
      "Paint fade or ghosting can become visible once the badge is removed.",
      "Adhesive cleanup is often the most important part of the finish quality."
    ],
    related_products: [
      product("Adams Tar Remover", "adhesive cleanup support", "Useful when residue needs to be broken down safely."),
      product("Car Pro Tar X", "adhesive cleanup support", "Helps with sticky residue after badge removal."),
      product("3 DScratch Remover", "refinement support", "Useful when the panel needs visual cleanup after the badge area is cleared.")
    ],
    faq: [
      { q: "Will the paint always match under the badge?", a: "Not always. Older vehicles can show fade differences once the emblem is removed." },
      { q: "Can you protect the area after de-badging?", a: "Yes. That is often the best final step after the badge area is cleaned up." }
    ]
  }),

  "engine-cleaning": addonPage({
    slug: "engine-cleaning",
    related_code: "engine_cleaning",
    name: "Engine Cleaning",
    hero_intro: "Engine cleaning focuses on safer engine-bay presentation and cleanup, with inspection-led judgment around condition, age, and how aggressive the cleaning path should be.",
    reasons_page_exists: [
      "Engine-bay work needs its own page because it raises different concerns than paint or interior detailing."
    ],
    highlights: [
      "Best for dirty engine bays that need presentation improvement and cleanup.",
      "Useful before sale prep, project documentation, or routine maintenance presentation."
    ],
    process: [
      "Inspect the engine bay and identify sensitive areas.",
      "Choose a cleaning path that fits the bay condition and risk level.",
      "Clean and dry the bay carefully.",
      "Review the finished look and any condition limitations."
    ],
    equipment: [
      "targeted bay-cleaning tools",
      "controlled rinse / wipe workflow",
      "vacuum and access attachments",
      "inspection lighting"
    ],
    things_to_know: [
      "Older or heavily modified bays may need a gentler approach.",
      "Engine cleaning is not the same as mechanical repair or leak diagnosis.",
      "Inspection matters because not every engine bay should be approached the same way."
    ],
    related_products: [
      product("Adams Tar Remover", "cleanup support", "Useful where grime or sticky contamination is part of the engine-bay cleanup."),
      product("Meguiar's Heavy Duty Bug & Tar Remover", "heavy grime support", "Useful when heavier buildup needs extra attention."),
      product("9 Piece Shop Vac Attachments", "access support", "Helpful for tight spaces and controlled debris removal.")
    ],
    faq: [
      { q: "Can every engine bay be cleaned the same way?", a: "No. Condition, age, and engine-bay layout change the safest workflow." },
      { q: "Does engine cleaning fix leaks or repair problems?", a: "No. It is a detailing service, not mechanical diagnosis or repair." }
    ]
  }),

  "external-ceramic-coating": addonPage({
    slug: "external-ceramic-coating",
    related_code: "external_ceramic_coating",
    name: "External Ceramic Coating",
    hero_intro: "External ceramic coating is a coating-focused add-on page for customers who want exterior protection and cleaner maintenance behaviour after the paint has been properly prepared.",
    hero_image_url: "/assets/addons/external_ceramic_coating.svg",
    reasons_page_exists: [
      "This page separates the actual add-on from the broader search-facing ceramic coating page.",
      "It explains why prep quality matters more than simply applying a product."
    ],
    highlights: [
      "Best after exterior prep and, where needed, polishing or correction.",
      "Useful for customers who want a more deliberate exterior protection path."
    ],
    process: [
      "Clean and inspect the exterior.",
      "Decontaminate and refine if needed.",
      "Apply the chosen ceramic-style protection.",
      "Review cure and aftercare expectations."
    ],
    equipment: [
      "exterior prep tools",
      "coating applicators",
      "panel wipe support",
      "inspection lighting"
    ],
    things_to_know: [
      "Coating applied over poor prep will not give a professional result.",
      "Protection and correction are not the same stage of work."
    ],
    related_products: [
      product("10 HCeramic Coating", "main coating product", "Used where a stronger ceramic-style finish path is the goal."),
      product("DIYDetail Ceramic Gloss", "finish support", "Useful in the ceramic workflow and for maintenance support."),
      product("Turtle Wax 53409 Hybrid Solutions Ceramic Spray Coating, Incredible Shine & Protection for Car Paint, Extreme Water Beading, Safe for Cars, Trucks, Motorcycles, RV's & More, 16 oz.", "maintenance / topper", "Useful for maintaining ceramic-style behaviour.")
    ],
    faq: [
      { q: "Why is external ceramic coating usually quote required?", a: "Because prep, size, paint condition, and expected finish level all affect the labour." },
      { q: "Do I still need washing after ceramic coating?", a: "Yes. Protection helps with maintenance, but it does not eliminate normal wash care." }
    ]
  }),

  "graphene-finish": addonPage({
    slug: "graphene-finish",
    related_code: "external_graphene_fine_finish",
    name: "Graphene Finish",
    hero_intro: "A graphene finish is an exterior protection path for customers who want strong gloss behaviour and a more serious prep-and-protection workflow than a basic shine upgrade.",
    reasons_page_exists: [
      "Graphene is searched as its own service, so it needs a page that explains prep, products, and realistic expectations."
    ],
    highlights: [
      "Best after proper exterior cleaning and surface prep.",
      "Usually paired with decontamination and, where needed, correction before the finish is applied."
    ],
    process: [
      "Clean and inspect the paint.",
      "Decontaminate the surface if needed.",
      "Refine the finish if the paint condition calls for it.",
      "Apply the graphene finish and review maintenance expectations."
    ],
    equipment: [
      "exterior prep tools",
      "decontamination support",
      "application pads and towels",
      "inspection lighting"
    ],
    things_to_know: [
      "Graphene finish depends on the quality of the prep underneath it.",
      "It is not a shortcut around decontamination or correction if the paint is rough or swirled."
    ],
    related_products: [
      product("Adams Graphene Coating", "main graphene product", "Used when the customer wants a graphene-based protection path after proper prep."),
      product("Turtle Wax Graphene", "support / alternative product", "Useful for graphene-style protection and maintenance support."),
      product("Chemical Guys Clay Luber", "prep support", "Useful because graphene work still depends on proper decontamination prep where needed.")
    ],
    faq: [
      { q: "Can graphene be added to any wash?", a: "No. The vehicle still needs the right prep and, in many cases, an exterior or complete-detail base service first." },
      { q: "Why mention clay or prep on a graphene page?", a: "Because the finish is only as good as the surface underneath it." }
    ]
  }),

  "exterior-wax": addonPage({
    slug: "exterior-wax",
    related_code: "external_wax",
    name: "Exterior Wax",
    hero_intro: "Exterior wax is the simpler protection path for customers who want shine and short-term finish support after the paint has been properly cleaned.",
    reasons_page_exists: [
      "Wax is still a common customer search, so it deserves a page that clearly explains where it fits beside sealant, graphene, and ceramic options."
    ],
    highlights: [
      "Best for customers who want shine and a simpler protection step.",
      "Usually added after proper exterior cleaning and prep."
    ],
    process: [
      "Clean and inspect the paint.",
      "Prepare the surface so the wax is not being laid over contamination.",
      "Apply the wax evenly.",
      "Review maintenance expectations."
    ],
    equipment: [
      "wash and drying tools",
      "wax applicators",
      "finishing towels",
      "inspection lighting"
    ],
    things_to_know: [
      "Wax is a protection step, not a correction step.",
      "If the paint is contaminated or swirled, prep work may still be needed first."
    ],
    related_products: [
      product("Meguiar's Ultimate Quik Wax, 709 m L Durable Protection, Quick & Easy G 200924 C", "main wax support", "Useful where the customer wants shine and a straightforward protection step."),
      product("Turtle Wax Graphene", "comparison product", "Useful when the customer is deciding between a simpler wax path and a longer-lasting finish path.")
    ],
    faq: [
      { q: "Is wax stronger than ceramic coating?", a: "No. These are different protection paths with different durability and prep expectations." },
      { q: "Should the paint be cleaned properly first?", a: "Yes. Wax performs better when the paint is already properly cleaned." }
    ]
  }),

  "vinyl-wrapping": addonPage({
    slug: "vinyl-wrapping",
    related_code: "vinyl_wrapping",
    name: "Vinyl Wrapping",
    hero_intro: "Vinyl wrapping needs a page that explains prep, material handling, and how the surface condition underneath the wrap affects the final result.",
    reasons_page_exists: [
      "Wrapping is not just another add-on; it needs material and prep explanation."
    ],
    highlights: [
      "Best for customers planning a wrap-related service path and wanting clearer expectations.",
      "Prep and surface condition matter heavily."
    ],
    process: [
      "Inspect the panels and surface condition first.",
      "Clean and prep the surface properly.",
      "Plan material application around the panel condition and layout.",
      "Review aftercare expectations."
    ],
    equipment: [
      "prep tools",
      "surface-safe cleaners",
      "wrap support tools",
      "inspection lighting"
    ],
    things_to_know: [
      "Poor prep or contaminated paint can affect the finish quality of wrap work.",
      "This page is for education and planning, and final quote decisions should still be inspection-led."
    ],
    related_products: [
      product("Pro Vinyl Wrap Kit", "wrap support tools", "Used where the workflow includes vinyl wrap preparation and handling."),
      product("CAR Guys Plastic Restorer Bring Plastic, Rubber, and Vinyl Back to Life! User Friendly Trim Restorer Safe Auto Detailing Supplies 8 Oz Kit with Foam Applicator", "trim / vinyl support", "Useful in vinyl-adjacent trim prep or finish support.")
    ],
    faq: [
      { q: "Can vinyl wrapping be booked like a simple wash add-on?", a: "No. It is usually an inspection-led service path rather than a simple menu item." },
      { q: "Does prep matter for wrapping?", a: "Yes. Prep quality has a direct effect on the finished look and durability." }
    ]
  }),

  "window-tinting": addonPage({
    slug: "window-tinting",
    related_code: "window_tinting",
    name: "Window Tinting",
    hero_intro: "Window tinting needs a page that explains glass prep, inspection, and the difference between quick menu thinking and proper tint workflow planning.",
    reasons_page_exists: [
      "Customers search window tinting as its own service topic, so it should not be buried in a generic pricing list."
    ],
    highlights: [
      "Best for customers who want a clearer explanation of prep, fit, and follow-up expectations.",
      "Glass cleanliness and inspection quality matter."
    ],
    process: [
      "Inspect the glass and current condition first.",
      "Prepare the glass properly.",
      "Plan the tint workflow and service fit.",
      "Review follow-up care and expectations."
    ],
    equipment: [
      "glass prep tools",
      "cleaning and inspection tools",
      "application support tools",
      "detail-safe finishing tools"
    ],
    things_to_know: [
      "Tint-related work is not just a quick glass wipe and application step.",
      "Clean glass and a controlled workflow matter for the finished result."
    ],
    related_products: [
      product("Invisible Glass", "glass prep product", "Useful because clean glass is part of a professional tint workflow."),
      product("Invisible Glass Glass Coating", "glass-finish support", "Useful where the customer is comparing clean-glass and protection options around tint-related work.")
    ],
    faq: [
      { q: "Why is tinting separated into its own page?", a: "Because it needs better explanation than a single line item inside a general add-on list." },
      { q: "Does glass prep matter?", a: "Yes. Clean, properly prepared glass is part of a better finished result." }
    ]
  })
};

const SPECIAL_PAGES = {
  "ceramic-coating": {
    type: "addon",
    related_code: "external_ceramic_coating",
    enabled: true,
    slug: "ceramic-coating",
    nav_group: "special-service",
    name: "Ceramic Coating",
    meta_title: "Ceramic Coating in Oxford & Norfolk Counties | Rosie Dazzlers",
    meta_description: "Learn how Rosie Dazzlers approaches ceramic coating prep, product choice, and maintenance expectations.",
    badge: "Special detailing page",
    hero_title: "Ceramic coating",
    hero_intro: "This is the broader search-facing ceramic coating page. It explains the prep, finish goals, and maintenance expectations behind ceramic-style protection.",
    hero_image_url: PRODUCTS["10 HCeramic Coating"],
    gallery_image_urls: [],
    reasons_page_exists: [
      "Customers search ceramic coating as a stand-alone service topic.",
      "This page gives a broader education path than the narrower add-on-specific coating page."
    ],
    process: [
      "Inspect the paint and identify the finish goal.",
      "Prep the vehicle properly before protection is applied.",
      "Apply the ceramic-style protection.",
      "Review cure and aftercare expectations."
    ],
    equipment: [
      "coating applicators",
      "paint-prep tools",
      "inspection lighting",
      "finishing towels"
    ],
    highlights: [
      "Best for customers comparing ceramic protection against simpler finish options.",
      "Works best when the paint has already been properly prepped."
    ],
    things_to_know: [
      "Ceramic coating helps with maintenance and gloss behaviour, but it does not replace proper wash care.",
      "Prep matters more than simply adding a product."
    ],
    official_links: [],
    related_products: [
      product("10 HCeramic Coating", "main coating product", "Core ceramic-style protection product in the workflow."),
      product("DIYDetail Ceramic Gloss", "finish support", "Useful in ceramic workflow support and maintenance."),
      product("Turtle Wax 53409 Hybrid Solutions Ceramic Spray Coating, Incredible Shine & Protection for Car Paint, Extreme Water Beading, Safe for Cars, Trucks, Motorcycles, RV's & More, 16 oz.", "maintenance / topper", "Useful for supporting ceramic-style behaviour between deeper services.")
    ],
    faq: [
      { q: "Is ceramic coating instant?", a: "No. Prep, condition, and aftercare all affect the final result." },
      { q: "Do I still need washing after ceramic coating?", a: "Yes. Protection helps, but it does not remove the need for regular wash care." }
    ]
  },

  "pet-hair-removal": {
    type: "addon",
    related_code: null,
    enabled: true,
    slug: "pet-hair-removal",
    nav_group: "special-service",
    name: "Pet Hair Removal",
    meta_title: "Pet Hair Removal in Oxford & Norfolk Counties | Rosie Dazzlers",
    meta_description: "Pet hair removal page for customers comparing interior recovery, cleanup effort, and booking fit.",
    badge: "Special detailing page",
    hero_title: "Pet Hair Removal",
    hero_intro: "Pet hair removal needs a dedicated page because light surface hair and deeply embedded hair are very different jobs.",
    hero_image_url: PRODUCTS["9 Piece Shop Vac Attachments"],
    gallery_image_urls: [],
    reasons_page_exists: [
      "Pet hair is one of the most common search-led interior detailing pain points.",
      "This page is a better explanation tool than a short generic add-on line."
    ],
    process: [
      "Inspect where the hair is embedded.",
      "Vacuum and agitate the affected areas.",
      "Refine the fabric and trim cleanup.",
      "Pair with deeper interior cleaning if needed."
    ],
    equipment: [
      "vacuum attachments",
      "interior agitation tools",
      "fabric cleanup tools",
      "detail brushes"
    ],
    highlights: [
      "Best for pet owners dealing with seats, carpets, cargo areas, and embedded fibres.",
      "Often pairs well with deeper interior service."
    ],
    things_to_know: [
      "Embedded hair takes longer than loose surface hair.",
      "Odour, dander, and stains can change the best service path."
    ],
    official_links: [],
    related_products: [
      product("9 Piece Shop Vac Attachments", "vacuum access support", "Useful in rails, edges, and tight interior spaces."),
      product("Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)", "interior agitation support", "Useful where the interior needs more controlled agitation during cleanup.")
    ],
    faq: [
      { q: "Can pet hair removal be quoted from one photo?", a: "Not always. Loose hair and deeply embedded hair are very different workloads." }
    ]
  },

  "odor-removal": {
    type: "addon",
    related_code: null,
    enabled: true,
    slug: "odor-removal",
    nav_group: "special-service",
    name: "Odor Removal",
    meta_title: "Odor Removal in Oxford & Norfolk Counties | Rosie Dazzlers",
    meta_description: "Odor removal page explaining source-cleaning, inspection, and what detailing can and cannot solve.",
    badge: "Special detailing page",
    hero_title: "Odor Removal",
    hero_intro: "Odor removal works best when the source is cleaned, not just covered up.",
    hero_image_url: PRODUCTS["Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)"],
    gallery_image_urls: [],
    reasons_page_exists: [
      "Customers often search odor removal as its own problem rather than as a package add-on.",
      "This page clarifies source-cleaning expectations."
    ],
    process: [
      "Inspect the likely source area.",
      "Clean the source as directly as possible.",
      "Reassess the cabin condition.",
      "Escalate to repair advice if the issue is beyond detailing."
    ],
    equipment: [
      "interior agitation tools",
      "vacuum tools",
      "detail-safe cleanup workflow",
      "inspection process"
    ],
    highlights: [
      "Best for smoke, spill, pet, or general cabin odour concerns.",
      "Often requires more than a simple deodorizer step."
    ],
    things_to_know: [
      "Masking a smell is not the same as removing the source.",
      "Water intrusion or mould may require mechanical or body repair beyond detailing."
    ],
    official_links: [],
    related_products: [
      product("Autofiber Scrub Ninja Interior Scrubbing Sponge (5”x 3”) for Leather, Plastic, Vinyl and Upholstery Cleaning (Black Gray)", "source-cleaning support", "Useful for controlled surface cleaning before deodorizing."),
      product("9 Piece Shop Vac Attachments", "access support", "Helps reach rails, seams, and tight interior zones where debris and odour sources hide.")
    ],
    faq: [
      { q: "Can every smell be fixed with detailing alone?", a: "No. Some odour sources come from leaks, mould, or damage that needs repair, not just cleaning." }
    ]
  },

  "headlight-restoration": {
    type: "addon",
    related_code: null,
    enabled: true,
    slug: "headlight-restoration",
    nav_group: "special-service",
    name: "Headlight Restoration",
    meta_title: "Headlight Restoration in Oxford & Norfolk Counties | Rosie Dazzlers",
    meta_description: "Headlight restoration page for cloudy or oxidized lenses and clearer appearance expectations.",
    badge: "Special detailing page",
    hero_title: "Headlight Restoration",
    hero_intro: "Headlight restoration focuses on clarity recovery for lenses that have become cloudy, dull, or oxidized.",
    hero_image_url: PRODUCTS["3 DScratch Remover"],
    gallery_image_urls: [],
    reasons_page_exists: [
      "This is one of the most common search-led special-detail topics.",
      "It needs a clearer explanation than a short menu line."
    ],
    process: [
      "Inspect the lens condition.",
      "Work through the restoration path that matches the lens condition.",
      "Refine the clarity as much as the lens allows.",
      "Review realistic expectations."
    ],
    equipment: [
      "restoration tools",
      "refinement products",
      "inspection lighting",
      "protective finishing steps"
    ],
    highlights: [
      "Best for cloudy or oxidized lenses.",
      "Useful for cosmetic improvement and cleaner front-end presentation."
    ],
    things_to_know: [
      "Not every damaged lens can be restored to the same finish level.",
      "Condition and age affect the realistic outcome."
    ],
    official_links: [],
    related_products: [
      product("3 DScratch Remover", "refinement support", "Useful where the restoration workflow needs a refinement stage.")
    ],
    faq: [
      { q: "Will every lens come back perfectly clear?", a: "Not always. Condition and damage history change what is realistic." }
    ]
  },

  "paint-correction": {
    type: "addon",
    related_code: "two_stage_polish",
    enabled: true,
    slug: "paint-correction",
    nav_group: "special-service",
    name: "Paint Correction",
    meta_title: "Paint Correction in Oxford & Norfolk Counties | Rosie Dazzlers",
    meta_description: "Paint correction page for swirl reduction, haze cleanup, gloss recovery, and quote-led polishing decisions.",
    badge: "Special detailing page",
    hero_title: "Paint Correction",
    hero_intro: "Paint correction is the inspection-led path for customers who want stronger defect reduction and gloss recovery than a simple wash or protection service can provide.",
    hero_image_url: PRODUCTS["3 DScratch Remover"],
    gallery_image_urls: [],
    reasons_page_exists: [
      "Paint correction is one of the clearest high-intent search topics in detailing.",
      "This page gives a stronger explanation path than a general package list."
    ],
    process: [
      "Inspect the paint condition and expected outcome.",
      "Choose the right correction path.",
      "Refine the finish.",
      "Protect the result with the chosen finishing service."
    ],
    equipment: [
      "machine polishing tools",
      "inspection lighting",
      "prep support",
      "finishing products"
    ],
    highlights: [
      "Best for swirl reduction, haze cleanup, and gloss recovery.",
      "Usually inspection-led rather than instant-price work."
    ],
    things_to_know: [
      "Paint correction is about finish improvement, not simply adding a protection layer.",
      "Condition and expectations both affect the labour required."
    ],
    official_links: [],
    related_products: [
      product("3 DScratch Remover", "correction support", "Useful where the finish needs deeper visual improvement."),
      product("DIYDetail Ceramic Gloss", "post-correction support", "Useful where the corrected finish is being carried into a gloss or protection path.")
    ],
    faq: [
      { q: "Why is paint correction usually quoted?", a: "Because paint condition, vehicle size, and finish expectations all affect the labour." }
    ]
  }
};

const TOWN_PAGES = {
  "tillsonburg-auto-detailing": {
    type: "location",
    related_code: null,
    enabled: true,
    slug: "tillsonburg-auto-detailing",
    nav_group: "town",
    name: "Tillsonburg auto detailing",
    meta_title: "Mobile Auto Detailing in Tillsonburg | Rosie Dazzlers",
    meta_description: "Tillsonburg mobile auto detailing page with local service-area guidance, watering restrictions, parking reminders, and booking information.",
    badge: "Town-focused detailing page",
    hero_title: "Mobile auto detailing in Tillsonburg",
    hero_intro: "Tillsonburg deserves its own page because local searchers often want town-specific confidence signals, service-area confirmation, and practical setup information before they book.",
    hero_image_url: "/assets/brand/rosie-reviews-fallback.svg",
    gallery_image_urls: [],
    reasons_page_exists: [
      "Town-first searchers often convert better when the page clearly matches the place they typed into search.",
      "A dedicated Tillsonburg page gives you room for local reminders and more useful trust-building content."
    ],
    process: [
      "Confirm driveway access and service fit.",
      "Use the live booking planner for scheduling and package logic.",
      "Keep review proof and recent work visible close to the CTA."
    ],
    equipment: [
      "mobile detailing setup",
      "booking planner and live pricing tools",
      "local trust and review proof blocks"
    ],
    highlights: [
      "Strongest fit for Tillsonburg-area search intent.",
      "Useful for local customers who want clearer service-area confirmation."
    ],
    things_to_know: [
      "Town of Tillsonburg outdoor water restrictions generally run from May 1 to September 30.",
      "Tillsonburg also has overnight winter parking restrictions from November 15 to March 31, typically 2 a.m. to 6 a.m.",
      "Customers using household electricity may care about lower-cost evening, weekend, and holiday TOU periods."
    ],
    official_links: [
      { label: "Tillsonburg water restrictions", url: "https://www.tillsonburg.ca/living-here/water-and-wastewater/water-restrictions/" },
      { label: "Tillsonburg winter parking", url: "https://www.tillsonburg.ca/living-here/roads-and-sidewalks/parking/" },
      { label: "Ontario electricity rates", url: "https://www.oeb.ca/consumer-information-and-protection/electricity-rates" }
    ],
    related_products: [],
    faq: [
      { q: "Why give Tillsonburg its own page?", a: "Because town-specific search intent is easier to satisfy with a focused local page than with only a broad county page." }
    ]
  },

  "woodstock-ingersoll-auto-detailing": {
    type: "location",
    related_code: null,
    enabled: true,
    slug: "woodstock-ingersoll-auto-detailing",
    nav_group: "town",
    name: "Woodstock / Ingersoll auto detailing",
    meta_title: "Mobile Auto Detailing in Woodstock & Ingersoll | Rosie Dazzlers",
    meta_description: "Oxford County mobile auto detailing page for Woodstock and Ingersoll customers with local travel, watering, and booking guidance.",
    badge: "Town-focused detailing page",
    hero_title: "Mobile auto detailing in Woodstock and Ingersoll",
    hero_intro: "This page gives Woodstock and Ingersoll customers a clearer Oxford County service path than a more generic county mention.",
    hero_image_url: "/assets/brand/rosie-reviews-fallback.svg",
    gallery_image_urls: [],
    reasons_page_exists: [
      "Combined town pages can support stronger local wording without forcing separate pages too early.",
      "This page helps answer local service-fit and route questions more clearly."
    ],
    process: [
      "Confirm route fit and booking details.",
      "Keep service expectations and proof close to the CTA."
    ],
    equipment: [
      "mobile detailing setup",
      "route-aware booking flow",
      "review and proof blocks"
    ],
    highlights: [
      "Useful for Oxford County customers comparing local options.",
      "Supports stronger local wording for two closely linked service areas."
    ],
    things_to_know: [
      "Woodstock publishes outside-water timing information for residential and commercial use.",
      "Local parking and route planning can change the best mobile appointment window."
    ],
    official_links: [
      { label: "Woodstock watering restrictions", url: "https://www.cityofwoodstock.ca/living-in-woodstock/water-and-utilities/water/watering-restrictions-and-conservation/" },
      { label: "Ingersoll parking", url: "https://www.ingersoll.ca/en/town-hall/parking.aspx" }
    ],
    related_products: [],
    faq: [
      { q: "Why combine Woodstock and Ingersoll?", a: "Because they share route and service-area relevance while still helping the page stay focused for local search intent." }
    ]
  },

  "simcoe-delhi-auto-detailing": {
    type: "location",
    related_code: null,
    enabled: true,
    slug: "simcoe-delhi-auto-detailing",
    nav_group: "town",
    name: "Simcoe / Delhi auto detailing",
    meta_title: "Mobile Auto Detailing in Simcoe & Delhi | Rosie Dazzlers",
    meta_description: "Norfolk County mobile auto detailing page for Simcoe and Delhi customers with local service guidance and Norfolk water / parking references.",
    badge: "Town-focused detailing page",
    hero_title: "Mobile auto detailing in Simcoe and Delhi",
    hero_intro: "This Norfolk-side page gives Simcoe and Delhi customers a more relevant place-specific service path than a single wide service-area page alone.",
    hero_image_url: "/assets/brand/rosie-reviews-fallback.svg",
    gallery_image_urls: [],
    reasons_page_exists: [
      "This page helps Norfolk-side customers confirm coverage and understand local fit before they book."
    ],
    process: [
      "Confirm service area and route fit.",
      "Use the live booking planner to move into scheduling."
    ],
    equipment: [
      "mobile detailing setup",
      "route-aware booking flow",
      "proof and review support blocks"
    ],
    highlights: [
      "Useful for Norfolk-side search intent and trust-building."
    ],
    things_to_know: [
      "Norfolk watering restrictions generally run from May 15 to September 15 using odd/even-day scheduling windows.",
      "Parking and local municipal rules can affect the practical service setup in some areas."
    ],
    official_links: [
      { label: "Norfolk watering restrictions", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/" },
      { label: "Norfolk parking", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/" }
    ],
    related_products: [],
    faq: [
      { q: "Why mention watering and parking?", a: "Because mobile detailing works best when exterior-work conditions and service setup expectations are clear in advance." }
    ]
  },

  "port-dover-auto-detailing": {
    type: "location",
    related_code: null,
    enabled: true,
    slug: "port-dover-auto-detailing",
    nav_group: "town",
    name: "Port Dover auto detailing",
    meta_title: "Mobile Auto Detailing in Port Dover | Rosie Dazzlers",
    meta_description: "Port Dover mobile auto detailing page with coastal-area service notes, parking references, and booking guidance.",
    badge: "Town-focused detailing page",
    hero_title: "Mobile auto detailing in Port Dover",
    hero_intro: "Port Dover deserves its own page because coastal and seasonal traffic patterns change how local customers think about access, parking, and booking windows.",
    hero_image_url: "/assets/brand/rosie-reviews-fallback.svg",
    gallery_image_urls: [],
    reasons_page_exists: [
      "This page gives Port Dover searchers stronger location confirmation and trust signals.",
      "It also gives room for seasonal and parking-related guidance."
    ],
    process: [
      "Confirm service-area fit and route conditions.",
      "Use the same live booking planner for final booking steps."
    ],
    equipment: [
      "mobile detailing setup",
      "route-aware booking flow",
      "proof and review blocks"
    ],
    highlights: [
      "Useful for coastal-area service intent and local trust-building."
    ],
    things_to_know: [
      "Port Dover has seasonal paid-parking considerations in some areas.",
      "Norfolk’s summer watering restrictions can still affect outside-water timing."
    ],
    official_links: [
      { label: "Norfolk parking", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/" },
      { label: "Norfolk paid parking", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/paid-parking/" },
      { label: "Norfolk watering restrictions", url: "https://www.norfolkcounty.ca/home-property-and-neighbourhood/water-and-wastewater/water-conservation/watering-restrictions/" }
    ],
    related_products: [],
    faq: [
      { q: "Why give Port Dover its own page?", a: "Because town-first searchers often respond better when the page clearly matches the exact place they searched." }
    ]
  }
};

const DEFAULT_LANDING_PAGES = {
  pages: {
    ...SPECIAL_PAGES,
    ...TOWN_PAGES,
    ...ADDON_PAGES
  }
};

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

const SYSTEM_LANDING_PAGES = cloneLandingPages(DEFAULT_LANDING_PAGES);

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
  const pages = candidate && typeof candidate === "object" && candidate.pages && typeof candidate.pages === "object"
    ? candidate.pages
    : {};

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
    hero_image_url: String(page?.hero_image_url || "").trim(),
    gallery_image_urls: normalizeStringArray(page?.gallery_image_urls),
    reasons_page_exists: normalizeStringArray(page?.reasons_page_exists),
    process: normalizeStringArray(page?.process),
    equipment: normalizeStringArray(page?.equipment),
    highlights: normalizeStringArray(page?.highlights),
    things_to_know: normalizeStringArray(page?.things_to_know),
    official_links: normalizeLinkArray(page?.official_links),
    related_products: normalizeProductRefs(page?.related_products),
    faq: faq
      .map((item) => ({ q: String(item?.q || "").trim(), a: String(item?.a || "").trim() }))
      .filter((item) => item.q && item.a)
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
    note: String(item?.note || "").trim(),
    image_url: String(item?.image_url || "").trim()
  })).filter((item) => item.name || item.image_url);
}

function cloneLandingPages(payload) {
  const raw = JSON.parse(JSON.stringify(payload || DEFAULT_LANDING_PAGES));
  const pages = raw.pages && typeof raw.pages === "object" ? raw.pages : {};
  for (const [slug, page] of Object.entries(pages)) pages[slug] = normalizePage({ ...page, slug: normalizeSlug(slug) });
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
