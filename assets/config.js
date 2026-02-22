// assets/config.js
// Site config + pricing to match your backend package codes & sizes.

export const ASSETS_BASE = "https://assets.rosiedazzlers.ca";

export const CONTACT = {
  phone: "226-752-7613",
  email: "info@rosiedazzlers.ca",
  serviceArea: "Norfolk & Oxford Counties",
};

// Must match your backend PRICING keys in functions/api/checkout.js
export const PRICING = {
  premium_wash:    { label: "Premium Wash",    subtitle: "Quick exterior clean",  small: 8500,  mid: 10500, oversize: 12500 },
  basic_detail:    { label: "Basic Detail",    subtitle: "Quick interior clean",  small: 11500, mid: 13500, oversize: 17000 },
  complete_detail: { label: "Complete Detail", subtitle: "Our #1 choice",         small: 31900, mid: 36900, oversize: 41900 },
  interior_detail: { label: "Interior Detail", subtitle: "Full interior detailing", small: 19500, mid: 22000, oversize: 24500 },
  exterior_detail: { label: "Exterior Detail", subtitle: "Full exterior detailing", small: 19500, mid: 22000, oversize: 24500 },
};

// Must match your backend ADDONS keys in functions/api/checkout.js
export const ADDONS = {
  engine_bay:     { label: "Engine Bay Detail", cents: 11900 },
  pet_hair:       { label: "Pet Hair Removal",  cents:  8900 },
  odor_treatment: { label: "Odour Treatment",   cents: 12900 },
};

// Deposit rule must match backend
export function calcDepositCents(packageCode) {
  return (packageCode === "premium_wash" || packageCode === "basic_detail") ? 5000 : 10000;
}

export function money(cents) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format((cents || 0) / 100);
}
