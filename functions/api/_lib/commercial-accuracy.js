// functions/api/_lib/commercial-accuracy.js
// Build 388 — Service, Add-On & Commercial Accuracy Convergence.
// Source-owned, schema-neutral commercial rules applied after editable catalog merge.
// This module does not write business data, change provider state, or invent fixed
// economics for work whose scope must be inspected.

export const CANONICAL_PACKAGE_PRICES_CAD = Object.freeze({
  premium_wash: Object.freeze({ small: 85, mid: 105, oversize: 125 }),
  basic_detail: Object.freeze({ small: 229, mid: 269, oversize: 309 }),
  complete_detail: Object.freeze({ small: 319, mid: 369, oversize: 419 }),
  interior_detail: Object.freeze({ small: 195, mid: 220, oversize: 245 }),
  exterior_detail: Object.freeze({ small: 195, mid: 220, oversize: 245 })
});

const STANDARD_PRICING_NOTE = "Starting prices are in CAD before HST. Vehicle size, condition, access, contamination and requested outcome can change labour. Inspection-led or quote-required work is not finalized until the condition and scope are reviewed.";

const PACKAGE_COMMERCIAL_RULES = Object.freeze({
  premium_wash: {
    pricing_mode: "vehicle_class_base",
    condition_factors: ["vehicle size", "heavy road film", "bug/tar buildup", "unsafe or restricted site access"],
    quote_triggers: ["excessive contamination beyond a maintenance wash", "paint decontamination or correction requested", "access conditions that change the normal mobile setup"]
  },
  basic_detail: {
    pricing_mode: "vehicle_class_base",
    condition_factors: ["vehicle size", "interior soil load", "pet hair", "staining", "odor or spill history"],
    quote_triggers: ["deep shampoo/extraction becomes the main task", "embedded pet hair or severe staining", "spill migration below carpet or seats", "biohazard, mold or water-intrusion concerns"]
  },
  complete_detail: {
    pricing_mode: "vehicle_class_base",
    condition_factors: ["vehicle size", "interior soil load", "exterior contamination", "staining", "pet hair", "odor"],
    quote_triggers: ["restoration-level extraction or disassembly", "paint correction beyond normal cleaning", "biohazard, mold or active water-intrusion concerns", "condition indicates full-day or multi-stage recovery"]
  },
  interior_detail: {
    pricing_mode: "vehicle_class_base",
    condition_factors: ["vehicle size", "fabric/material mix", "stain load", "pet hair", "odor", "spill depth"],
    quote_triggers: ["seat removal or carpet lifting is indicated", "liquid reached padding or floor pan", "mold/rust/water-intrusion risk", "restoration scope materially exceeds normal shampoo/extraction"]
  },
  exterior_detail: {
    pricing_mode: "vehicle_class_base",
    condition_factors: ["vehicle size", "bonded contamination", "tar/sap", "paint condition", "protection requested"],
    quote_triggers: ["overspray or severe bonded contamination", "machine correction is requested or recommended", "coating preparation exceeds normal exterior-detail scope", "unsafe paint/clear-coat condition is discovered"]
  }
});

