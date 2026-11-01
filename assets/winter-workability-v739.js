// Build 739 — shared, side-effect-free worksite and winter review gate.
// This is a precautionary scheduling gate, not a weather forecast or a
// temperature capability certification. Owner-reviewed capability evidence is
// not approved for automatic publication/booking (Builds 486–487).
const REVIEW_MONTHS = new Set([11, 12, 1, 2, 3]);

export function coldSeasonReview739(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ""));
  if (!match) return false;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  return REVIEW_MONTHS.has(month);
}

export function evaluateWorkability739({ serviceDate, serviceArea, county, areaVerified, worksite } = {}) {
  const site = worksite && typeof worksite === "object" ? worksite : {};
  const issues = [];
  const seasonReview = coldSeasonReview739(serviceDate);
  const countyName = String(county || "").trim();

  if (!areaVerified || !["Oxford County", "Norfolk County"].includes(countyName)) {
    issues.push("We need to verify this service address is within an approved Oxford or Norfolk service zone, including travel and local rules.");
  }
  if (String(site.access || "") !== "private_safe") {
    issues.push("A safe, permissioned driveway/private work area must be confirmed; streets, shared lots, condo approvals, and uncertain access need staff review.");
  }
  if (String(site.surface || "") !== "clear_level") {
    issues.push("Blocked, icy, steep, slippery, or unconfirmed work surfaces require staff review before a visit.");
  }
  if (String(site.weather || "") !== "suitable") {
    issues.push("Cold, freezing, snow, ice, high wind, precipitation, or unknown conditions need a weather/workability review.");
  }
  if (String(site.runoff || "") !== "compliant") {
    issues.push("Local water-use, runoff, drainage, or building restrictions have not been confirmed; staff must review the official county/municipal rules.");
  }
  if (seasonReview) {
    issues.push("November–March dates are a precautionary cold-season review window. No package or indoor/outdoor winter capability is approved for automatic reservation without owner-confirmed evidence.");
  }

  return Object.freeze({
    build: 739,
    status: issues.length ? "staff_review_required" : "request_can_proceed",
    canAutomaticallyReserve: issues.length === 0,
    seasonReview,
    county: ["Oxford County", "Norfolk County"].includes(countyName) ? countyName : null,
    serviceArea: String(serviceArea || "").trim(),
    issues: Object.freeze(issues),
    utilities: "Rosie supplies water and power for standard detailing; safe on-site access remains required.",
    boundary: "A clear worksite questionnaire does not certify future weather, waive local bylaws, or guarantee dispatch. Staff recheck conditions before service."
  });
}
