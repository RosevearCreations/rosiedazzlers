// Read-only pricing authority comparison. No catalog repair, booking or payment writes.
import { applyCommercialAccuracy } from "./commercial-accuracy.js";

const SIZES = ["small", "mid", "oversize"];
const PACKAGE_FIELDS = ["name", "deposit_cad", ...SIZES.map((size) => `prices_cad.${size}`)];
const ADDON_FIELDS = ["name", "quote_required", ...SIZES.map((size) => `prices_cad.${size}`)];

function fieldValue(row, field) {
  if (!row) return null;
  const value = field.split(".").reduce((item, part) => item?.[part], row);
  return value === undefined ? null : value;
}

function rowIndex(rows) {
  return new Map((Array.isArray(rows) ? rows : []).filter((row) => row?.code).map((row) => [row.code, row]));
}

function compareGroup(group, fields, bundledRows, appRows, checkoutRows, publicRows, dbAvailable) {
  const sources = [rowIndex(bundledRows), rowIndex(appRows), rowIndex(checkoutRows), rowIndex(publicRows)];
  const codes = [...new Set(sources.flatMap((source) => [...source.keys()]))].sort();
  const findings = [];
  for (const code of codes) {
    for (const field of fields) {
      const [bundled, app_management, checkout, public_api] = sources.map((source) => fieldValue(source.get(code), field));
      const differences = [];
      if (dbAvailable && !Object.is(app_management, bundled)) differences.push("app_management_vs_bundled");
      if (!Object.is(public_api, checkout)) differences.push("public_vs_checkout");
      if (dbAvailable && !Object.is(public_api, app_management)) differences.push("public_vs_app_management");
      if (differences.length) findings.push({ group, code, field, bundled, app_management: dbAvailable ? app_management : null, checkout, public_api, differences });
    }
  }
  return findings;
}

export function buildPricingSourceParity614({ bundled, appManagement = null, checkoutCatalog, dbAvailable = false, updatedAt = null, warning = null } = {}) {
  const hasDbRow = dbAvailable && !!appManagement && typeof appManagement === "object";
  const source = hasDbRow ? "app_management_settings" : "bundled_fallback";
  // The authenticated route supplies the exact same normalized/merged catalog
  // used by checkout. Keeping this comparator pure avoids a second DB fetch.
  if (!checkoutCatalog?.packages || !checkoutCatalog?.addons) throw new Error("Checkout catalog projection is required.");
  const publicCatalog = applyCommercialAccuracy(checkoutCatalog);
  const findings = [
    ...compareGroup("packages", PACKAGE_FIELDS, bundled?.packages, hasDbRow ? appManagement.packages : null, checkoutCatalog.packages, publicCatalog.packages, hasDbRow),
    ...compareGroup("addons", ADDON_FIELDS, bundled?.addons, hasDbRow ? appManagement.addons : null, checkoutCatalog.addons, publicCatalog.addons, hasDbRow)
  ];
  const publicCheckoutCount = findings.filter((item) => item.differences.includes("public_vs_checkout")).length;
  return {
    ok: true,
    build: "614",
    read_only: true,
    db_verified: hasDbRow,
    source_status: source,
    updated_at: hasDbRow ? updatedAt : null,
    warning: warning || (!hasDbRow ? "App Management row was not verified; effective catalog source may fall back to bundled data." : null),
    projections: {
      bundled: "Committed JSON fallback",
      app_management: "Stored pricing_catalog row (not the public override)",
      checkout: "Server checkout/quote-to-booking catalog before public override",
      public_api: "Expected public API projection after source-owned commercial accuracy override"
    },
    summary: {
      package_count: checkoutCatalog.packages.length,
      addon_count: checkoutCatalog.addons.length,
      differing_fields: findings.length,
      public_checkout_differences: publicCheckoutCount,
      owner_decision_required: findings.length > 0 || !hasDbRow
    },
    findings,
    recommendation: publicCheckoutCount
      ? "HOLD PRICE POLICY: public package/add-on fields differ from the checkout/quote catalog. Owner must approve the intended price authority and separately authorize any changes. Do not repair, publish or edit values from this report."
      : findings.length
        ? "Review differences with the owner before changing any pricing or quote-required rules."
        : hasDbRow ? "No compared source differences detected. This does not prove a live customer checkout or payment." : "Recheck database access before claiming live pricing parity."
  };
}