const ADDON_OVERRIDES = Object.freeze({
  headlight_restoration_addon: {
    quote_required: true,
    pricing_mode: "condition_assessed",
    pricing_basis: "lens oxidation/yellowing severity, coating failure, lens damage, prior restoration and whether one or both lamps are affected",
    duration_label: "60–180+ min",
    scope_includes: [
      "Inspect lens oxidation, yellowing and surface condition before choosing the restoration process",
      "Mask/protect adjacent surfaces and use the least-aggressive process that can safely restore clarity",
      "Refine the lens and apply the selected UV-protection step when the lens is serviceable"
    ],
    scope_excludes: [
      "Replacement of cracked, internally damaged or leaking lamp assemblies",
      "Guaranteed removal of internal haze, crazing or damage below the restorable lens surface",
      "Body or electrical repair around the headlamp assembly"
    ],
    customer_prep: ["Send clear photos of both headlights in daylight when possible", "Tell us about previous sanding, coating or restoration attempts"],
    aftercare: ["Follow the cure/wash guidance given for the UV-protection product used", "Avoid abrasive cleaners on restored lenses"],
    quote_triggers: ["severe yellowing or oxidation", "crazing/cracking/internal moisture", "failed prior coating or restoration", "different condition between left and right lamps"]
  },
  carpet_shampoo: {
    pricing_mode: "starting_price",
    pricing_basis: "carpet area, stain load, liquid penetration, drying requirement and whether trim/seat removal is indicated",
    duration_label: "60–180+ min; restoration cases can become full-day work",
    scope_includes: ["Vacuum and inspect accessible carpet", "Spot-treat suitable stains", "Shampoo/extract accessible carpet using moisture appropriate to the condition"],
    scope_excludes: ["Seat removal, carpet lifting or underlay removal unless separately inspected and authorized", "Mold remediation, flood remediation or structural rust repair", "Guaranteed removal of permanent dye transfer or chemically set stains"],
    customer_prep: ["Remove personal items from floors and under seats", "Tell us what spilled, when it happened and whether the carpet stayed wet"],
    aftercare: ["Allow adequate ventilation/drying time", "Report returning odor or dampness because it can indicate contamination below the visible carpet"],
    quote_triggers: ["spill reached padding or floor pan", "standing water or recurring dampness", "seat removal or carpet lifting is needed", "mold/rust concern", "full-day extraction/restoration is indicated"]
  },
  seat_shampoo: {
    pricing_mode: "starting_price",
    pricing_basis: "seat count, fabric type, stain load, liquid penetration and drying requirement",
    duration_label: "60–180+ min",
    scope_includes: ["Inspect fabric and stain type", "Vacuum and spot-treat suitable areas", "Shampoo/extract accessible cloth seating with controlled moisture"],
    scope_excludes: ["Seat disassembly or upholstery repair", "Biohazard remediation", "Guaranteed removal of permanent dye, bleach or material damage"],
    customer_prep: ["Remove child seats and personal items where practical", "Tell us what caused major stains or spills"],
    aftercare: ["Allow seats to dry fully before prolonged use", "Keep windows/ventilation appropriate to weather and technician guidance"],
    quote_triggers: ["deep saturation into foam", "unknown/biohazard contamination", "seat removal is needed", "large-area restoration exceeds normal shampoo scope"]
  },
  odor_treatment: {
    quote_required: true,
    pricing_mode: "condition_assessed",
    pricing_basis: "odor source, duration, affected materials, contamination depth and whether source removal/cleaning must precede treatment",
    duration_label: "60–240+ min plus ventilation; source-remediation cases vary",
    scope_includes: ["Identify likely odor source before treatment", "Clean/treat reachable contributing surfaces appropriate to the accepted scope", "Use odor-treatment/ozone/deodorizing process only where suitable and safe"],
    scope_excludes: ["Masking an active leak, mold source, biohazard or contaminated padding without correcting the source", "A guarantee that smoke, decomposition, mold or deeply absorbed odors can always be fully removed", "Mechanical HVAC repair"],
    customer_prep: ["Remove people, pets, food and personal items as directed before ozone treatment", "Disclose smoke, spill, animal, mold or water-intrusion history"],
    aftercare: ["Vehicle must be ventilated after ozone/deodorizing treatment before normal occupancy", "Address any underlying leak/contamination source or odor may return"],
    quote_triggers: ["smoke or long-term odor saturation", "mold/water intrusion", "contaminated padding or inaccessible source", "biohazard concern", "odor returns after normal cleaning"]
  },
  pet_hair_removal: {
    pricing_mode: "condition_assessed",
    pricing_basis: "hair volume, fiber type, static/embedded hair, cargo area and number of affected seating/carpet surfaces",
    duration_label: "30–180+ min",
    scope_includes: ["Assess hair severity and affected materials", "Use vacuum, agitation and hair-removal tools appropriate to the surface", "Remove accessible pet hair to the accepted severity band"],
    scope_excludes: ["Guaranteed removal of every embedded hair from damaged/open-weave fabric", "Odor or stain remediation unless separately selected", "Upholstery repair"],
    customer_prep: ["Remove pet bedding, crates and loose belongings", "Send photos for heavy-hair estimates when possible"],
    aftercare: ["Regular vacuuming and seat/cargo covers can reduce future embedded hair"],
    quote_triggers: ["dense embedded hair across multiple rows/cargo area", "hair packed into seams or open-weave fabric", "pet staining/odor adds a separate remediation scope"]
  },
  two_stage_polish: {
    quote_required: true,
    pricing_mode: "condition_assessed",
    pricing_basis: "paint size, hardness, defect depth, clear-coat safety, test-spot result and correction target",
    duration_label: "4–8+ hr; larger or complex vehicles may require longer",
    scope_includes: ["Inspect paint and establish realistic correction target", "Perform suitable wash/decontamination before correction", "Compound/polish in staged sections using a test-spot-led process"],
    scope_excludes: ["Chasing defects through unsafe clear-coat thickness", "Repair of failed clear coat, chips, deep scratches through paint or body damage", "Guaranteed 100% defect removal"],
    customer_prep: ["Disclose repaint/bodywork history if known", "Provide photos of priority defects when requesting an estimate"],
    aftercare: ["Use safe wash methods to reduce re-marring", "Follow protection/coating cure instructions when correction is paired with protection"],
    quote_triggers: ["deep defects", "failed/thin clear coat", "repainted panels", "hard paint or large vehicle", "correction target materially exceeds the initial estimate"]
  },
  external_ceramic_coating: protectionRules("ceramic coating", "5–10+ hr plus cure requirements"),
  external_graphene_fine_finish: protectionRules("graphene protection", "2–5+ hr plus product cure requirements"),
  external_wax: protectionRules("wax protection", "45–120+ min"),
  ceramic_spray_wax: protectionRules("ceramic spray protection", "45–120+ min"),
  high_grade_paint_sealant: protectionRules("paint sealant", "45–90+ min"),
  windshield_ceramic_coating: {
    pricing_mode: "starting_price",
    pricing_basis: "glass size, contamination/water spotting and preparation required before coating",
    scope_includes: ["Clean and decontaminate serviceable exterior glass", "Prepare glass for the selected coating", "Apply coating according to product requirements"],
    scope_excludes: ["Glass-chip/crack repair", "Guaranteed removal of etched mineral damage without separate polishing", "Wiper or mechanical repair"],
    customer_prep: ["Advise us of recent glass treatments or visibility problems"],
    aftercare: ["Observe the stated cure period before washing or using aggressive glass chemicals"],
    quote_triggers: ["heavy mineral etching", "coating failure/residue from prior treatment", "glass polishing required before coating"]
  },
  full_clay_treatment: {
    pricing_mode: "starting_price",
    pricing_basis: "vehicle size and bonded-contamination severity; overspray and severe fallout require inspection",
    scope_includes: ["Wash/prepare paint as required for safe decontamination", "Mechanically remove suitable bonded contamination", "Reinspect paint after decontamination"],
    scope_excludes: ["Paint correction/polishing unless separately authorized", "Body-shop overspray recovery beyond the accepted scope", "Repair of etched or damaged paint"],
    customer_prep: ["Tell us about industrial fallout, paint overspray, tree sap or unusual contamination"],
    aftercare: ["Protection is recommended after decontamination because existing wax/sealant can be reduced"],
    quote_triggers: ["paint overspray", "dense industrial fallout", "severe sap/contamination", "marring risk indicates polishing may also be needed"]
  },
  de_badging: {
    quote_required: true,
    pricing_mode: "condition_assessed",
    pricing_basis: "badge count, attachment method, adhesive age, paint condition, ghosting and polishing requirement",
    scope_includes: ["Inspect attachment/paint condition", "Remove suitable badges and adhesive with paint-safe methods", "Refine residue/ghosting only within the accepted scope"],
    scope_excludes: ["Body repair, repainting or hole filling", "Removal where clips/fasteners require body-panel disassembly unless separately authorized", "Guaranteed elimination of paint fade/ghosting"],
    customer_prep: ["Confirm which badges/emblems are to be removed"],
    aftercare: ["Follow protection guidance for freshly cleaned/polished areas"],
    quote_triggers: ["multiple/aged badges", "unknown fasteners", "paint fade/ghosting", "adhesive damage or polishing requirement"]
  },
  engine_cleaning: {
    quote_required: true,
    pricing_mode: "condition_assessed",
    pricing_basis: "engine-bay size, grease level, access, aftermarket wiring and sensitive-component risk",
    scope_includes: ["Inspect for obvious leaks, exposed wiring and unsafe conditions", "Clean accessible engine-bay surfaces with controlled product/moisture", "Dress suitable surfaces where included"],
    scope_excludes: ["Mechanical diagnosis or repair", "Cleaning active fluid leaks as a substitute for repair", "High-risk work around exposed/faulty electrical components"],
    customer_prep: ["Disclose known leaks, electrical modifications or recent engine-bay work"],
    aftercare: ["Repair active leaks/mechanical faults separately; detailing does not correct their cause"],
    quote_triggers: ["heavy grease", "active fluid leak", "exposed/faulty wiring", "dense aftermarket equipment or restricted access"]
  },
  bug_tar_removal: {
    pricing_mode: "starting_price",
    pricing_basis: "affected area, age/thickness of tar/bug residue and paint sensitivity",
    scope_includes: ["Inspect affected surfaces", "Use paint-safe chemical/mechanical removal suited to contamination", "Reinspect for remaining etching or damage"],
    scope_excludes: ["Paint correction for etching/staining unless separately selected", "Repair of chipped or chemically damaged paint"],
    customer_prep: ["Point out known road-paint, asphalt, sap or chemical exposure"],
    aftercare: ["Reapply suitable protection where decontamination has reduced existing wax/sealant"],
    quote_triggers: ["large-area tar", "road-paint/overspray", "etched residue", "repeated decontamination or polishing required"]
  },
  vinyl_wrapping: installationRules("vinyl wrapping"),
  window_tinting: installationRules("window tinting")
});

