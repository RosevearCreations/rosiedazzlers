// Build 274 compatibility + operating-rule wrapper.
// The original pricing catalogue implementation is retained verbatim in pricing-catalog-client-legacy.js.
// This wrapper keeps that API stable while converging public booking presentation on the retained Rosie rule:
// Rosie brings standard detailing water and power; customers provide a safe/private work area.
import * as legacy from "./pricing-catalog-client-legacy.js";
export * from "./pricing-catalog-client-legacy.js";

const ROSIE_PUBLIC_REQUIREMENTS = Object.freeze([
  "Driveway/private work area preferred",
  "Rosie brings standard detailing water and power; unusual site/access requirements must be confirmed before dispatch",
  "Staff verify county water-use, runoff and site-access reminders before dispatch"
]);

const ROSIE_ACCESS_RULE = "Confirm a safe driveway/private work area, slope, parking, apartment/condo access and building rules before dispatch. Rosie brings standard detailing water and power unless an explicitly approved service setup says otherwise.";

export const DEFAULT_BOOKING_RULES = Object.freeze({
  ...legacy.DEFAULT_BOOKING_RULES,
  public_requirements: [...ROSIE_PUBLIC_REQUIREMENTS]
});

function applyRosieOperatingRules(catalog) {
  const source = catalog && typeof catalog === "object" ? catalog : {};
  const bookingRules = source.booking_rules && typeof source.booking_rules === "object" ? source.booking_rules : {};
  return {
    ...source,
    booking_rules: {
      ...bookingRules,
      public_requirements: [...ROSIE_PUBLIC_REQUIREMENTS]
    },
    public_requirements: [...ROSIE_PUBLIC_REQUIREMENTS],
    service_areas: (Array.isArray(source.service_areas) ? source.service_areas : []).map((row) => ({
      ...row,
      access_rule: ROSIE_ACCESS_RULE
    }))
  };
}

export function normalizePricingCatalog(raw) {
  return applyRosieOperatingRules(legacy.normalizePricingCatalog(raw));
}

export async function loadPricingCatalogClient(options = {}) {
  return applyRosieOperatingRules(await legacy.loadPricingCatalogClient(options));
}

const normalizedPath = String(globalThis.location?.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
if (normalizedPath === "/book") {
  import("./booking-quick-start-v274.js")
    .then(() => import("./booking-retention-v275.js"))
    .then(() => import("./customer-rebook-v285.js"))
    .catch((error) => {
      console.warn("Optional Build 285 booking presentation could not be loaded; legacy booking remains available.", error);
    });
}
