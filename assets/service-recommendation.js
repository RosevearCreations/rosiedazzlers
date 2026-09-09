// Build 366: deterministic, advisory service recommendation engine.
// Pricing/catalog data remains authoritative; this module only ranks supplied package rows.

const GOAL_PROFILES = Object.freeze({
  quick_exterior: Object.freeze({
    label: "a quick exterior refresh",
    terms: Object.freeze([["exterior", 6], ["quick", 5], ["maintenance", 4], ["wash", 3], ["refresh", 2]])
  }),
  quick_interior: Object.freeze({
    label: "a quick interior reset",
    terms: Object.freeze([["interior", 6], ["quick", 5], ["refresh", 4], ["maintenance", 3], ["daily driver", 2]])
  }),
  deep_interior: Object.freeze({
    label: "a deeper interior clean",
    terms: Object.freeze([["interior", 7], ["deep", 6], ["shampoo", 4], ["pet hair", 3], ["odour", 3], ["salt", 2], ["recovery", 2]])
  }),
  full_reset: Object.freeze({
    label: "an inside-and-out reset",
    terms: Object.freeze([["inside and outside", 8], ["full detail", 7], ["best all around", 6], ["reset", 4], ["family vehicle", 3], ["pre-sale", 2]])
  }),
  exterior_finish: Object.freeze({
    label: "exterior finish and protection prep",
    terms: Object.freeze([["exterior", 6], ["paint prep", 6], ["gloss", 5], ["protection", 4], ["sealant", 4], ["clay", 3], ["coating", 3]])
  }),
  unsure: Object.freeze({
    label: "the safest all-around starting point",
    terms: Object.freeze([["best all around", 8], ["full detail", 7], ["inside and outside", 7], ["unsure", 4], ["reset", 3]])
  })
});

const CONDITION_LABELS = Object.freeze({
  light: "light / maintained",
  moderate: "moderate",
  heavy: "heavier / recovery"
});

const SIZE_LABELS = Object.freeze({
  small: "small vehicle",
  mid: "mid-sized vehicle",
  oversize: "oversized vehicle"
});

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeGoal(value) {
  const key = normalizeText(value).replace(/[\s-]+/g, "_");
  return Object.prototype.hasOwnProperty.call(GOAL_PROFILES, key) ? key : "unsure";
}

function normalizeCondition(value) {
  const key = normalizeText(value);
  return Object.prototype.hasOwnProperty.call(CONDITION_LABELS, key) ? key : "moderate";
}

function normalizeVehicleSize(value) {
  const key = normalizeText(value);
  return Object.prototype.hasOwnProperty.call(SIZE_LABELS, key) ? key : "";
}

function packageSearchText(pkg) {
  const included = Array.isArray(pkg?.included_services)
    ? pkg.included_services.map((row) => typeof row === "string" ? row : row?.name)
    : [];
  const tags = Array.isArray(pkg?.recommendation_tags) ? pkg.recommendation_tags : [];
  return normalizeText([
    pkg?.name,
    pkg?.subtitle,
    pkg?.display_alias,
    pkg?.customer_goal,
    pkg?.service_level,
    pkg?.best_for,
    pkg?.chooser_prompt,
    ...tags,
    ...included
  ].filter(Boolean).join(" | "));
}

function priceForSize(pkg, vehicleSize) {
  const prices = pkg?.prices_cad && typeof pkg.prices_cad === "object" ? pkg.prices_cad : {};
  const preferred = vehicleSize ? prices[vehicleSize] : undefined;
  const fallback = preferred ?? prices.mid ?? prices.small ?? prices.oversize;
  const amount = Number(fallback);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.POSITIVE_INFINITY;
}

function conditionScore(text, condition) {
  if (condition === "light") {
    let score = 0;
    if (/maintenance|quick|refresh/.test(text)) score += 4;
    if (/deep|recovery|full detail/.test(text)) score -= 2;
    return score;
  }
  if (condition === "heavy") {
    let score = 0;
    if (/deep|recovery|shampoo|full detail|full interior|full exterior/.test(text)) score += 5;
    if (/maintenance|quick exterior|quick interior/.test(text)) score -= 5;
    return score;
  }
  return /detail|reset|refresh/.test(text) ? 1 : 0;
}

function scorePackage(pkg, profile, condition) {
  const text = packageSearchText(pkg);
  let score = conditionScore(text, condition);
  const matchedSignals = [];
  for (const [term, weight] of profile.terms) {
    if (!text.includes(term)) continue;
    score += weight;
    matchedSignals.push(term);
  }
  return { score, matchedSignals, text };
}

function buildReason(pkg, goal, condition, vehicleSize, matchedSignals) {
  const profile = GOAL_PROFILES[goal];
  const parts = [`Best catalogue match for ${profile.label} with ${CONDITION_LABELS[condition]} condition.`];
  if (vehicleSize) parts.push(`Compared using the ${SIZE_LABELS[vehicleSize]} price only as a lower-cost tie-breaker.`);
  if (pkg?.best_for) parts.push(String(pkg.best_for).trim());
  if (condition === "heavy" && pkg?.photo_estimate_recommended === true) {
    parts.push("Photos or booking notes can help confirm the final scope for heavier-condition work.");
  }
  if (matchedSignals.length) parts.push(`Matched on: ${matchedSignals.slice(0, 3).join(", ")}.`);
  return parts.join(" ");
}

export function recommendService({ packages, goal = "unsure", condition = "moderate", vehicleSize = "" } = {}) {
  const rows = Array.isArray(packages) ? packages.filter((pkg) => pkg && String(pkg.code || "").trim()) : [];
  if (!rows.length) return null;

  const normalizedGoal = normalizeGoal(goal);
  const normalizedCondition = normalizeCondition(condition);
  const normalizedSize = normalizeVehicleSize(vehicleSize);
  const profile = GOAL_PROFILES[normalizedGoal];

  const ranked = rows.map((pkg, index) => {
    const scored = scorePackage(pkg, profile, normalizedCondition);
    return {
      pkg,
      index,
      score: scored.score,
      matchedSignals: scored.matchedSignals,
      price: priceForSize(pkg, normalizedSize)
    };
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.price !== b.price) return a.price - b.price;
    return a.index - b.index;
  });

  const winner = ranked[0];
  const runnerUp = ranked[1];
  const scoreGap = runnerUp ? winner.score - runnerUp.score : winner.score;
  const confidence = winner.score <= 0 ? "guided" : scoreGap >= 4 ? "strong" : "close";

  return Object.freeze({
    packageCode: String(winner.pkg.code),
    packageName: String(winner.pkg.name || winner.pkg.code),
    goal: normalizedGoal,
    condition: normalizedCondition,
    vehicleSize: normalizedSize,
    score: winner.score,
    confidence,
    matchedSignals: Object.freeze([...winner.matchedSignals]),
    reason: buildReason(winner.pkg, normalizedGoal, normalizedCondition, normalizedSize, winner.matchedSignals)
  });
}

export const recommendationOptions = Object.freeze({
  goals: Object.freeze(Object.entries(GOAL_PROFILES).map(([value, row]) => Object.freeze({ value, label: row.label }))),
  conditions: Object.freeze(Object.entries(CONDITION_LABELS).map(([value, label]) => Object.freeze({ value, label })))
});