function protectionRules(label, durationLabel) {
  return {
    quote_required: true,
    pricing_mode: "condition_assessed",
    pricing_basis: `vehicle size, paint condition and preparation/correction needed before ${label}`,
    duration_label: durationLabel,
    scope_includes: ["Inspect paint and establish the preparation level", "Wash/decontaminate and panel-prep to the accepted level", `Apply the selected ${label} to suitable prepared surfaces`],
    scope_excludes: ["Paint correction beyond the accepted preparation level", "Repair of failed clear coat, chips, deep scratches or body damage", "Durability promises outside product/care/environment limits"],
    customer_prep: ["Disclose recent bodywork, coatings or paint protection products if known", "Keep the vehicle available for the stated cure period when required"],
    aftercare: ["Follow product-specific cure and first-wash instructions", "Use coating/protection-safe wash methods and maintenance products"],
    quote_triggers: ["bonded contamination", "swirls/oxidation requiring correction", "failed prior coating", "large/complex vehicle", "paint condition prevents safe preparation"]
  };
}

function installationRules(label) {
  return {
    quote_required: true,
    pricing_mode: "inspection_quote",
    pricing_basis: `${label} scope, material selection, surface condition, removal/prep requirements and installation complexity`,
    scope_includes: ["Confirm requested coverage/material and inspect installation surfaces", "Prepare accepted surfaces for installation", `Install ${label} only to the specifically quoted scope`],
    scope_excludes: ["Body/glass repair", "Hidden damage correction", "Removal of unknown prior material or adhesive unless included in the quote"],
    customer_prep: ["Provide clear photos and the exact requested coverage", "Disclose existing tint/wrap/film and prior body/glass work"],
    aftercare: ["Follow installer guidance for cure, washing and edge/window care"],
    quote_triggers: ["existing film removal", "damaged/contaminated substrate", "complex curves/trim/disassembly", "specialty material or non-standard coverage"]
  };
}

