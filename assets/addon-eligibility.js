// Build 367: deterministic, advisory add-on eligibility and recommendation engine.
// Canonical pricing/catalog rows remain authoritative. This module never mutates booking state.

const CONDITION_TERMS = Object.freeze({
  pet_hair: Object.freeze([["pet hair", 10], ["hair", 5], ["vacuum", 2]]),
  salt_stains: Object.freeze([["salt", 10], ["carpet", 4], ["extraction", 3], ["stain", 3]]),
  odor: Object.freeze([["odor", 10], ["odour", 10], ["ozone", 6], ["deodor", 5], ["smoke", 4]]),
  stains_shampoo: Object.freeze([["stain", 8], ["shampoo", 8], ["extraction", 7], ["carpet", 4], ["seat", 3]]),
  paint_swirls: Object.freeze([["polish", 9], ["paint correction", 9], ["swirl", 8], ["clay", 4], ["scratch", 3]]),
  protection: Object.freeze([["ceramic", 9], ["sealant", 8], ["wax", 7], ["graphene", 7], ["protect", 5], ["clay", 3]]),
  headlights: Object.freeze([["headlight", 12], ["lens", 5], ["oxid", 3]]),
  maintained_interior: Object.freeze([["interior", 3], ["protect", 2], ["vacuum", 2]]),
  maintained_exterior: Object.freeze([["wax", 4], ["sealant", 4], ["protect", 3], ["exterior", 2]]),
  full_reset: Object.freeze([["protect", 3], ["clay", 3], ["deodor", 2]]),
  work_truck: Object.freeze([["pet hair", 2], ["deodor", 2], ["extraction", 2], ["protect", 2]])
});

const GOAL_TERMS = Object.freeze({
  quick_exterior: Object.freeze([["wax", 4], ["sealant", 4], ["exterior", 2]]),
  quick_interior: Object.freeze([["interior", 3], ["vacuum", 2], ["protect", 2]]),
  deep_interior: Object.freeze([["pet hair", 5], ["stain", 5], ["shampoo", 5], ["extraction", 5], ["odour", 4], ["odor", 4]]),
  full_reset: Object.freeze([["protect", 3], ["clay", 3], ["deodor", 2]]),
  exterior_finish: Object.freeze([["polish", 5], ["paint correction", 5], ["ceramic", 5], ["sealant", 4], ["clay", 4], ["wax", 3]]),
  unsure: Object.freeze([])
});

function text(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function codeList(value) {
  return Array.isArray(value) ? value.map((row) => text(typeof row === "string" ? row : row?.code)).filter(Boolean) : [];
}

function addonSearchText(addon) {
  const notes = Array.isArray(addon?.notes) ? addon.notes : [];
  const tags = Array.isArray(addon?.recommendation_tags) ? addon.recommendation_tags : [];
  return text([
    addon?.code, addon?.name, addon?.category, addon?.type, addon?.description,
    addon?.requirement_note, addon?.best_for, addon?.customer_goal, ...notes, ...tags
  ].filter(Boolean).join(" | "));
}

export function addonEligibleForPackage(addon, packageCode = "") {
  if (!addon || !text(addon.code)) return false;
  const allowed = codeList(addon.requires_package_codes_any);
  return addon.standalone_allowed === true || !allowed.length || allowed.includes(text(packageCode));
}

export function addonIncludedByPackage(addon, pkg = null) {
  if (!addon || !pkg) return false;
  const packageCode = text(pkg.code);
  const addonCode = text(addon.code);
  const addonIncludedWith = [
    ...codeList(addon.included_with_package_codes),
    ...codeList(addon.included_in_package_codes)
  ];
  if (packageCode && addonIncludedWith.includes(packageCode)) return true;
  const packageIncluded = [
    ...codeList(pkg.included_addon_codes),
    ...codeList(pkg.included_addons)
  ];
  return !!addonCode && packageIncluded.includes(addonCode);
}

function addonPrice(addon, vehicleSize = "") {
  const prices = addon?.prices_cad && typeof addon.prices_cad === "object" ? addon.prices_cad : {};
  const raw = (vehicleSize && prices[vehicleSize] != null) ? prices[vehicleSize] : (prices.mid ?? prices.small ?? prices.oversize ?? addon?.price_cad);
  const amount = Number(raw);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.POSITIVE_INFINITY;
}

function scoreTerms(haystack, terms, matched) {
  let score = 0;
  for (const [term, weight] of terms || []) {
    if (!haystack.includes(term)) continue;
    score += weight;
    matched.push(term);
  }
  return score;
}

function uniqueStrings(values) {
  return [...new Set((values || []).map((value) => text(value)).filter(Boolean))];
}

export function recommendAddons({
  addons,
  pkg = null,
  packageCode = "",
  vehicleSize = "",
  conditionFlags = [],
  goal = "unsure",
  selectedCodes = [],
  maxRecommendations = 3
} = {}) {
  const rows = Array.isArray(addons) ? addons.filter((row) => row && text(row.code)) : [];
  const selected = new Set(uniqueStrings(selectedCodes));
  const flags = uniqueStrings(conditionFlags);
  const normalizedGoal = text(goal).replace(/[\s-]+/g, "_");
  const effectivePackageCode = text(packageCode || pkg?.code);
  const limit = Math.max(1, Math.min(6, Number(maxRecommendations) || 3));

  const ranked = [];
  rows.forEach((addon, index) => {
    const addonCode = text(addon.code);
    if (selected.has(addonCode)) return;
    if (!addonEligibleForPackage(addon, effectivePackageCode)) return;
    if (addonIncludedByPackage(addon, pkg)) return;

    const haystack = addonSearchText(addon);
    const matched = [];
    let score = 0;
    for (const flag of flags) score += scoreTerms(haystack, CONDITION_TERMS[flag], matched);
    score += scoreTerms(haystack, GOAL_TERMS[normalizedGoal] || [], matched);

    // No positive evidence means no recommendation. We do not invent an upsell.
    if (score <= 0) return;
    ranked.push({ addon, index, score, matched: uniqueStrings(matched), price: addonPrice(addon, vehicleSize) });
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.price !== b.price) return a.price - b.price; // lower-cost tie-breaker only
    return a.index - b.index;
  });

  return Object.freeze(ranked.slice(0, limit).map((row) => Object.freeze({
    addonCode: String(row.addon.code),
    addonName: String(row.addon.name || row.addon.code),
    score: row.score,
    quoteRequired: row.addon.quote_required === true,
    matchedSignals: Object.freeze([...row.matched]),
    reason: `Relevant to ${row.matched.slice(0, 3).join(", ") || "the selected vehicle needs"}.${row.addon.quote_required === true ? " Final scope is condition-quoted." : ""}`
  })));
}

export function addonAttachRate({ exposures = 0, accepts = 0 } = {}) {
  const denominator = Math.max(0, Number(exposures) || 0);
  const numerator = Math.max(0, Math.min(denominator, Number(accepts) || 0));
  return Object.freeze({
    exposures: denominator,
    accepts: numerator,
    attachRatePct: denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null
  });
}