export function applyCommercialAccuracy(catalog) {
  const source = catalog && typeof catalog === "object" ? catalog : {};
  const packages = (Array.isArray(source.packages) ? source.packages : []).map(applyPackageAccuracy);
  const addons = (Array.isArray(source.addons) ? source.addons : []).map(applyAddonAccuracy);

  const packageMap = Object.create(null);
  const addonMap = Object.create(null);
  for (const pkg of packages) if (pkg?.code) packageMap[pkg.code] = pkg;
  for (const addon of addons) if (addon?.code) addonMap[addon.code] = addon;

  return {
    ...source,
    packages,
    addons,
    package_map: packageMap,
    addon_map: addonMap,
    commercial_accuracy: {
      build: 388,
      currency: "CAD",
      tax_note: "Prices shown are before HST unless explicitly stated otherwise.",
      estimate_rule: "Condition-sensitive work uses starting prices or inspection-led estimates; expanded work requires customer authorization before proceeding.",
      source_owned_package_matrix: true
    }
  };
}

function applyPackageAccuracy(pkg) {
  const code = String(pkg?.code || "").trim();
  const canonical = CANONICAL_PACKAGE_PRICES_CAD[code];
  const rule = PACKAGE_COMMERCIAL_RULES[code] || {};
  if (!canonical) return pkg;
  return {
    ...pkg,
    prices_cad: { ...canonical },
    ...rule,
    pricing_note: STANDARD_PRICING_NOTE,
    estimate_rule: "The listed package price is the base for the selected vehicle class. If inspection shows restoration-level or separately priced work, the expanded scope is quoted before it is added."
  };
}

function applyAddonAccuracy(addon) {
  const code = String(addon?.code || "").trim();
  const override = ADDON_OVERRIDES[code] || {};
  const category = String(addon?.category || "service add-on").trim();
  const quoteRequired = override.quote_required === true || addon?.quote_required === true;
  const merged = {
    ...addon,
    ...override,
    quote_required: quoteRequired,
    pricing_mode: override.pricing_mode || addon?.pricing_mode || (quoteRequired ? "condition_assessed" : "starting_price"),
    pricing_basis: override.pricing_basis || addon?.pricing_basis || `${category}, vehicle size, condition, access and requested result`,
    duration_label: override.duration_label || addon?.duration_label || "Varies with vehicle size and condition",
    pricing_note: addon?.pricing_note || STANDARD_PRICING_NOTE,
    scope_includes: arrayOr(override.scope_includes, addon?.scope_includes, ["Confirm condition and accepted scope before work begins", "Complete the service-specific preparation and treatment steps", "Review the result and any follow-up recommendation"]),
    scope_excludes: arrayOr(override.scope_excludes, addon?.scope_excludes, ["Repair/replacement work outside detailing", "Work beyond the accepted estimate without customer authorization", "Unsafe, biohazard or specialist remediation outside the accepted detailing scope"]),
    customer_prep: arrayOr(override.customer_prep, addon?.customer_prep, ["Remove personal items that block the service area", "Share photos/history when condition may materially affect the estimate"]),
    aftercare: arrayOr(override.aftercare, addon?.aftercare, ["Follow technician/product-specific drying, cure and wash guidance", "Report an underlying leak, contamination source or damage if it becomes apparent after cleaning"]),
    quote_triggers: arrayOr(override.quote_triggers, addon?.quote_triggers, ["condition is materially heavier than the selected starting-price band", "hidden contamination/damage changes the safe process", "extra disassembly, correction or restoration becomes necessary"])
  };

  if (!Array.isArray(merged.condition_pricing) || merged.condition_pricing.length === 0) {
    merged.condition_pricing = [{
      label: quoteRequired ? "Inspection-led scope" : "Standard starting scope",
      price_label: quoteRequired ? "Inspection quote" : formatStartingPrice(merged),
      time_label: merged.duration_label,
      when: quoteRequired
        ? `Final ${String(merged.name || "service").toLowerCase()} scope is confirmed after condition review.`
        : "The vehicle fits the normal service scope without restoration-level complications."
    }];
  }

  merged.escalation_rule = "If inspection shows work beyond the selected band or safe detailing scope, pause and obtain customer authorization for the revised estimate or recommend the appropriate specialist path.";
  return merged;
}

function arrayOr(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return [...value];
  }
  return [];
}

function formatStartingPrice(addon) {
  const map = addon?.prices_cad && typeof addon.prices_cad === "object" ? addon.prices_cad : null;
  const values = map ? [map.small, map.mid, map.oversize].map(Number).filter(Number.isFinite) : [];
  if (values.length) return `From $${Math.min(...values)} CAD`;
  const one = Number(addon?.price_cad);
  return Number.isFinite(one) ? `From $${one} CAD` : "Estimate after scope review";
}
